---
name: code-reviewer
description: Automated code review and quality analysis automation.
---

# Code Reviewer Skill

This skill provides a comprehensive suite of tools for automating code reviews, analyzing pull requests, and ensuring consistent code quality across the project.

## Quick Start

Initialize the skill and run your first quality check:

```bash
# Analyze a specific file or directory
python .agent/skills/code-reviewer/scripts/code_quality_checker.py ./src/app/api/voice/route.ts --verbose
```

## Core Capabilities

The skill is built around three specialized Python scripts that follow standardized CLI patterns.

### 1. PR Analyzer
Analyzes changes in a Pull Request (or local diffs) to identify potential regressions, security issues, or architectural violations.

**Usage:**
```bash
python .agent/skills/code-reviewer/scripts/pr_analyzer.py <project-path> [OPTIONS]
```

### 2. Code Quality Checker
Performs static analysis to detect common antipatterns, complexity spikes, and formatting issues.

**Usage:**
```bash
python .agent/skills/code-reviewer/scripts/code_quality_checker.py <target-path> [OPTIONS]
```

**Features:**
- **Automated Scaffolding**: Detects missing configurations or standard files.
- **Complexity Thresholds**: Flags functions with high cyclomatic complexity.
- **Standard Enforcement**: Checks for adherence to project style guides.

### 3. Review Report Generator
Aggregates findings from various checks into a professional Markdown report for stakeholders.

**Usage:**
```bash
python .agent/skills/code-reviewer/scripts/review_report_generator.py <findings-dir> [OPTIONS]
```

## Standard CLI Patterns

All scripts in this skill follow a consistent interface:

| Argument | Shorthand | Description |
| --- | --- | --- |
| `--verbose` | `-v` | Enable detailed diagnostic output |
| `--output` | `-o` | Specify the filepath for results |
| `--format` | `-f` | Output format: `json`, `text`, `html`, `markdown` |
| `--help` | `-h` | Display help information |

## Reference Documentation

- [Code Review Checklist](file:///c:/Users/aidevelo/Desktop/leadflow-pro/leadflow-pro/.agent/skills/code-reviewer/references/code_review_checklist.md)
- [Coding Standards](file:///c:/Users/aidevelo/Desktop/leadflow-pro/leadflow-pro/.agent/skills/code-reviewer/references/coding_standards.md)
- [Common Antipatterns](file:///c:/Users/aidevelo/Desktop/leadflow-pro/leadflow-pro/.agent/skills/code-reviewer/references/common_antipatterns.md)

## Development Workflow

1. **Setup**: Configure your environment and custom thresholds in `.code-reviewer/config.json`.
2. **Analysis**: Run quality checks during local development or as part of a CI/CD pipeline.
3. **Reporting**: Generate a report to share during peer reviews.

## Testing

Run unit tests for the automation scripts:

```bash
pytest .agent/skills/code-reviewer/tests/ -v
```

## Version

**Current**: 1.0.0 (2026-02-07)

### Changelog

**1.0.0**
- Initial implementation of the Code Reviewer skill.
- Added `pr_analyzer.py`, `code_quality_checker.py`, and `review_report_generator.py`.
- Established standardized CLI argument patterns.
- Created comprehensive reference documentation.
