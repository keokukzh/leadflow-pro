# Cost-Effective Creator Agent Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reduce LLM costs for website generation by switching to free models and providing an external high-end preview option via Google Stitch.

**Architecture:**
1.  **Model Flexibility**: Modify `ai-client.ts` to support model overrides per request.
2.  **Free Model Defaults**: Add settings for specific agent models, defaulting the Creator Agent to `google/gemini-2.0-flash-exp:free` (OpenRouter).
3.  **External Preview**: Implement a "Stitch Super-Prompt" generator in the Creator UI that constructs descriptive design prompts for use with `stitch.withgoogle.com`.

**Tech Stack:** Next.js, OpenAI SDK (via OpenRouter), Tailwind CSS, Lucide Icons.

---

### Task 1: AI Client Model Overrides

**Files:**
- Modify: `src/lib/ai-client.ts`

**Step 1: Update `getCompletion` signature**

```typescript
export async function getCompletion(
  prompt: string, 
  systemPrompt: string = "You are a helpful assistant.",
  modelOverride?: string
)
```

**Step 2: Use override in OpenAI call**

```typescript
const response = await openai.chat.completions.create({
  model: modelOverride || (isOpenRouter ? "openai/gpt-4o" : "gpt-4o"),
  // ...
});
```

**Step 3: Commit**

```bash
git add src/lib/ai-client.ts
git commit -m "feat: add model override support to getCompletion"
```

---

### Task 2: Settings and Defaults

**Files:**
- Modify: `src/lib/settings.ts`

**Step 1: Update `Settings` interface**

```typescript
export interface Settings {
  // ... existing
  creatorModel: string;
}
```

**Step 2: Update `DEFAULT_SETTINGS`**

```typescript
const DEFAULT_SETTINGS: Settings = {
  // ... existing
  creatorModel: 'google/gemini-2.0-flash-exp:free', // Default to free on OpenRouter
};
```

**Step 3: Commit**

```bash
git add src/lib/settings.ts
git commit -m "feat: add creatorModel to settings"
```

---

### Task 3: Cost-Effective Generation

**Files:**
- Modify: `src/lib/actions/server-actions.ts`

**Step 1: Update `generateSiteConfig` to use settings model**

```typescript
export async function generateSiteConfig(leadId: string) {
  const settings = await getSettings();
  const model = settings.creatorModel;
  // ...
  const content = await getCompletion(prompt, system, model);
  // ...
}
```

**Step 2: Commit**

```bash
git add src/lib/actions/server-actions.ts
git commit -m "feat: use creatorModel from settings for site generation"
```

---

### Task 4: Stitch Integration UI

**Files:**
- Modify: `src/app/creator/page.tsx`

**Step 1: Construct Stitch Prompt**

```typescript
const generateStitchPrompt = (lead: Lead) => {
  return `Create a high-converting website for ${lead.company_name} in the ${lead.industry} industry. 
  Tone: ${lead.strategy_brief?.brandTone}. 
  Colors: ${lead.strategy_brief?.colorPalette.map(c => c.name).join(', ')}.
  Key Selling Points: ${lead.strategy_brief?.keySells.join(', ')}.
  Design a modern, professional layout with sections for Hero, Services, Reviews, and Contact.`;
};
```

**Step 2: Add UI button and copy logic**

Add a "Stitch AI Design" card to the sidebar with a "Kopier & Öffne Stitch" button.

**Step 3: Commit**

```bash
git add src/app/creator/page.tsx
git commit -m "feat: add Stitch integration to Creator Agent"
```

---

### Verification Plan

**Automated Tests:**
- No new automated tests; manual verification required for LLM connection check.

**Manual Verification:**
1. Go to Settings, ensure `creatorModel` is set to a free model.
2. Go to Strategy Agent, select a lead, save strategy.
3. Click "Weiter zum Website-Entwurf".
4. Verify that the website generates successfully without credit errors.
5. Check the sidebar for the "Stitch" button, click it, verify prompt is copied, and Stitch opens.
