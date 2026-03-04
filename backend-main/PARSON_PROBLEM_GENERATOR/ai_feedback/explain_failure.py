"""
AI Feedback Module: explain_failure.py
Provides Claude AI-powered educational feedback for failed programming solutions
"""

import json
import logging
import os
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

class ExplanationGenerator:
    """
    Generates Claude AI-powered educational explanations for failed solutions
    """
    
    def __init__(self, ai_client_type: str = "claude"):
        """
        Initialize the explanation generator
        Args:
            ai_client_type: "claude" (primary), "openai", "gemini", or "local"
        """
        self.ai_client_type = ai_client_type
        
    def validate_inputs(self, 
                     problem_description: str,
                     correct_reference_solution: str,
                     user_generated_code: str,
                     test_failure_summary: bool) -> bool:
        """
        Validate input parameters before processing
        Returns:
            bool: True if inputs are valid
        """
        if not all([problem_description, correct_reference_solution, user_generated_code]):
            logger.error("Missing required input parameters")
            return False
        return True
    
    def construct_explanation_prompt(self,
                                  problem_description: str,
                                  correct_reference_solution: str,
                                  user_generated_code: str,
                                  test_failure_summary: bool) -> str:
        """
        Construct Claude AI prompt for deep code analysis like a Python interpreter and debugging tutor
        Returns:
            str: Formatted prompt for Claude AI
        """
        system_prompt = """You are a Python interpreter and debugging tutor.

You must analyze the student's code exactly as written.

Your tasks:
1. Read the code line-by-line.
2. Identify syntax errors.
3. Identify indentation mistakes.
4. Identify incorrect execution order.
5. Identify missing return statements.
6. Identify variable usage errors.
7. Identify logical flow mistakes.
8. Simulate how Python executes the code.

Explain:
- what line causes the problem
- why Python fails there
- what happens during execution
- how the logic should flow conceptually

Do NOT give the full corrected solution.
Do NOT reveal expected test outputs.
Base your explanation strictly on the provided code.

If your explanation does not reference specific lines or snippets from the student's code, your answer is invalid.

Perform a dry run of the program and describe step-by-step what Python executes and where failure occurs."""

        user_prompt = f"""Problem Description:
{problem_description}

Student Code:
{user_generated_code}

Failure Summary:
{test_failure_summary}

Analyze THIS code only.
Reference exact lines from the code.
Explain why execution fails at specific lines.

If no syntax issue exists, analyze logical mistakes in code flow.

Return ONLY valid JSON with:
- line_reference to specific code
- dry_run showing execution steps
- conceptual_explanation explaining Python rules
- mini_example showing structure concept"""

        # Debug logging to verify code is included
        print("AI Prompt Preview:")
        print("=" * 50)
        print("Problem Description:")
        print(problem_description)
        print("\nStudent Code:")
        print(user_generated_code)
        print("\nFailure Summary:")
        print(test_failure_summary)
        print("=" * 50)

        return f"{system_prompt}\n\n{user_prompt}"
    
    def call_ai_model(self, prompt: str) -> Optional[Dict[str, Any]]:
        """
        Call Claude AI model with constructed prompt
        Returns:
            Dict: Claude AI response or None if failed
        """
        try:
            if self.ai_client_type == "claude":
                return self._call_claude(prompt)
            else:
                logger.error(f"Unsupported AI client type: {self.ai_client_type}")
                return None
                
        except Exception as e:
            logger.error(f"AI model call failed: {str(e)}")
            return None
    
    def _call_claude(self, prompt: str) -> Optional[Dict[str, Any]]:
        """
        Call Claude AI API for intelligent explanations with real-time flow analysis
        Returns:
            Dict: Claude AI response or None if failed
        """
        try:
            # Check for Claude API key
            api_key = os.getenv('CLAUDE_API_KEY')
            if api_key:
                import anthropic
                
                client = anthropic.Anthropic(api_key=api_key)
                
                response = client.messages.create(
                    model="claude-3-sonnet-20240229",
                    max_tokens=1500,
                    temperature=0.7,
                    messages=[
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ]
                )
                
                # Parse Claude's response
                claude_response = response.content[0].text
                
                # Try to parse as JSON first
                try:
                    parsed_response = json.loads(claude_response)
                    # Validate that the response has required elements
                    if (self.validate_json_response(parsed_response) and 
                        parsed_response.get('detected_errors') and 
                        len(parsed_response.get('detected_errors', [])) > 0 and
                        any(error.get('line_reference') and error['line_reference'] != 'unknown' for error in parsed_response.get('detected_errors', [])) and
                        len(parsed_response.get('dry_run', [])) > 0):
                        logger.info("Claude AI response is valid and specific")
                        return parsed_response
                    else:
                        logger.warning("Claude AI response missing required elements - retrying...")
                        # Retry once with stronger emphasis on specificity
                        retry_prompt = prompt + "\n\nIMPORTANT: Your response MUST reference specific lines from the student's code and include a dry run section. Do NOT give generic advice."
                        retry_response = client.messages.create(
                            model="claude-3-sonnet-20240229",
                            max_tokens=1500,
                            temperature=0.3,  # Lower temperature for more focused response
                            messages=[
                                {
                                    "role": "user",
                                    "content": retry_prompt
                                }
                            ]
                        )
                        retry_claude_response = retry_response.content[0].text
                        try:
                            return json.loads(retry_claude_response)
                        except json.JSONDecodeError:
                            return self._convert_claude_text_to_schema(retry_claude_response)
                        
                except json.JSONDecodeError:
                    # If not JSON, convert Claude's text response to our schema
                    logger.info("Claude response not JSON, converting text to schema")
                    return self._convert_claude_text_to_schema(claude_response)
                    
            else:
                logger.error("Claude API key not found - cannot provide AI explanation")
                return self.generate_fallback_response()
                
        except Exception as e:
            logger.error(f"Claude API call failed: {str(e)}")
            return self.generate_fallback_response()
    
    def _convert_claude_text_to_schema(self, claude_text: str) -> Dict[str, Any]:
        """
        Convert Claude's natural language response to our structured schema
        Args:
            claude_text: Claude's text response
        Returns:
            Dict: Structured response following new mandatory schema
        """
        # Initialize response structure with new mandatory format
        response = {
            "summary": "Claude AI analysis of your code",
            "detected_errors": [],
            "dry_run": [],
            "conceptual_explanation": [],
            "mini_example": "",
            "encouragement_message": "Keep debugging! Understanding Python execution flow is key to becoming a great programmer."
        }
        
        # Parse Claude's response for different sections
        lines = claude_text.split('\n')
        current_section = None
        section_content = []
        error_details = {}
        
        for line in lines:
            line = line.strip()
            
            # Identify sections based on keywords
            if any(keyword in line.lower() for keyword in ['error', 'issue', 'problem', 'wrong', 'incorrect', 'line']):
                current_section = 'detected_errors'
                section_content = []
                # Try to extract line reference
                if 'line' in line.lower():
                    error_details['line'] = line
            elif any(keyword in line.lower() for keyword in ['step', 'execution', 'dry run', 'python reads', 'simulates']):
                current_section = 'dry_run'
                section_content = []
            elif any(keyword in line.lower() for keyword in ['concept', 'rule', 'explain', 'clarification', 'python expects']):
                current_section = 'conceptual_explanation'
                section_content = []
            elif any(keyword in line.lower() for keyword in ['example', 'snippet', 'mini']):
                current_section = 'mini_example'
                section_content = []
            elif any(keyword in line.lower() for keyword in ['summary', 'main issue', 'problem']):
                current_section = 'summary'
                section_content = []
            elif line and current_section:
                section_content.append(line)
            elif line and not current_section:
                # Default to conceptual explanation
                current_section = 'conceptual_explanation'
                section_content.append(line)
        
        # Process extracted content
        if section_content:
            content_text = ' '.join(section_content)
            
            if current_section == 'detected_errors':
                # Try to determine error type from content
                error_type = 'logic'
                if any(keyword in content_text.lower() for keyword in ['syntax', 'colon', 'bracket', 'parenthesis']):
                    error_type = 'syntax'
                elif any(keyword in content_text.lower() for keyword in ['indent', 'space', 'tab']):
                    error_type = 'indentation'
                elif any(keyword in content_text.lower() for keyword in ['flow', 'order', 'sequence']):
                    error_type = 'flow'
                elif any(keyword in content_text.lower() for keyword in ['runtime', 'error', 'exception']):
                    error_type = 'runtime'
                
                response['detected_errors'] = [{
                    "line_reference": error_details.get('line', 'unknown'),
                    "issue_type": error_type,
                    "explanation": content_text[:300] + "..." if len(content_text) > 300 else content_text
                }]
            elif current_section == 'dry_run':
                # Split into steps
                steps = [s.strip() for s in content_text.split('.') if s.strip()]
                for i, step in enumerate(steps[:5], 1):
                    response['dry_run'].append(
                        f"Step {i}: {step[:200]}..." if len(step) > 200 else f"Step {i}: {step}"
                    )
            elif current_section == 'conceptual_explanation':
                # Split into concepts
                concepts = [s.strip() for s in content_text.split('.') if s.strip()]
                for concept in concepts[:3]:
                    response['conceptual_explanation'].append(
                        concept[:250] + "..." if len(concept) > 250 else concept
                    )
            elif current_section == 'mini_example':
                response['mini_example'] = content_text[:200] + "..." if len(content_text) > 200 else content_text
            elif current_section == 'summary':
                response['summary'] = content_text[:150] + "..." if len(content_text) > 150 else content_text
        
        # If no specific content found, use Claude's full response as conceptual explanation
        if not response['conceptual_explanation'] and claude_text.strip():
            response['conceptual_explanation'] = [
                f"Analysis: {claude_text[:300]}..." if len(claude_text) > 300 else f"Analysis: {claude_text}"
            ]
        
        return response
    
    def validate_json_response(self, response_data: Dict[str, Any]) -> bool:
        """
        Validate AI response contains required fields
        Returns:
            bool: True if response is valid
        """
        required_fields = [
            "summary", "detected_errors", "dry_run", "conceptual_explanation", "mini_example"
        ]
        
        for field in required_fields:
            if field not in response_data:
                logger.error(f"Missing required field in AI response: {field}")
                return False
        return True
    
    def generate_fallback_response(self) -> Dict[str, Any]:
        """
        Generate fallback response when Claude AI service is unavailable
        Returns:
            Dict: Fallback debugging response following new schema
        """
        return {
            "summary": "Your code has structural issues that need debugging.",
            "detected_errors": [
                {
                    "line_reference": "multiple areas",
                    "issue_type": "flow",
                    "explanation": "Review your code logic and execution order. Think about how Python executes code step by step."
                }
            ],
            "dry_run": [
                "Step 1: Python reads function definition...",
                "Step 2: Python evaluates conditions...",
                "Step 3: Python executes function body...",
                "Step 4: Error occurs due to incorrect flow..."
            ],
            "conceptual_explanation": [
                "Python executes code line by line from top to bottom",
                "Functions must be defined before they are called",
                "Indentation defines code blocks in Python",
                "Return statements send values back from functions"
            ],
            "mini_example": "def example():\n    # Step 1: Define function\n    result = calculate()\n    # Step 2: Call function\n    return result  # Step 3: Return value",
            "encouragement_message": "Keep debugging! Understanding Python execution flow is key to becoming a great programmer."
        }
    
    def explain_failure(self,
                     problem_description: str,
                     correct_reference_solution: str,
                     user_generated_code: str,
                     test_failure_summary: bool) -> Dict[str, Any]:
        """
        Main method to generate Claude AI explanation for failed solution
        Args:
            problem_description: The problem statement
            correct_reference_solution: Admin-defined reference solution (NEVER returned to user)
            user_generated_code: Student's submitted code
            test_failure_summary: Boolean indicating test failure
        Returns:
            Dict: Structured explanation following schema
        """
        # Validate inputs
        if not self.validate_inputs(
            problem_description, correct_reference_solution, 
            user_generated_code, test_failure_summary
        ):
            return self.generate_fallback_response()
        
        # Only proceed if tests failed
        if not test_failure_summary:
            logger.info("Tests passed - no explanation needed")
            return {
                "overall_status": "passed",
                "summary": "Solution passed all test cases!",
                "flow_issues": [],
                "indentation_issues": None,
                "missing_steps": None,
                "learning_guidance": [],
                "encouragement_message": "Great work! Your solution is correct."
            }
        
        # Construct Claude AI prompt
        prompt = self.construct_explanation_prompt(
            problem_description, correct_reference_solution,
            user_generated_code, test_failure_summary
        )
        
        # Call Claude AI model
        ai_response = self.call_ai_model(prompt)
        
        # Anti-generic safety check
        if ai_response and self.validate_json_response(ai_response):
            # Check if response contains required elements
            has_line_reference = any(
                error.get('line_reference') and error['line_reference'] != 'unknown' 
                for error in ai_response.get('detected_errors', [])
            )
            has_dry_run = len(ai_response.get('dry_run', [])) > 0
            has_code_reference = any(
                'line' in str(error).lower() or 'code' in str(error).lower()
                for error in ai_response.get('detected_errors', [])
            )
            
            # If missing required elements, retry once
            if not (has_line_reference and has_dry_run and has_code_reference):
                logger.warning("AI response missing required elements - retrying...")
                ai_response = self.call_ai_model(prompt)
            
            if ai_response:
                logger.info("Successfully generated Claude AI explanation")
                return ai_response
        else:
            logger.warning("Claude AI response invalid or failed, using fallback")
            return self.generate_fallback_response()


# Convenience function for easy import
def explain_solution_failure(problem_description: str,
                           correct_reference_solution: str,
                           user_generated_code: str,
                           test_failure_summary: bool) -> Dict[str, Any]:
    """
    Convenience function to generate Claude AI explanation for failed solution
    Args:
        problem_description: The problem statement
        correct_reference_solution: Admin-defined reference solution
        user_generated_code: Student's submitted code
        test_failure_summary: Boolean indicating test failure
    Returns:
        Dict: Structured explanation following schema
    """
    explainer = ExplanationGenerator(ai_client_type="claude")
    return explainer.explain_failure(
        problem_description=problem_description,
        correct_reference_solution=correct_reference_solution,
        user_generated_code=user_generated_code,
        test_failure_summary=test_failure_summary
    )
