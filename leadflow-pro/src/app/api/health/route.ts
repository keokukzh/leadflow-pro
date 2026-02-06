import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  const health: any = {
    status: "UP",
    timestamp: new Date().toISOString(),
    services: {
      database: { status: "UNKNOWN" },
      environment: { status: "HEALTHY" },
    },
  };

  try {
    // 1. Check Environment Variables
    const requiredEnvPaths = [
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "SUPABASE_SERVICE_ROLE_KEY",
    ];

    const missing = requiredEnvPaths.filter((key) => !process.env[key]);
    if (missing.length > 0) {
      health.services.environment = {
        status: "DEGRADED",
        missing_vars: missing,
      };
      health.status = "DEGRADED";
    }

    // 2. Check Database Connection
    if (
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
      );

      const { data, error } = await supabase.from("leads").select("id").limit(1).maybeSingle();

      // If table doesn't exist, that's fine, we just want to see if we can connect
      if (error && error.code !== "PGRST116" && error.code !== "42P01") {
        health.services.database = {
          status: "DOWN",
          error: error.message,
        };
        health.status = "DOWN";
      } else {
        health.services.database = { status: "HEALTHY" };
      }
    } else {
      health.services.database = { status: "CONFIG_MISSING" };
    }

    return NextResponse.json(health, {
      status: health.status === "DOWN" ? 503 : 200,
    });
  } catch (error: any) {
    health.status = "DOWN";
    health.error = error.message;
    return NextResponse.json(health, { status: 500 });
  }
}
