#!/usr/bin/env python3
"""
Code Quality Checker
Analyzes code quality and provides recommendations.
"""

import argparse
import sys
import json
from pathlib import Path

def analyze_code(path: Path, verbose: bool = False):
    """Analyze code quality in the given path."""
    issues = []
    
    if not path.exists():
        return [f"Path does not exist: {path}"]

    # Basic analysis logic
    files_to_check = [path] if path.is_file() else list(path.glob("**/*.ts")) + list(path.glob("**/*.tsx")) + list(path.glob("**/*.py"))
    
    for file_path in files_to_check:
        if verbose:
            print(f"DEBUG: Processing {file_path}")
            
        try:
            content = file_path.read_text(encoding="utf-8")
            lines = content.splitlines()
            
            # 1. File size check
            if len(lines) > 500:
                issues.append({
                    "file": str(file_path),
                    "type": "Size",
                    "severity": "Warning",
                    "message": f"Large file detected ({len(lines)} lines). Consider refactoring."
                })
                
            # 2. Basic complexity/nesting check
            for i, line in enumerate(lines, 1):
                if line.strip().startswith("if") and line.count("  ") > 8:
                    issues.append({
                        "file": str(file_path),
                        "line": i,
                        "type": "Complexity",
                        "severity": "Suggestion",
                        "message": "Deeply nested conditional detected."
                    })
                    
            # 3. TODO check
            if "TODO" in content:
                issues.append({
                    "file": str(file_path),
                    "type": "TechDebt",
                    "severity": "Info",
                    "message": "Unresolved TODO found."
                })

        except Exception as e:
            issues.append({
                "file": str(file_path),
                "type": "Error",
                "severity": "Critical",
                "message": f"Failed to read file: {e}"
            })
    
    return issues

def main():
    parser = argparse.ArgumentParser(
        description="Code Quality Checker - Swiss Intel LeadFlow Pro Edition"
    )
    parser.add_argument(
        "path",
        type=Path,
        help="Path to analyze (file or directory)"
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Enable verbose output"
    )
    parser.add_argument(
        "--format", "-f",
        choices=["text", "json"],
        default="text",
        help="Output format (default: text)"
    )
    parser.add_argument(
        "--output", "-o",
        type=Path,
        help="Output file path"
    )

    try:
        args = parser.parse_args()
        results = analyze_code(args.path, args.verbose)
        
        output_content = ""
        if args.format == "json":
            output_content = json.dumps(results, indent=2)
        else:
            if not results:
                output_content = "✅ No issues found!"
            else:
                for issue in results:
                    if isinstance(issue, str):
                        output_content += f"❌ {issue}\n"
                    else:
                        line_info = f":L{issue['line']}" if 'line' in issue else ""
                        output_content += f"[{issue['severity']}] {issue['file']}{line_info}: {issue['message']} ({issue['type']})\n"
        
        if args.output:
            args.output.write_text(output_content)
            print(f"Results written to {args.output}")
        else:
            print(output_content)
            
        sys.exit(1 if results and any(i.get('severity') == 'Critical' for i in results if isinstance(i, dict)) else 0)
            
    except PermissionError:
        print("❌ Permission denied accessing path")
        sys.exit(2)
    except KeyboardInterrupt:
        print("\n⚠️ Interrupted by user")
        sys.exit(3)
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        sys.exit(4)

if __name__ == "__main__":
    main()
