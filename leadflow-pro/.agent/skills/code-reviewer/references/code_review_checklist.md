# Code Review Checklist

Use this checklist during manual peer reviews and to configure automated quality gates.

## 1. Logic & Correctness
- [ ] Does the code accurately implement the requirements?
- [ ] Are edge cases handled (empty inputs, null values, network failures)?
- [ ] Is there any dead or unreachable code?
- [ ] Are asynchronous operations handled correctly (proper `await` usage)?

## 2. Security & Privacy
- [ ] Are sensitive environment variables protected?
- [ ] Is user input sanitized before use in database queries or HTML rendering?
- [ ] Are authentication and authorization checks present where necessary?
- [ ] Is any PII (Personally Identifiable Information) logged in plain text?

## 3. Performance
- [ ] Are there any unnecessary database queries or API calls?
- [ ] Are expensive operations memoized or optimized?
- [ ] Is the front-end layout efficient (avoiding excessive re-renders)?
- [ ] Does the change impact the build size significantly?

## 4. Styling & Clean Code
- [ ] Does the code follow the [Coding Standards](file:///c:/Users/aidevelo/Desktop/leadflow-pro/leadflow-pro/.agent/skills/code-reviewer/references/coding_standards.md)?
- [ ] Are variable and function names descriptive and consistent?
- [ ] Is the documentation up-to-date with the changes?
- [ ] Are there comments explaining "why" for complex logic?

## 5. Testing & Coverage
- [ ] Are there unit tests for the new functionality?
- [ ] Do existing tests still pass?
- [ ] Is the test coverage sufficient for critical paths?
