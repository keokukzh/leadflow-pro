import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Analytics dashboard singleton (lazy initialization)
let analyticsDashboard: any = null;

function getAnalyticsDashboard(): any {
  if (!analyticsDashboard) {
    analyticsDashboard = {
      _events: [],
      _ab_tests: {},
      track_event: function(eventType: string, leadId?: string, userId?: string, props?: Record<string, any>) {
        this._events.push({
          id: Math.random().toString(36).substring(7),
          event_type: eventType,
          lead_id: leadId,
          user_id: userId,
          properties: props || {},
          timestamp: new Date()
        });
      },
      create_ab_test: function(name: string, variants: Record<string, any>, trafficSplit: Record<string, number>) {
        const test = {
          id: Math.random().toString(36).substring(7),
          name,
          variants,
          traffic_split: trafficSplit,
          metrics: Object.keys(variants).reduce((acc: Record<string, any>, v) => {
            acc[v] = { visitors: 0, conversions: 0, revenue: 0, conversion_rate: 0 };
            return acc;
          }, {}),
          status: "running",
          start_date: new Date()
        };
        this._ab_tests[test.id] = test;
        return test;
      },
      assign_variant: function(testId: string, userId: string) {
        const test = this._ab_tests[testId];
        if (!test) return "a";
        // Deterministic assignment
        const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const keys = Object.keys(test.traffic_split);
        const index = hash % keys.length;
        return keys[index];
      },
      record_conversion: function(testId: string, variant: string, value: number) {
        const test = this._ab_tests[testId];
        if (test && test.metrics[variant]) {
          test.metrics[variant].conversions += 1;
          test.metrics[variant].revenue += value;
          const visitors = test.metrics[variant].visitors;
          test.metrics[variant].conversion_rate = visitors > 0 ? test.metrics[variant].conversions / visitors : 0;
        }
      },
      get_dashboard_data: function() {
        const now = new Date();
        const recentEvents = this._events.filter((e: any) => 
          now.getTime() - new Date(e.timestamp).getTime() < 24 * 60 * 60 * 1000
        );
        return {
          overview: {
            total_events: this._events.length,
            events_24h: recentEvents.length,
            active_ab_tests: Object.values(this._ab_tests).filter((t: any) => t.status === "running").length,
            conversion_rate_24h: 0
          }
        };
      },
      export_report: function(format: string) {
        return JSON.stringify(this.get_dashboard_data(), null, 2);
      }
    };
  }
  return analyticsDashboard;
}

// ============================================
// VALIDATION SCHEMAS
// ============================================

const TrackEventSchema = z.object({
  event_type: z.string().min(1).max(100),
  lead_id: z.string().uuid().optional(),
  user_id: z.string().optional(),
  properties: z.record(z.any()).optional()
});

const CreateABTestSchema = z.object({
  name: z.string().min(1).max(100),
  variants: z.record(z.object({})),
  traffic_split: z.record(z.number().min(0).max(1))
});

const ABTestActionSchema = z.object({
  action: z.enum(["create_test", "assign", "convert"]),
  test_id: z.string().optional(),
  variant: z.string().optional(),
  value: z.number().min(0).optional(),
  user_id: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  // For create_test
  name: z.string().optional(),
  variants: z.record(z.object({})).optional(),
  traffic_split: z.record(z.number()).optional()
});

// ============================================
// ANALYTICS DASHBOARD API
// ============================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "24h";
    
    // Validate range
    if (!["24h", "7d", "30d", "90d"].includes(range)) {
      return NextResponse.json({ error: "Invalid range parameter" }, { status: 400 });
    }
    
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
    
    // Validate input
    const validationResult = TrackEventSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.errors },
        { status: 400 }
      );
    }
    
    const { event_type, lead_id, user_id, properties } = validationResult.data;
    const dashboard = getAnalyticsDashboard();
    
    dashboard.track_event(event_type, lead_id, user_id, properties);
    
    // Store in database (sanitized)
    await supabase.from("analytics_events").insert({
      event_type,
      lead_id: lead_id || null,
      user_id: user_id || null,
      created_at: new Date().toISOString()
    }).select();
    
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
    
    const validationResult = ABTestActionSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.errors },
        { status: 400 }
      );
    }
    
    const { action, test_id, variant, value, user_id } = validationResult.data;
    const dashboard = getAnalyticsDashboard();
    
    if (action === "create_test") {
      const { name, variants, traffic_split } = validationResult.data;
      
      if (!name || !variants || !traffic_split) {
        return NextResponse.json({ error: "Missing required fields for create_test" }, { status: 400 });
      }
      
      const createResult = CreateABTestSchema.safeParse({ name, variants, traffic_split });
      if (!createResult.success) {
        return NextResponse.json(
          { error: "Invalid test configuration", details: createResult.error.errors },
          { status: 400 }
        );
      }
      
      const test = dashboard.create_ab_test(name, variants, traffic_split);
      
      // Save to database
      await supabase.from("ab_tests").insert({
        id: test.id,
        name: test.name,
        variants: test.variants,
        traffic_split: test.traffic_split,
        metrics: test.metrics,
        status: test.status,
        start_date: test.start_date.toISOString()
      });
      
      return NextResponse.json({ test });
    }
    
    if (action === "assign") {
      if (!test_id) {
        return NextResponse.json({ error: "test_id is required" }, { status: 400 });
      }
      
      const assignedUserId = user_id || "anonymous";
      const assigned_variant = dashboard.assign_variant(test_id, assignedUserId);
      
      // Update test metrics
      const test = dashboard._ab_tests[test_id];
      if (test && test.metrics[assigned_variant]) {
        test.metrics[assigned_variant].visitors += 1;
      }
      
      return NextResponse.json({ variant: assigned_variant });
    }
    
    if (action === "convert") {
      if (!test_id || !variant) {
        return NextResponse.json({ error: "test_id and variant are required" }, { status: 400 });
      }
      
      dashboard.record_conversion(test_id, variant, value || 0, {});
      
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
    
    if (!["json", "csv"].includes(format)) {
      return NextResponse.json({ error: "Invalid format. Use 'json' or 'csv'" }, { status: 400 });
    }
    
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
