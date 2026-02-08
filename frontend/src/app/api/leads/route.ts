import { NextRequest, NextResponse } from "next/server";
import { getLeadsSafe, createLead } from "@/lib/actions/server-actions";

export async function GET() {
  try {
    const leads = await getLeadsSafe();
    return NextResponse.json(leads);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { company_name, industry, location, website } = await request.json();
    
    if (!company_name || !industry || !location) {
      return NextResponse.json(
        { error: "Missing required fields: company_name, industry, location" },
        { status: 400 }
      );
    }

    const newLead = await createLead(company_name, industry, location, website || null);
    return NextResponse.json(newLead);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
