# LeadFlow Pro - Testing & Stitch MCP Integration Plan

## Executive Summary

**Goal:** Optimize testing and integrate Stitch MCP for intelligent skill matching and preview generation.

---

## 1. Current Issues

### Heavy Generation Problem
- Current: Generate everything, then filter
- Problem: Wasteful, slow, expensive
- Solution: Generate only what matches

### Skill Matching Problem
- Current: Manual selection
- Problem: Wrong templates for leads
- Solution: AI-powered skill matching via Stitch

---

## 2. Stitch MCP Integration

### What is Stitch MCP?
```
Stitch = AI-powered template selection
- Analyzes lead data
- Recommends best template
- Optimizes generation parameters
```

### MCP Configuration

```json
{
  "mcpServers": {
    "stitch": {
      "command": "npx",
      "args": ["-y", "@stitch-ai/stitch-mcp"],
      "env": {
        "STITCH_API_KEY": "your-api-key"
      }
    }
  }
}
```

### Agent Panel Configuration

```
1. Open Agent Panel
2. Click three dots (top right)
3. Select "MCP Servers"
4. Click "Manage MCP Servers"
5. Select "View raw config"
6. Add Stitch MCP entry
```

---

## 3. Testing Strategy

### Skip Heavy Generation

**Current (Inefficient):**
```
1. Generate ALL templates (10x work)
2. Pick best one
3. Discard 9
```

**New (Efficient):**
```
1. Analyze lead with Stitch
2. Get recommendations
3. Generate ONLY best template (1x work)
```

### Testing Levels

#### Unit Tests (Fast)
```typescript
// src/__tests__/lead-matching.test.ts
describe('Lead Matching', () => {
  it('should match restaurant to RestaurantTemplate', () => {
    const lead = createTestLead({ industry: 'restaurant' });
    const result = matchLeadToTemplate(lead);
    expect(result.templateId).toBe('restaurant');
  });
  
  it('should score leads correctly', () => {
    const hotLead = createTestLead({ reviews: 100, rating: 4.5 });
    const coldLead = createTestLead({ reviews: 5, rating: 3.0 });
    
    expect(scoreLead(hotLead)).toBeGreaterThan(scoreLead(coldLead));
  });
});
```

#### Integration Tests (Medium)
```typescript
// src/__tests__/workflow.test.ts
describe('Workflow Integration', () => {
  it('should complete cold outreach workflow', async () => {
    const workflow = createColdOutreachWorkflow();
    const result = await executeWorkflow(workflow, testLead);
    
    expect(result.status).toBe('completed');
    expect(result.steps.executed).toContain('send_email');
    expect(result.steps.executed).toContain('wait_48h');
  });
});
```

#### E2E Tests (Slow)
```typescript
// tests/e2e/voice-call.test.ts
describe('Voice Call E2E', () => {
  it('should complete call flow', async () => {
    await initiateCall(testPhoneNumber);
    await waitForWebhook();
    expect(webhookReceived).toBe(true);
  });
});
```

---

## 4. Optimization Plan

### Phase 1: Lightweight Testing (Week 1)

| Task | Effort | Priority |
|------|--------|----------|
| Add unit tests for lead scoring | 2h | HIGH |
| Add unit tests for template matching | 2h | HIGH |
| Mock external APIs | 1h | MEDIUM |
| Create test fixtures | 1h | MEDIUM |

### Phase 2: Stitch MCP Integration (Week 2)

| Task | Effort | Priority |
|------|--------|----------|
| Configure MCP Servers | 30min | HIGH |
| Implement skill matching API | 4h | HIGH |
| Connect to preview generation | 2h | MEDIUM |
| Test end-to-end flow | 2h | MEDIUM |

### Phase 3: Production Optimization (Week 3)

| Task | Effort | Priority |
|------|--------|----------|
| Add rate limiting | 1h | HIGH |
| Implement caching | 2h | HIGH |
| Add monitoring | 2h | MEDIUM |
| Performance testing | 2h | MEDIUM |

---

## 5. Stitch Preview Generation

### Workflow

```
Lead Data Input
      ↓
Stitch MCP Analysis
      ↓
Template Recommendation
      ↓
Preview Generation (Optimized)
      ↓
Customer Preview
```

### Code Structure

