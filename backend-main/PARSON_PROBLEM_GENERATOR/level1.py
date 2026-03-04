def divide_python_code_into_blocks(python_code):
    """
    Divides Python code into blocks suitable for Parsons problems.
    Creates meaningful blocks based on logical code units.
    """
    blocks = []
    lines = python_code.strip().split('\n')
    
    for line in lines:
        line_stripped = line.strip()
        
        # Skip empty lines and comments
        if not line_stripped or line_stripped.startswith(('#', '"""', "'''")):
            continue
        
        # Create a block for each non-empty line
        blocks.append([line])
    
    return blocks
