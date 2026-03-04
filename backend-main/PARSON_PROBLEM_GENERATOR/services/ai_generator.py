import os
import json
import time
import logging
import google.generativeai as genai

# Set up logging for debugging
logger = logging.getLogger(__name__)


class GeminiAPIKeyMissing(Exception):
    """Raised when Gemini API key is not configured"""
    pass


class GeminiResponseInvalid(Exception):
    """Raised when Gemini response is invalid or malformed"""
    pass


def generate_problem(difficulty, topic=None, max_retries=2):
    """
    Generate a programming problem using Google Gemini API with retry logic.
    
    Args:
        difficulty (str): Problem difficulty ('EASY', 'MEDIUM', 'HARD')
        topic (str, optional): Topic/focus for the problem
        max_retries (int): Maximum number of retry attempts (default: 2)
        
    Returns:
        dict: Parsed problem data from Gemini or error response
        
    Raises:
        GeminiAPIKeyMissing: If API key is not configured
    """
    # Load API key from environment with debug logging
    api_key = os.getenv("GEMINI_API_KEY")
    
    # Debug logging to verify API key loading
    logger.info(f"Gemini API key check: {'Found' if api_key else 'Missing'}")
    if api_key:
        logger.info(f"API key length: {len(api_key)} characters")
        logger.info(f"API key preview: {api_key[:10]}...{api_key[-4:]}")
    else:
        logger.error("Gemini API key not found in environment variables")
        raise GeminiAPIKeyMissing("Gemini API key not configured")
    
    if not api_key:
        raise GeminiAPIKeyMissing("Gemini API key not configured")
    
    # Validate difficulty
    if difficulty not in ('EASY', 'MEDIUM', 'HARD'):
        raise ValueError("Difficulty must be EASY, MEDIUM, or HARD")
    
    # Check for rate limiting by testing a simple call first
    try:
        logger.info("Testing API connectivity before main call...")
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-flash-latest')
        
        # Simple test call
        test_response = model.generate_content("test", generation_config=genai.types.GenerationConfig(
            temperature=0.7,
            max_output_tokens=10,
        ))
        
        if not test_response or not hasattr(test_response, 'text'):
            logger.error("API connectivity test failed - likely rate limited")
            return _create_fallback_problem(difficulty, topic)
            
    except Exception as e:
        logger.error(f"API connectivity test failed: {str(e)}")
        if 'quota' in str(e).lower() or 'rate' in str(e).lower() or 'limit' in str(e).lower():
            logger.warning("API rate limit detected - using fallback")
            return _create_fallback_problem(difficulty, topic)
        else:
            logger.error("API error - using fallback")
            return _create_fallback_problem(difficulty, topic)
    
    # Initialize Gemini client
    logger.info("Initializing Gemini client")
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-flash-latest')
    
    # Build structured prompt
    prompt = _build_prompt(difficulty, topic)
    logger.info(f"Generated prompt for {difficulty} difficulty problem")
    
    # Retry logic for API calls
    last_exception = None
    for attempt in range(max_retries + 1):  # +1 for initial attempt
        try:
            logger.info(f"Gemini API attempt {attempt + 1}/{max_retries + 1}")
            
            # Add delay between retries to avoid rate limiting
            if attempt > 0:
                time.sleep(2 ** attempt)  # Exponential backoff
            
            # Call Gemini API
            response = model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.7,
                    max_output_tokens=2000,  # Reduced from 4000
                )
            )
            
            # Validate response before processing
            if not response or not hasattr(response, 'text') or not response.text:
                logger.error("Empty or invalid response from Gemini")
                last_exception = GeminiResponseInvalid("Empty or invalid response from Gemini")
                continue
            
            # Extract and clean content
            content = response.text.strip()
            logger.info(f"Received response from Gemini: {len(content)} characters")
            logger.info(f"Raw response preview: {content[:500]}...")
            logger.info(f"Full response: {content}")
            
            # Validate content is not empty
            if not content:
                logger.error("Empty content in Gemini response")
                last_exception = GeminiResponseInvalid("Empty content in Gemini response")
                continue
            
            # Attempt to parse JSON with fallback logic
            problem_data = _parse_json_with_fallback(content)
            logger.info("Successfully parsed JSON response")
            
            # Validate response structure
            _validate_problem_data(problem_data)
            logger.info("Problem data validation passed")
            
            # Validate difficulty rules
            if not _validate_difficulty_rules(problem_data, difficulty):
                logger.warning(f"Generated problem does not match {difficulty} difficulty rules")
                if attempt < max_retries:  # Retry if we have attempts left
                    continue
                else:
                    raise GeminiResponseInvalid(f"Generated problem does not match {difficulty} difficulty requirements")
            
            logger.info("Difficulty validation passed")
            return problem_data
            
        except json.JSONDecodeError as e:
            logger.error(f"JSON parsing error: {str(e)}")
            last_exception = GeminiResponseInvalid(f"Invalid JSON response: {str(e)}")
            # Don't retry JSON parsing errors - they're content issues
            break
            
        except Exception as e:
            logger.error(f"API call error (attempt {attempt + 1}): {str(e)}")
            last_exception = e
            # Check if this is a retryable error
            if _is_retryable_error(e) and attempt < max_retries:
                wait_time = 2 ** attempt  # Exponential backoff: 1s, 2s, 4s
                logger.info(f"Retrying in {wait_time} seconds...")
                time.sleep(wait_time)
                continue
            else:
                break
    
    # Return structured error response
    if isinstance(last_exception, GeminiAPIKeyMissing):
        raise last_exception
    elif isinstance(last_exception, GeminiResponseInvalid):
        raise last_exception
    else:
        raise GeminiResponseInvalid(f"Gemini API error after {max_retries + 1} attempts: {str(last_exception)}")


