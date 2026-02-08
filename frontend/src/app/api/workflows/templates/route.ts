import { NextResponse } from "next/server";

export async function GET() {
  const templates = [
    {
      id: "cold-outreach",
      name: "Cold Outreach",
      description: "Automatische Erstkontaktierung",
      steps: [
        { type: "email", template: "cold_email_v1", delay: 0 },
        { type: "wait", duration: 48 * 60 * 60 * 1000 }, // 48h
        { type: "call", script: "follow_up_call", delay: 0 }
      ]
    },
    {
      id: "demo-followup",
      name: "Demo Follow-up",
      description: "Nach Demo-Versand",
      steps: [
        { type: "email", template: "demo_sent", delay: 0 },
        { type: "wait", duration: 24 * 60 * 60 * 1000 },
        { type: "call", script: "demo_discussion", delay: 0 }
      ]
    }
  ];
  
  return NextResponse.json(templates);
}
