# Coding Standards

These standards ensure consistency and maintainability across the Swiss Intel LeadFlow Pro codebase.

## 1. General Principles
- **DRY (Don't Repeat Yourself)**: Extract common logic into shared utilities or components.
- **KISS (Keep It Simple, Stupid)**: Favor readability over "clever" one-liners.
- **Explicit over Implicit**: Avoid magic strings or configurations.

## 2. TypeScript & Next.js
- **Strict Typing**: Use explicit interfaces/types for all component props and API responses. Avoid `any`.
- **Server Actions**: Use Server Actions for data mutations. Keep logic out of the UI components.
- **Tailwind CSS**: Use standardized utility classes. Follow the established color and spacing tokens.
- **Standardized Border Radius**: Prefer `rounded-4xl` for large panels and `rounded-xl` for smaller elements.

## 3. Python
- **Type Hinting**: All functions should have type hints for arguments and return types.
- **Argparse Standards**: All scripts must use `argparse` with `--verbose`, `--output`, and `--format` options.
- **Error Handling**: Implement custom exception handling for operations like file I/O or network requests.
- **Styling**: Follow PEP 8 guidelines.

## 4. API & Integration
- **Next.js API Routes**: Use the `src/app/api/.../route.ts` structure.
- **Zod Validation**: Validate all incoming request bodies and query parameters.
- **Error Types**: Return consistent error shapes with descriptive messages and status codes.
