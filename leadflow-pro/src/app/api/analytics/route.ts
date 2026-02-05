import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { AnalyticsDashboard } from "@/lib/analytics/dashboard";

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Analytics dashboard singleton
let analyticsDashboard: AnalyticsDashboard | null = null;

function getAnalyticsDashboard(): AnalyticsDashboard {
  if (!analyticsDashboard) {
    analyticsDashboard = new AnalyticsDashboard();
  }
  return analyticsDashboard;
}

// ============================================
// ANALYTICS DASHBOARD API
// ============================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "24h";
    
    const dashboard = getAnalyticsDashboard();
    const data = dashboard.get_dashboard_data();
    
    return NextResponse.json(data);
    
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "Failed to get analytics" }, { status: 500 });
  }
}

// ============================================
// TRACK EVENT API
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event_type, lead_id, user_id, properties } = body;
    
    if (!event_type) {
      return NextResponse.json({ error: "event_type is required" }, { status: 400 });
    }
    
    const dashboard = getAnalyticsDashboard();
    dashboard.track_event(event_type, lead_id, user_id, properties);
    
    // Store in database for persistence
    await supabase.from("analytics_events").insert({
      event_type,
      lead_id,
      user_id,
      properties: properties || {},
      created_at: new Date().toISOString()
    });
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error("Track event error:", error);
    return NextResponse.json({ error: "Failed to track event" }, { status: 500 });
  }
}

// ============================================
// A/B TESTING API
// ============================================

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, test_id, variant, value, metadata } = body;
    
    const dashboard = getAnalyticsDashboard();
    
    if (action === "create_test") {
      const { name, variants, traffic_split } = body;
      
      const test = dashboard.create_ab_test(
        name,
        variants || { "a": {}, "b": {} },
        traffic_split || { "a": 0.5, "b": 0.5 }
      );
      
      // Save to database
      await supabase.from("ab_tests").insert({
        id: test.id,
        name: test.name,
        variants: test.variants,
        traffic_split: test.traffic_split,
        metrics: test.metrics,
        status: test.status,
        start_date: test.start_date?.toISOString()
      });
      
      return NextResponse.json({ test });
    }
    
    if (action === "assign") {
      const user_id = body.user_id || "anonymous";
      const assigned_variant = dashboard.assign_variant(test_id, user_id);
      
      // Update test metrics
      const test = dashboard._ab_tests.get(test_id);
      if (test) {
        test.metrics[assigned_variant].visitors += 1;
      }
      
      return NextResponse.json({ variant: assigned_variant });
    }
    
    if (action === "convert") {
      dashboard.record_conversion(test_id, variant, value || 0, metadata);
      
      // Update database
      await supabase.rpc("increment_ab_conversion", {
        test_id_input: test_id,
        variant_input: variant,
        value_input: value || 0
      });
      
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    
  } catch (error) {
    console.error("A/B test error:", error);
    return NextResponse.json({ error: "A/B test operation failed" }, { status: 500 });
  }
}

// ============================================
// EXPORT ANALYTICS
// ============================================

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "json";
    
    const dashboard = getAnalyticsDashboard();
    const report = dashboard.export_report(format);
    
    if (format === "json") {
      return NextResponse.json(JSON.parse(report));
    }
    
    return new NextResponse(report, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="analytics-report-${Date.now()}.csv"`
      }
    });
    
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Failed to export analytics" }, { status: 500 });
  }
}
