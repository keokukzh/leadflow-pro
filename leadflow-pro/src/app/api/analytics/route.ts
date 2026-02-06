import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { readData, writeData } from "@/lib/storage";
import { supabase } from "@/lib/supabase";

const EVENTS_FILE = "analytics_events.json";
const AB_TESTS_FILE = "ab_tests.json";

interface AnalyticsEvent {
  id: string;
  event_type: string;
  lead_id?: string;
  user_id?: string;
  properties: Record<string, unknown>;
  timestamp: string;
}

interface ABTest {
  id: string;
  name: string;
  variants: Record<string, unknown>;
  traffic_split: Record<string, number>;
  metrics: Record<string, { visitors: number; conversions: number; revenue: number; conversion_rate: number }>;
  status: "running" | "paused" | "completed";
  start_date: string;
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

const ABTestActionSchema = z.object({
  action: z.enum(["create_test", "assign", "convert"]),
  test_id: z.string().optional(),
  variant: z.string().optional(),
  value: z.number().min(0).optional(),
  user_id: z.string().optional(),
  name: z.string().optional(),
  variants: z.record(z.any()).optional(),
  traffic_split: z.record(z.number()).optional()
});

// ============================================
// ANALYTICS DASHBOARD API
// ============================================

export async function GET() {
  try {
    // Echte Metriken aus Supabase
    const { data: leads, error } = await supabase
      .from('leads')
      .select('status, created_at');
    
    if (error) {
      console.error("Supabase analytics error:", error);
      return NextResponse.json({ error: "Failed to fetch from Supabase" }, { status: 500 });
    }

    const totalLeads = leads?.length || 0;
    const convertedLeads = leads?.filter(l => l.status === 'WON').length || 0;
    // Calculation: Total revenue (Avg 2500 CHF per WON lead)
    const totalRevenue = convertedLeads * 2500;
    
    // Calculate conversion rate
    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

    const metrics = {
      totalLeads,
      convertedLeads,
      totalRevenue,
      conversionRate: parseFloat(conversionRate.toFixed(2)),
      avgDealSize: 2500,
      responseTime: 24 // hours avg placeholder
    };
    
    // Also include A/B test data from local storage for now
    const abTests = await readData<ABTest[]>(AB_TESTS_FILE, []);

    return NextResponse.json({
      overview: metrics,
      ab_tests: abTests,
      source: "supabase"
    });
    
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
    const validationResult = TrackEventSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json({ error: "Validation failed", details: validationResult.error.errors }, { status: 400 });
    }
    
    const { event_type, lead_id, user_id, properties } = validationResult.data;
    const events = await readData<AnalyticsEvent[]>(EVENTS_FILE, []);
    
    const newEvent: AnalyticsEvent = {
      id: Math.random().toString(36).substring(7),
      event_type,
      lead_id,
      user_id,
      properties: properties || {},
      timestamp: new Date().toISOString()
    };
    
    events.push(newEvent);
    await writeData(EVENTS_FILE, events);
    
    return NextResponse.json({ success: true, event: newEvent });
    
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
      return NextResponse.json({ error: "Validation failed", details: validationResult.error.errors }, { status: 400 });
    }
    
    const { action, test_id, variant, value, user_id } = validationResult.data;
    const abTests = await readData<ABTest[]>(AB_TESTS_FILE, []);
    
    if (action === "create_test") {
      const { name, variants, traffic_split } = validationResult.data;
      if (!name || !variants || !traffic_split) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }
      
      const newTest: ABTest = {
        id: Math.random().toString(36).substring(7),
        name,
        variants,
        traffic_split,
        metrics: Object.keys(variants).reduce((acc: Record<string, { visitors: number; conversions: number; revenue: number; conversion_rate: number }>, v) => {
          acc[v] = { visitors: 0, conversions: 0, revenue: 0, conversion_rate: 0 };
          return acc;
        }, {}),
        status: "running",
        start_date: new Date().toISOString()
      };
      
      abTests.push(newTest);
      await writeData(AB_TESTS_FILE, abTests);
      return NextResponse.json({ test: newTest });
    }
    
    if (action === "assign") {
      const test = abTests.find(t => t.id === test_id);
      if (!test) return NextResponse.json({ error: "Test not found" }, { status: 404 });
      
      const hash = (user_id || "anon").split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const keys = Object.keys(test.traffic_split);
      const assigned_variant = keys[hash % keys.length];
      
      test.metrics[assigned_variant].visitors += 1;
      await writeData(AB_TESTS_FILE, abTests);
      
      return NextResponse.json({ variant: assigned_variant });
    }
    
    if (action === "convert") {
      const test = abTests.find(t => t.id === test_id);
      if (!test || !variant || !test.metrics[variant]) {
        return NextResponse.json({ error: "Invalid test or variant" }, { status: 400 });
      }
      
      test.metrics[variant].conversions += 1;
      test.metrics[variant].revenue += (value || 0);
      test.metrics[variant].conversion_rate = test.metrics[variant].visitors > 0 
        ? test.metrics[variant].conversions / test.metrics[variant].visitors 
        : 0;
        
      await writeData(AB_TESTS_FILE, abTests);
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    
  } catch (error) {
    console.error("A/B test error:", error);
    return NextResponse.json({ error: "A/B test failed" }, { status: 500 });
  }
}
