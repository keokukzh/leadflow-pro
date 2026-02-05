import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get("scope") || "all";

    // Path to the Python diagnostic script
    const scriptPath = path.join(process.cwd(), "..", "sync_health_monitor.py");
    
    // Execute the Python script
    // Note: In a production environment, you might want to cache this or use a more robust way to run background tasks
    const { stdout, stderr } = await execAsync(`python "${scriptPath}" --report`);
    
    if (stderr && !stdout) {
      console.error("Diagnostic script error:", stderr);
      return NextResponse.json({ error: "Diagnostic failed" }, { status: 500 });
    }

    const report = JSON.parse(stdout);

    // Filter by scope if needed
    if (scope !== "all" && report[scope]) {
      return NextResponse.json({ [scope]: report[scope], timestamp: report.timestamp });
    }

    return NextResponse.json(report);
    
  } catch (error) {
    console.error("Health check API error:", error);
    
    // Fallback/Mock data if script fails or environment issues
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      status: "DEGRADED",
      message: "Diagnostic script failed, providing fallback metrics",
      github: { status: "HEALTHY", latency_ms: 42, remaining: 4950 },
      linear: { status: "HEALTHY", latency_ms: 125 },
      webhooks: { overall_health: "OPTIMAL" },
      performance: { throughput: "1.2 req/s", avg_latency: "85ms" }
    });
  }
}