def _parse_json_with_fallback(content):
    """
    Parse JSON with multiple fallback strategies.
    
    Args:
        content (str): Raw content from Gemini
        
    Returns:
        dict: Parsed JSON data
        
    Raises:
        json.JSONDecodeError: If all parsing attempts fail
    """
    logger.info(f"Attempting to parse JSON content: {content[:100]}...")
    
    # Strategy 1: Direct parsing
    try:
        result = json.loads(content)
        logger.info("Direct JSON parsing successful")
        return result
    except json.JSONDecodeError as e:
        logger.info(f"Direct parsing failed: {str(e)}")
    
    # Strategy 2: Remove markdown code blocks
    cleaned_content = content.strip()
    if cleaned_content.startswith('```'):
        parts = cleaned_content.split('```')
        if len(parts) >= 2:
            cleaned_content = parts[1].strip()
            if cleaned_content.startswith('json'):
                cleaned_content = cleaned_content[4:].strip()
    
    try:
        result = json.loads(cleaned_content)
        logger.info("Markdown removal parsing successful")
        return result
    except json.JSONDecodeError as e:
        logger.info(f"Markdown removal parsing failed: {str(e)}")
    
    # Strategy 3: Find JSON boundaries
    start_idx = content.find('{')
    end_idx = content.rfind('}')
    
    if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
        json_content = content[start_idx:end_idx + 1]
        try:
            result = json.loads(json_content)
            logger.info("Boundary detection parsing successful")
            return result
        except json.JSONDecodeError as e:
            logger.info(f"Boundary detection parsing failed: {str(e)}")
    
    # Strategy 4: Fix common JSON issues
    # Remove trailing commas, fix quotes, etc.
    cleaned = content.replace(',\n}', '\n}').replace(',\n]', '\n]')
    cleaned = cleaned.replace("'", '"')  # Replace single quotes with double quotes
    
    try:
        result = json.loads(cleaned)
        logger.info("Common fixes parsing successful")
        return result
    except json.JSONDecodeError as e:
        logger.info(f"Common fixes parsing failed: {str(e)}")
    
    # Strategy 5: Advanced JSON repair
    try:
        # Try to fix incomplete JSON
        lines = content.split('\n')
        fixed_lines = []
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # Fix common issues
            if line.endswith(',') and not line.endswith('[') and not line.endswith('{'):
                line = line.rstrip(',')
            
            # Fix incomplete testcases
            if '"testcases": [' in line and not line.endswith(']'):
                # Find the next lines to complete the array
                line = line.rstrip(',') + ']'
            
            fixed_lines.append(line)
        
        # Try to find complete JSON structure
        fixed_content = '\n'.join(fixed_lines)
        
        # Find JSON boundaries again
        start_idx = fixed_content.find('{')
        end_idx = fixed_content.rfind('}')
        
        if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
            json_content = fixed_content[start_idx:end_idx + 1]
            result = json.loads(json_content)
            logger.info("Advanced repair parsing successful")
            return result
            
    except json.JSONDecodeError as e:
        logger.info(f"Advanced repair parsing failed: {str(e)}")
    
    # All strategies failed
    logger.error("All JSON parsing strategies failed")
    raise json.JSONDecodeError("Could not parse JSON after multiple attempts", content, 0)


