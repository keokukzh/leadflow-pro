import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Next.js router or other globals if needed
vi.mock('next/router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));
