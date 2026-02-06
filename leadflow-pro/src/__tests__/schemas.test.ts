import { describe, it, expect } from 'vitest';
import { LeadSchema, VoiceCallSchema, SearchDiscoverySchema } from '../lib/schemas';

describe('Validation Schemas', () => {
  describe('LeadSchema', () => {
    it('should validate a valid lead', () => {
      const validLead = {
        name: 'Test Business',
        vicinity: 'Zürich, Switzerland',
        industry: 'Software',
        phone: '+41441234567',
        rating: 4.5
      };
      const result = LeadSchema.safeParse(validLead);
      expect(result.success).toBe(true);
    });

    it('should fail if name is missing', () => {
      const invalidLead = {
        vicinity: 'Zürich',
        industry: 'Software'
      };
      const result = LeadSchema.safeParse(invalidLead);
      expect(result.success).toBe(false);
    });

    it('should fail with invalid phone format', () => {
      const invalidLead = {
        name: 'Test',
        vicinity: 'Zürich',
        industry: 'Software',
        phone: '044 123 45 67' // Needs E.164
      };
      const result = LeadSchema.safeParse(invalidLead);
      expect(result.success).toBe(false);
    });
  });

  describe('VoiceCallSchema', () => {
    it('should validate a valid voice call request', () => {
      const validRequest = {
        lead: {
          name: 'Test Business',
          vicinity: 'Zürich',
          industry: 'Software',
          phone: '+41441234567'
        },
        prompt: 'Hello this is a test'
      };
      const result = VoiceCallSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });
  });

  describe('SearchDiscoverySchema', () => {
    it('should validate a valid discovery request', () => {
      const validQuery = {
        industry: 'Restaurants',
        locations: ['Zürich', 'Bern']
      };
      const result = SearchDiscoverySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });
  });
});