def _is_retryable_error(exception):
    """
    Determine if an error is worth retrying.
    
    Args:
        exception: The exception to check
        
    Returns:
        bool: True if error is retryable
    """
    error_str = str(exception).lower()
    
    # Network and timeout errors
    retryable_patterns = [
        'timeout',
        'connection',
        'network',
        'rate limit',
        'too many requests',
        'temporary',
        'service unavailable',
        'internal server error',
        'bad gateway',
        'gateway timeout',
        'resource exhausted',
        'quota exceeded'
    ]
    
    return any(pattern in error_str for pattern in retryable_patterns)


def _build_prompt(difficulty, topic=None):
    """
    Build a simplified prompt for Gemini to reduce API failures.
    
    Args:
        difficulty (str): Problem difficulty (EASY, MEDIUM, HARD)
        topic (str, optional): Specific topic for the problem
        
    Returns:
        str: Formatted prompt for Gemini
    """
    topic_text = topic if topic else 'general programming'
    
    # Simplified prompt for better API reliability
    if difficulty == 'EASY':
        prompt = f"""Generate a simple Python programming problem about {topic_text}.

Return ONLY this JSON format:
{{
"name": "Simple problem name",
"description": "Brief description",
"instructions": "Clear instructions",
"level": "EASY",
"code": "Simple Python code with input() and print()",
"testcases": [
{{"input": "test input", "output": "expected output"}},
{{"input": "test input 2", "output": "expected output 2"}}
]
}}

Requirements:
- Single input or simple two inputs
- Basic arithmetic or condition
- No nested loops
- Short solution
- Must use input() and print()"""
    
    elif difficulty == 'MEDIUM':
        prompt = f"""Generate a medium Python programming problem about {topic_text}.

Return ONLY this JSON format:
{{
"name": "Medium problem name",
"description": "Detailed description",
"instructions": "Clear instructions",
"level": "MEDIUM",
"code": "Python code with loops and conditions",
"testcases": [
{{"input": "test input", "output": "expected output"}},
{{"input": "test input 2", "output": "expected output 2"}},
{{"input": "test input 3", "output": "expected output 3"}}
]
}}

Requirements:
- Multiple inputs
- Must include at least one loop
- Must include conditional logic
- At least 6 lines of executable code
- Must use input() and print()"""
    
    else:  # HARD
        prompt = f"""Generate a hard Python programming problem about {topic_text}.

Return ONLY this JSON format:
{{
"name": "Hard problem name",
"description": "Complex description",
"instructions": "Detailed instructions",
"level": "HARD",
"code": "Complex Python code with algorithms",
"testcases": [
{{"input": "test input", "output": "expected output"}},
{{"input": "test input 2", "output": "expected output 2"}},
{{"input": "test input 3", "output": "expected output 3"}}
]
}}

Requirements:
- Multiple structured inputs
- Must include nested loops, recursion, or algorithmic reasoning
- At least 10 lines of executable code
- Cannot be solved with one-line logic
- Must use input() and print()"""
    
    return prompt


