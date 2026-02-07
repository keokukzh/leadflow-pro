// ============================================
// LeadFlow Pro - VAPI API Route
// POST /api/voice/vapi
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createVapiService, isVapiConfigured } from '@/services/voice/vapi/vapiService';
import { getLeadById } from '@/lib/db/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { leadId, phoneNumber, leadData } = body;

    // Check if VAPI is configured
    if (!isVapiConfigured()) {
      return NextResponse.json({
        success: false,
        error: 'VAPI not configured',
        message: 'Please set VAPI_API_KEY, VAPI_ASSISTANT_ID, and VAPI_PHONE_NUMBER in .env.local',
        missingKeys: [
          !process.env.VAPI_API_KEY ? 'VAPI_API_KEY' : null,
          !process.env.VAPI_ASSISTANT_ID ? 'VAPI_ASSISTANT_ID' : null,
          !process.env.VAPI_PHONE_NUMBER ? 'VAPI_PHONE_NUMBER' : null,
        ].filter(Boolean),
      }, { status: 500 });
    }

    // Get lead data
    let lead: any = leadData;
    if (leadId && !lead) {
      lead = await getLeadById(leadId);
    }

    if (!lead && !phoneNumber) {
      return NextResponse.json({
        success: false,
        error: 'Missing lead data',
        message: 'Provide leadId, phoneNumber, or leadData',
      }, { status: 400 });
    }

    const phone = phoneNumber || lead?.phone;
    if (!phone) {
      return NextResponse.json({
        success: false,
        error: 'No phone number',
        message: 'Lead has no phone number',
      }, { status: 400 });
    }

    const vapi = createVapiService();
    const result = await vapi.initiateColdCall({
      id: leadId || 'unknown',
      company_name: lead?.company_name || 'Customer',
      phone,
      email: lead?.email,
      industry: lead?.industry,
      location: lead?.location,
      google_rating: lead?.google_rating,
      google_reviews_count: lead?.google_reviews_count,
      score: lead?.score || 0,
      status: 'NEW',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as any);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error,
        message: 'Failed to initiate call',
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      callId: result.callId,
      status: result.status,
      message: 'Call initiated successfully',
      lead: {
        company_name: lead?.company_name,
        phone: phone,
      },
    });
  } catch (error) {
    console.error('❌ VAPI POST error:', error);
    return NextResponse.json({
      success: false,
      error: String(error),
      message: 'Internal server error',
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const callId = searchParams.get('callId');
  const action = searchParams.get('action');

  // Test connection endpoint
  if (action === 'test') {
    const vapi = createVapiService();
    const result = await vapi.testConnection();
    
    return NextResponse.json({
      success: result.success,
      configured: isVapiConfigured(),
      error: result.error,
    });
  }

  // Get assistant details
  if (action === 'assistant') {
    const vapi = createVapiService();
    const details = await vapi.getAssistantDetails();
    
    return NextResponse.json({
      success: !!details,
      assistant: details,
    });
  }

  // Get call status
  if (callId) {
    const vapi = createVapiService();
    const status = await vapi.getCallStatus(callId);
    
    if (!status) {
      return NextResponse.json({
        success: false,
        error: 'Call not found',
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      call: status,
    });
  }

  // Default: return configuration status
  return NextResponse.json({
    configured: isVapiConfigured(),
    provider: 'vapi',
    missingKeys: [
      !process.env.VAPI_API_KEY ? 'VAPI_API_KEY' : null,
      !process.env.VAPI_ASSISTANT_ID ? 'VAPI_ASSISTANT_ID' : null,
      !process.env.VAPI_PHONE_NUMBER ? 'VAPI_PHONE_NUMBER' : null,
    ].filter(Boolean),
  });
}