```typescript
// src/services/stitch/stitchService.ts

interface StitchRecommendation {
  templateId: string;
  confidence: number;
  optimizations: string[];
}

class StitchService {
  async analyzeLead(lead: Lead): Promise<StitchRecommendation> {
    // Call Stitch MCP
    const response = await this.callStitchAPI({
      industry: lead.industry,
      location: lead.location,
      reviews: lead.google_reviews_count,
      rating: lead.google_rating,
      hasWebsite: !!lead.website,
    });
    
    return {
      templateId: response.best_template,
      confidence: response.confidence_score,
      optimizations: response.recommended_optimizations,
    };
  }
  
  async generatePreview(lead: Lead): Promise<PreviewResult> {
    const recommendation = await this.analyzeLead(lead);
    
    // Generate ONLY recommended template
    const preview = await previewService.generate({
      templateId: recommendation.templateId,
      leadData: lead,
      optimizations: recommendation.optimizations,
    });
    
    return preview;
  }
}
```

---

## 6. Configuration Files

### MCP Servers Config (`~/.config/openclaw/mcp.json`)

```json
{
  "mcpServers": {
    "stitch": {
      "command": "npx",
      "args": ["-y", "@stitch-ai/stitch-mcp"],
      "env": {
        "STITCH_API_KEY": "${STITCH_API_KEY}"
      }
    },
    "preview-generator": {
      "command": "node",
      "args": ["${WORKSPACE}/leadflow-pro/scripts/preview-mcp.js"],
      "env": {
        "DATABASE_URL": "${SUPABASE_URL}"
      }
    }
  }
}
```

### Test Configuration (`vitest.config.ts`)

```typescript
import { defineConfig } from 'vitest';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['src/**/*.test.ts'],
    exclude: ['node_modules', '.next', '**/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
```

---

## 7. Quick Wins (This Week)

### 1. Add Mock Data for Tests
```typescript
// tests/fixtures/testLeads.ts
export const testLeads = [
  {
    id: 'test_001',
    company_name: 'Test Restaurant Zürich',
    industry: 'restaurant',
    location: 'Zürich',
    google_rating: 4.5,
    google_reviews_count: 150,
    phone: '+41791234567',
    email: 'test@test.ch',
    website: null,
  },
  {
    id: 'test_002',
    company_name: 'Test Hotel Bern',
    industry: 'hotel',
    location: 'Bern',
    google_rating: 4.2,
    google_reviews_count: 80,
    phone: '+41311234567',
    email: 'hotel@test.ch',
    website: 'http://old-hotel.ch',
  },
];
```

### 2. Create Test Scripts
```bash
#!/bin/bash
# scripts/test.sh

# Run unit tests
echo "Running unit tests..."
npm run test:unit

# Run integration tests
echo "Running integration tests..."
npm run test:integration

# Run coverage
echo "Checking coverage..."
npm run test:coverage
```

### 3. Add CI Pipeline
```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm install
      - run: npm run test:unit
      - run: npm run test:integration
      - run: npm run test:coverage
```

---

## 8. Success Metrics

### Testing Metrics
| Metric | Target | Current |
|--------|--------|---------|
| Unit Test Coverage | >80% | 0% |
| Integration Tests | >20 | 0 |
| E2E Tests | >5 | 0 |
| Test Runtime | <30s | N/A |

### Performance Metrics
| Metric | Target | Current |
|--------|--------|---------|
| Preview Generation | <5s | ~15s |
| Template Matching | <100ms | Manual |
| API Response Time | <500ms | ~2s |

---

## 9. Next Steps

### Immediate (Today)
- [ ] Create test fixtures
- [ ] Write first unit tests
- [ ] Configure MCP Servers

### This Week
- [ ] Implement Stitch MCP integration
- [ ] Optimize preview generation
- [ ] Add CI pipeline

### Next Sprint
- [ ] E2E testing
- [ ] Performance optimization
- [ ] Production monitoring

---

## 10. Resources

### Documentation
- [Stitch MCP](https://github.com/stitch-ai/stitch-mcp)
- [Vitest Testing](https://vitest.dev)
- [Next.js Testing](https://nextjs.org/docs/testing)

### Tools
```bash
# Install test dependencies
npm install -D vitest @testing-library/react @testing-library/user-event

# Install Stitch MCP
npm install -g @stitch-ai/stitch-mcp

# Run tests
npm run test
```

---

*Plan created: 2026-02-07*
*Author: Bottie AI 🧠*