def _create_fallback_problem(difficulty, topic=None):
    """
    Create a fallback problem when AI generation fails due to rate limiting.
    
    Args:
        difficulty (str): Problem difficulty ('EASY', 'MEDIUM', 'HARD')
        topic (str, optional): Topic for the problem
        
    Returns:
        dict: Fallback problem data
    """
    topic_text = topic if topic else 'general programming'
    
    # Create meaningful fallback problems based on difficulty and topic
    if difficulty == 'EASY':
        fallback_problems = {
            'basic arithmetic': {
                'name': 'EASY - Basic Calculator',
                'description': 'Simple arithmetic operations with two numbers',
                'instructions': 'Write a program that reads two numbers and performs basic arithmetic operations',
                'level': 'EASY',
                'code': '# Basic Calculator\nnum1 = int(input())\nnum2 = int(input())\nprint(f"Sum: {num1 + num2}")\nprint(f"Difference: {num1 - num2}")\nprint(f"Product: {num1 * num2}")',
                'testcases': [
                    {'input': '5', 'output': 'Sum: 7\\nDifference: 3\\nProduct: 10'},
                    {'input': '10', 'output': 'Sum: 15\\nDifference: 5\\nProduct: 50'}
                ]
            },
            'simple functions': {
                'name': 'EASY - Function Basics',
                'description': 'Create and call simple functions',
                'instructions': 'Write a program that defines and calls a simple function',
                'level': 'EASY',
                'code': '# Function Basics\ndef greet(name):\n    return f"Hello, {name}!"\n\nuser_name = input()\nprint(greet(user_name))',
                'testcases': [
                    {'input': 'Alice', 'output': 'Hello, Alice!'},
                    {'input': 'Bob', 'output': 'Hello, Bob!'}
                ]
            }
        }
        
    elif difficulty == 'MEDIUM':
        fallback_problems = {
            'list operations': {
                'name': 'MEDIUM - List Operations',
                'description': 'Practice list manipulation and processing',
                'instructions': 'Write a program that processes lists with loops and conditions',
                'level': 'MEDIUM',
                'code': '# List Operations\nnumbers = [int(x) for x in input().split()]\n\n# Find even numbers\neven_numbers = [x for x in numbers if x % 2 == 0]\nprint(f"Even numbers: {even_numbers}")\n\n# Find maximum\nif numbers:\n    max_num = max(numbers)\n    print(f"Maximum: {max_num}")\nelse:\n    print("No numbers provided")',
                'testcases': [
                    {'input': '1 2 3 4 5 6', 'output': 'Even numbers: [2, 4, 6]\\nMaximum: 6'},
                    {'input': '10 5 8 3', 'output': 'Even numbers: [10, 8]\\nMaximum: 10'}
                ]
            },
            'loops': {
                'name': 'MEDIUM - Loop Patterns',
                'description': 'Practice different types of loops and iterations',
                'instructions': 'Write a program that demonstrates loop patterns',
                'level': 'MEDIUM',
                'code': '# Loop Patterns\nn = int(input())\n\n# For loop\nprint("For loop:")\nfor i in range(n):\n    print(f"Count: {i}")\n\n# While loop\nprint("\\nWhile loop:")\ncount = 0\nwhile count < n:\n    print(f"Count: {count}")\n    count += 1',
                'testcases': [
                    {'input': '3', 'output': 'For loop:\\nCount: 0\\nCount: 1\\nCount: 2\\n\\nWhile loop:\\nCount: 0\\nCount: 1\\nCount: 2'},
                    {'input': '2', 'output': 'For loop:\\nCount: 0\\nCount: 1\\n\\nWhile loop:\\nCount: 0\\nCount: 1'}
                ]
            }
        }
        
    else:  # HARD
        fallback_problems = {
            'recursion': {
                'name': 'HARD - Recursive Algorithms',
                'description': 'Implement recursive solutions to complex problems',
                'instructions': 'Write a program that uses recursion to solve problems',
                'level': 'HARD',
                'code': '# Recursive Algorithms\ndef factorial(n):\n    if n <= 1:\n        return 1\n    return n * factorial(n - 1)\n\ndef fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n - 1) + fibonacci(n - 2)\n\nnum = int(input())\nprint(f"Factorial of {num}: {factorial(num)}")\nprint(f"Fibonacci of {num}: {fibonacci(num)}")',
                'testcases': [
                    {'input': '5', 'output': 'Factorial of 5: 120\\nFibonacci of 5: 5'},
                    {'input': '3', 'output': 'Factorial of 3: 6\\nFibonacci of 3: 2'}
                ]
            },
            'algorithms': {
                'name': 'HARD - Algorithm Implementation',
                'description': 'Implement classic algorithms from scratch',
                'instructions': 'Write a program that implements sorting algorithms',
                'level': 'HARD',
                'code': '# Sorting Algorithms\ndef bubble_sort(arr):\n    n = len(arr)\n    for i in range(n):\n        for j in range(0, n-i-1):\n            if arr[j] > arr[j+1]:\n                arr[j], arr[j+1] = arr[j+1], arr[j]\n    return arr\n\ndef selection_sort(arr):\n    n = len(arr)\n    for i in range(n):\n        min_idx = i\n        for j in range(i+1, n):\n            if arr[j] < arr[min_idx]:\n                min_idx = j\n        arr[i], arr[min_idx] = arr[min_idx], arr[i]\n    return arr\n\nnumbers = [int(x) for x in input().split()]\nprint("Bubble sort:", bubble_sort(numbers.copy()))\nprint("Selection sort:", selection_sort(numbers))',
                'testcases': [
                    {'input': '5 2 8 1 9', 'output': 'Bubble sort: [1, 2, 5, 8, 9]\\nSelection sort: [1, 2, 5, 8, 9]'},
                    {'input': '3 1 4 1 5', 'output': 'Bubble sort: [1, 1, 3, 4, 5]\\nSelection sort: [1, 1, 3, 4, 5]'}
                ]
            }
        }
    
    # Select appropriate fallback problem
    if topic in fallback_problems[difficulty]:
        return fallback_problems[difficulty][topic]
    else:
        # Return first available fallback for the difficulty
        return list(fallback_problems[difficulty].values())[0]


