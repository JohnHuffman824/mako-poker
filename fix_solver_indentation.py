#!/usr/bin/env python3
"""
Fix indentation issues in Python files.
- For space-indented files: reduce excessive indentation by 4 spaces
- For tab-indented files: leave as-is (they're correct)
"""

import sys
from pathlib import Path
import re


def detect_indentation_type(content: str) -> str:
    """Detect if file uses tabs or spaces. Returns 'tabs' or 'spaces'."""
    lines = content.split('\n')
    tab_count = 0
    space_count = 0
    
    for line in lines:
        stripped = line.lstrip()
        if not stripped or stripped.startswith('#'):
            continue
        leading = line[:len(line) - len(stripped)]
        if '\t' in leading:
            tab_count += 1
        elif ' ' in leading:
            space_count += 1
    
    return 'tabs' if tab_count > space_count else 'spaces'


def fix_space_indented_file(content: str) -> str:
    """Fix files that use space indentation."""
    lines = content.split('\n')
    fixed_lines = []
    
    for line in lines:
        # Empty lines pass through unchanged
        if not line.strip():
            fixed_lines.append(line)
            continue
        
        stripped = line.lstrip()
        leading_spaces = len(line) - len(stripped)
        
        # Check for class-level method definitions (4 spaces)
        if re.match(r'^    (def |async def |class )', line):
            fixed_lines.append(line)
            continue
        
        # Check for excessive indentation in method bodies
        # Method body should be 8 spaces, but if it's 12, reduce to 8
        if leading_spaces == 12:
            # Check if this should be 8 spaces
            # Look for patterns that indicate method body
            fixed_line = '        ' + stripped  # 8 spaces
            fixed_lines.append(fixed_line)
            continue
        
        # If we have 20 spaces, reduce to 12 (nested block in method)
        if leading_spaces == 20:
            fixed_line = '            ' + stripped  # 12 spaces
            fixed_lines.append(fixed_line)
            continue
        
        # If we have 16 spaces, reduce to 12
        if leading_spaces == 16:
            fixed_line = '            ' + stripped  # 12 spaces
            fixed_lines.append(fixed_line)
            continue
        
        # Otherwise keep the line as-is
        fixed_lines.append(line)
    
    return '\n'.join(fixed_lines)


def fix_tab_indented_file(content: str) -> str:
    """Fix files that use tab indentation - reduce method body indentation by 1 tab."""
    lines = content.split('\n')
    fixed_lines = []
    in_method = False
    method_indent_level = 0
    
    i = 0
    while i < len(lines):
        line = lines[i]
        stripped = line.lstrip('\t')
        leading_tabs = len(line) - len(stripped)
        
        # Check if this is a method/function definition
        if re.match(r'^\t+(def |async def )', line):
            # This is a method definition
            method_indent_level = leading_tabs
            in_method = True
            fixed_lines.append(line)  # Keep method def as-is
            i += 1
            continue
        
        # Check if we've exited the method
        if in_method and stripped and leading_tabs <= method_indent_level:
            in_method = False
        
        # If we're in a method body, reduce indentation by 1 tab
        if in_method and leading_tabs > method_indent_level:
            # Reduce by 1 tab
            new_line = '\t' * (leading_tabs - 1) + stripped
            fixed_lines.append(new_line)
        else:
            fixed_lines.append(line)
        
        i += 1
    
    return '\n'.join(fixed_lines)


def fix_file(file_path: Path) -> bool:
    """Fix a single file. Returns True if changes were made."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            original_content = f.read()
        
        # Detect indentation type
        indent_type = detect_indentation_type(original_content)
        
        # Fix based on type
        if indent_type == 'tabs':
            fixed_content = fix_tab_indented_file(original_content)
        else:
            fixed_content = fix_space_indented_file(original_content)
        
        # Check if anything changed
        if fixed_content == original_content:
            return False
        
        # Verify the fixed content is valid Python
        try:
            compile(fixed_content, str(file_path), 'exec')
        except SyntaxError as e:
            print(f'Warning: Fixed version has syntax error in {file_path}: {e}')
            return False
        
        # Write the fixed content
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(fixed_content)
        
        return True
    
    except Exception as e:
        print(f'Error processing {file_path}: {e}', file=sys.stderr)
        return False


def main():
    """Fix all Python files in solver directory."""
    solver_dir = Path(__file__).parent / 'solver'
    
    if not solver_dir.exists():
        print(f'Error: solver directory not found', file=sys.stderr)
        sys.exit(1)
    
    python_files = list(solver_dir.rglob('*.py'))
    
    print(f'Found {len(python_files)} Python files')
    print('-' * 60)
    
    fixed_count = 0
    
    for py_file in sorted(python_files):
        relative_path = py_file.relative_to(solver_dir.parent)
        
        if fix_file(py_file):
            print(f'✓ Fixed: {relative_path}')
            fixed_count += 1
        else:
            print(f'  Skipped: {relative_path}')
    
    print('-' * 60)
    print(f'Fixed {fixed_count} file(s)')


if __name__ == '__main__':
    main()

