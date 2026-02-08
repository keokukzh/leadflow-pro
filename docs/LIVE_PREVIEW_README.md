# 🎨 Live Preview Component

Complete Live Preview implementation with Mobile Toggle.

## Files

### Components
- `src/components/preview/LivePreview.tsx` - Main preview component with device toggle
- `src/components/preview/index.ts` - Export barrel

### API Routes
- `src/app/api/preview/generate/route.ts` - Preview generation endpoint
- `src/app/api/preview/route.ts` - Share link retrieval

### Pages
- `src/app/preview/share/[token]/page.tsx` - Shareable preview page

## Features

### Device Toggle
```
🖥️ Desktop - Full width preview
📱 Tablet - 768px frame
📲 Mobile - 375px frame with notch
```

### Headline Variants
```
👔 Professional - Seriös & kompetent
😊 Friendly - Warm & einladend  
🔥 Urgent - Handlungsorientiert
📖 Story - Narrativ & emotional
```

### Shareable Links
- 7-day expiration
- Direct URL access
- Copy to clipboard

## Usage

```tsx
import { LivePreview } from "@/components/preview";

<LivePreview 
  lead={lead}
  templateStyle="swiss_neutral"
  initialDevice="desktop"
/>
```

## API

### POST /api/preview/generate
```json
{
  "leadId": "lead-123",
  "templateStyle": "swiss_neutral",
  "variant": "professional",
  "device": "desktop"
}
```

### GET /api/preview?token=abc123
Returns cached HTML preview.

## Caching
- Preview HTML: 1 hour TTL
- Share tokens: 7 days
- 1000 preview cache capacity
