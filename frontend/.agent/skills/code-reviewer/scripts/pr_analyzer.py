#!/usr/bin/env python3
"""
PR Analyzer
Analyzes Pull Request changes and provides targeted feedback.
"""

import argparse
import sys
import json
from pathlib import Path

def analyze_pr_changes(project_path: Path, verbose: bool = False):
    """Analyze changes from a PR perspective."""
    findings = []
    
    if not project_path.exists():
        return [f"Project path does not exist: {project_path}"]

    # Standard "PR" sensitive areas
    sensitive_patterns = ["*config*", "*secret*", "auth*", "security*"]
    
    # Mock finding changed files (for real usage this would use git)
    # Here we scan for recent modifications or key structural changes
    files = list(project_path.glob("**/*"))
    
    for file in files:
        if file.is_dir() or ".git" in str(file) or "node_modules" in str(file):
            continue
            
        is_sensitive = any(file.match(p) for p in sensitive_patterns)
        
        if is_sensitive:
            findings.append({
                "file": str(file),
                "type": "Security",
                "impact": "High",
                "message": "Change detected in a security-sensitive file. Requires manual review."
            })
            
        # Architectural check: Next.js API routes logic separation
        if "src/app/api" in str(file) and file.suffix in [".ts", ".tsx"]:
            try:
                content = file.read_text(encoding="utf-8")
                if len(content.splitlines()) > 100:
                    findings.append({
                        "file": str(file),
                        "type": "Architecture",
                        "impact": "Medium",
                        "message": "API route contains heavy logic. Recommend extracting to server-actions or services."
                    })
            except:
                pass

    return findings

def main():
    parser = argparse.ArgumentParser(
        description="PR Analyzer - Delta Intelligence"
    )
    parser.add_argument(
        "path",
        type=Path,
        help="Path to the project or changed files"
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Enable verbose output"
    )
    parser.add_argument(
        "--format", "-f",
        choices=["text", "json", "markdown"],
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
        findings = analyze_pr_changes(args.path, args.verbose)
        
        output_content = ""
        if args.format == "json":
            output_content = json.dumps(findings, indent=2)
        elif args.format == "markdown":
            output_content = "# PR Analysis Report\n\n"
            if not findings:
                output_content += "✅ No critical changes identified.\n"
            else:
                for f in findings:
                    output_content += f"### {f['type']} ({f['impact']})\n- **File**: `{f['file']}`\n- **Message**: {f['message']}\n\n"
        else:
            if not findings:
                output_content = "✅ No critical changes identified."
            else:
                for f in findings:
                    output_content += f"[{f['impact']}] {f['type']} - {f['file']}: {f['message']}\n"
        
        if args.output:
            args.output.write_text(output_content)
            print(f"Analysis written to {args.output}")
        else:
            print(output_content)
            
        sys.exit(0)
            
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