def _validate_difficulty_rules(problem_data, requested_difficulty):
    """
    Validate that generated code matches the requested difficulty rules.
    
    Args:
        problem_data (dict): Problem data to validate
        requested_difficulty (str): The difficulty that was requested
        
    Returns:
        bool: True if validation passes, False otherwise
    """
    code = problem_data.get('code', '')
    if not code:
        return False
    
    # Count executable lines (excluding empty lines and comments)
    executable_lines = [line for line in code.split('\n') 
                       if line.strip() and not line.strip().startswith('#')]
    line_count = len(executable_lines)
    
    # Check for loops and nested structures
    has_loops = any(keyword in code for keyword in ['for ', 'while '])
    has_nested_loops = any(keyword in code for keyword in ['for for', 'while for', 'for while', 'while while'])
    has_recursion = 'def ' in code and 'return' in code  # Basic recursion check
    has_conditional = any(keyword in code for keyword in ['if ', 'elif ', 'else:'])
    
    logger.info(f"Difficulty validation - Lines: {line_count}, Loops: {has_loops}, Nested: {has_nested_loops}, Conditional: {has_conditional}")
    
    if requested_difficulty == 'EASY':
        # EASY: Single input, basic logic, no nested loops, short solution
        return (line_count <= 6 and 
                not has_nested_loops and 
                not has_recursion)
    
    elif requested_difficulty == 'MEDIUM':
        # MEDIUM: Must include loop and conditional, at least 6 lines
        return (line_count >= 6 and 
                has_loops and 
                has_conditional and 
                not has_nested_loops)
    
    elif requested_difficulty == 'HARD':
        # HARD: Must include nested loops/recursion/algorithmic logic, at least 10 lines
        return (line_count >= 10 and 
                (has_nested_loops or has_recursion or 
                 (has_loops and has_conditional and line_count >= 15)))
    
    return False


def _validate_problem_data(data):
    """
    Validate structure and content of problem data.
    
    Args:
        data (dict): Problem data to validate
        
    Raises:
        GeminiResponseInvalid: If data is invalid or missing required fields
    """
    required_fields = ['name', 'description', 'instructions', 'level', 'code', 'testcases']
    
    # Check all required fields are present
    for field in required_fields:
        if field not in data:
            raise GeminiResponseInvalid(f"Missing required field: {field}")
    
    # Validate level
    if data['level'] not in ('EASY', 'MEDIUM', 'HARD'):
        raise GeminiResponseInvalid(f"Invalid level: {data['level']}")
    
    # Validate testcases
    testcases = data['testcases']
    if not isinstance(testcases, list):
        raise GeminiResponseInvalid("testcases must be a list")
    
    if len(testcases) < 3:
        raise GeminiResponseInvalid("Must provide at least 3 testcases")
    
    for i, testcase in enumerate(testcases):
        if not isinstance(testcase, dict):
            raise GeminiResponseInvalid(f"Testcase {i} must be a dictionary")
        
        if 'input' not in testcase or 'output' not in testcase:
            raise GeminiResponseInvalid(f"Testcase {i} missing 'input' or 'output' field")
        
        if not isinstance(testcase['input'], str) or not isinstance(testcase['output'], str):
            raise GeminiResponseInvalid(f"Testcase {i} 'input' and 'output' must be strings")
    
    # Validate code is not empty
    if not data['code'].strip():
        raise GeminiResponseInvalid("Code field cannot be empty")
    
    # Validate other fields are not empty
    for field in ['name', 'description', 'instructions']:
        if not data[field].strip():
            raise GeminiResponseInvalid(f"{field} field cannot be empty")
