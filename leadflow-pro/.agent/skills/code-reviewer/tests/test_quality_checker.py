#!/usr/bin/env python3
"""
Tests for Code Quality Checker
"""

import unittest
from pathlib import Path
import sys

# Add scripts directory to path for import
sys.path.append(str(Path(__file__).parent.parent / "scripts"))

from code_quality_checker import analyze_code

class TestCodeQualityChecker(unittest.TestCase):
    def setUp(self):
        self.test_dir = Path(__file__).parent / "test_temp"
        self.test_dir.mkdir(exist_ok=True)
        
    def tearDown(self):
        # Clean up
        if self.test_dir.exists():
            for f in self.test_dir.glob("*"):
                f.unlink()
            self.test_dir.rmdir()

    def test_analyze_missing_path(self):
        """Test analyzing a non-existent path."""
        issues = analyze_code(Path("non_existent_path"))
        self.assertTrue(any("Path does not exist" in str(i) for i in issues))

    def test_analyze_file_with_todo(self):
        """Test detection of TODO markers."""
        todo_file = self.test_dir / "todo.py"
        todo_file.write_text("# TODO: Fix this", encoding="utf-8")
        
        issues = analyze_code(todo_file)
        self.assertTrue(any(i['type'] == 'TechDebt' for i in issues if isinstance(i, dict)))

    def test_analyze_large_file(self):
        """Test detection of large files."""
        large_file = self.test_dir / "large.py"
        large_file.write_text("\n" * 600, encoding="utf-8")
        
        issues = analyze_code(large_file)
        self.assertTrue(any(i['type'] == 'Size' for i in issues if isinstance(i, dict)))

if __name__ == "__main__":
    unittest.main()
