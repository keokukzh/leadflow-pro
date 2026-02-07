/**
 * Privacy-First Structured Logger
 */

function maskPhone(phone: string): string {
  if (!phone) return 'unknown';
  if (phone.length < 5) return '****';
  return phone.slice(0, 3) + '****' + phone.slice(-4);
}

function maskEmail(email: string): string {
  if (!email) return 'unknown';
  const [user, domain] = email.split('@');
  if (!domain) return '****';
  return user.charAt(0) + '****@' + domain;
}

function sanitize(context: object): object {
  const sanitized = { ...context } as Record<string, any>;
  
  // Auto-mask common PII fields
  if (sanitized.phoneNumber) sanitized.phoneNumber = maskPhone(sanitized.phoneNumber);
  if (sanitized.phone) sanitized.phone = maskPhone(sanitized.phone);
  if (sanitized.email) sanitized.email = maskEmail(sanitized.email);
  if (sanitized.to && typeof sanitized.to === 'string' && sanitized.to.includes('@')) {
    sanitized.to = maskEmail(sanitized.to);
  }

  return sanitized;
}

export const logger = {
  info: (context: object, message: string) => {
    console.log(JSON.stringify({
      level: 'INFO',
      timestamp: new Date().toISOString(),
      ...sanitize(context),
      message
    }));
  },
  warn: (context: object, message: string) => {
    console.warn(JSON.stringify({
      level: 'WARN',
      timestamp: new Date().toISOString(),
      ...sanitize(context),
      message
    }));
  },
  error: (context: object, message: string) => {
    console.error(JSON.stringify({
      level: 'ERROR',
      timestamp: new Date().toISOString(),
      ...sanitize(context),
      message
    }));
  }
};
