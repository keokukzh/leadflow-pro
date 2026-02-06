/**
 * Structured Business Logger
 */
export const logger = {
  info: (context: object, message: string) => {
    console.log(JSON.stringify({
      level: 'INFO',
      timestamp: new Date().toISOString(),
      ...context,
      message
    }));
  },
  warn: (context: object, message: string) => {
    console.warn(JSON.stringify({
      level: 'WARN',
      timestamp: new Date().toISOString(),
      ...context,
      message
    }));
  },
  error: (context: object, message: string) => {
    console.error(JSON.stringify({
      level: 'ERROR',
      timestamp: new Date().toISOString(),
      ...context,
      message
    }));
  }
};
