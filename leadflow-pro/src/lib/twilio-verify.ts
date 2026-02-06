import twilio from 'twilio';

/**
 * Validates Twilio webhook signatures
 * @param token - Twilio Auth Token
 * @param signature - The X-Twilio-Signature header
 * @param url - The full URL of the request
 * @param params - The POST parameters (as an object)
 */
export function validateTwilioRequest(
  token: string,
  signature: string | null,
  url: string,
  params: Record<string, string | undefined>
): boolean {
  if (!signature) return false;
  if (!token) {
    console.error('Twilio Auth Token is missing for validation');
    return false;
  }
  
  return twilio.validateRequest(token, signature, url, params);
}
