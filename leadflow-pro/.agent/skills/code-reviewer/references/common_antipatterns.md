# Common Antipatterns

Avoid these patterns to maintain a high-quality codebase.

## 1. UI & React Antipatterns

### Cascading Renders
**The Pattern**: Calling `setState` synchronously within a `useEffect` without a guard.
**The Fix**: Use conditional guards or derive state from props/existing state during render.

### Prop Drilling
**The Pattern**: Passing data through multiple layers of components that don't need it.
**The Fix**: Use React Context, a state management library, or component composition.

## 2. API & Backend Antipatterns

### Logic-Heavy API Routes
**The Pattern**: Writing complex business logic directly in the `route.ts` file.
**The Fix**: Extract logic to `server-actions.ts` or a `services` layer.

### Incomplete Error Handling
**The Pattern**: Using `try...catch` without specific error types or user-friendly reporting.
**The Fix**: Implement a consistent error response structure and log specific errors.

## 3. CSS & Styling Antipatterns

### Ad-hoc Colors & Sizing
**The Pattern**: Using hardcoded hex codes or pixel values like `bg-[#ff0000]` or `w-[59px]`.
**The Fix**: Use Tailwind theme tokens (e.g., `bg-primary`, `w-12`).

### Over-nesting Selectors
**The Pattern**: Using deeply nested CSS selectors that are hard to override.
**The Fix**: Use simple utility classes or BEM-style naming if using custom CSS.

## 4. Architecture Antipatterns

### God Components
**The Pattern**: A single component that manages too much state, logic, and UI.
**The Fix**: Break down into smaller, focused "functional atoms".

### Hidden Side Effects
**The Pattern**: Components or functions that modify global state or have surprising side effects.
**The Fix**: Ensure pure functions where possible and document all side effects.
