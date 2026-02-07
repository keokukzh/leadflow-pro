# TESTING \u0026 STITCH PLAN

## Goal
Improve reliability via automated testing and optimize high-end preview generation through Stitch MCP.

## Phase 1: Unit Testing (Fast)
- **Lead Matching**: Test `matchTemplate(lead)` in `workflowEngine.ts`.
- **Scoring**: Verify `calculateLeadScore` logic.
- **Utilities**: Ensure `escapeXml` and `maskPhone` work for edge cases.

## Phase 2: Integration Testing
- **Workflow Engine**: Test the complete flow of `runWorkflow(leadId)`.
- **Supabase Sync**: Verify local writes trigger database synchronization.

## Phase 3: E2E Testing
- **Voice Flow**: Simulate initiating a call, received by webhook, and logged to dashboard.
- **Stitch Export**: Verify "Export via Stitch" copies the correct prompt and opens the portal.

## Stitch MCP Configuration
Add the following to your MCP configuration to enable specialized AI design assistance:

```json
{
  "mcpServers": {
    "stitch": {
      "command": "npx",
      "args": ["-y", "@stitch-ai/stitch-mcp"],
      "env": {
        "STITCH_API_KEY": "INSERT_KEY_HERE"
      }
    }
  }
}
```

## Success Metrics
- **Coverage**: \u003e80%
- **Preview Time**: \u003c5s
- **Template Match Accuracy**: \u003c100ms
