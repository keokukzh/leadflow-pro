import { searchLeadsWithPerplexity } from './lib/perplexity';

async function testPerplexity() {
  console.log("Starting Perplexity Search Test...");
  const industry = "Zahnarzt";
  const location = "Zürich";

  try {
    const results = await searchLeadsWithPerplexity(industry, location);
    console.log("Search results received:");
    console.log(JSON.stringify(results, null, 2));
    
    if (results.length > 0) {
      console.log("✅ SUCCESS: Found leads via Perplexity.");
    } else {
      console.log("⚠️ WARNING: No leads found, but request succeeded.");
    }
  } catch (error: any) {
    if (error.message.includes("401") || error.message.includes("API Key fehlt")) {
      console.log("ℹ️ INFO: Test could not be fully completed because API key is missing. This is expected if the user hasn't provided a key yet.");
      console.log("Error details:", error.message);
    } else {
      console.error("❌ ERROR during Perplexity test:", error.message);
    }
  }
}

testPerplexity();
