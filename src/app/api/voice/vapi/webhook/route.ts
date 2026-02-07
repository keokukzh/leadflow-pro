// ============================================
// LeadFlow Pro - VAPI Webhook Handler
// POST /api/voice/vapi/webhook
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/client';
import type { CallStatus } from '@/lib/db/types';

/**
 * VAPI sends webhook events for:
 * - call.completed
 * - call.started
 * - call.failed
 * - speech.detected
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, data } = body;

    console.log(`📞 VAPI Webhook: ${event}`, data);

    switch (event) {
      case 'call.completed':
        await handleCallCompleted(data);
        break;
        
      case 'call.started':
        await handleCallStarted(data);
        break;
        
      case 'call.failed':
        await handleCallFailed(data);
        break;
        
      case 'speech.detected':
        // Optional: Log speech events
        break;
        
      default:
        console.log(`⚠️ Unknown VAPI event: ${event}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('❌ VAPI Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function handleCallCompleted(data: any) {
  const { id: callSid, duration, recording_url, cost, metadata } = data;

  // Update call record
  const { error } = await supabase
    .from('voice_calls')
    .update({
      status: 'completed' as CallStatus,
      duration: Math.round(duration),
      recording_url,
      cost,
      ended_at: new Date().toISOString(),
    })
    .eq('call_sid', callSid);

  if (error) {
    console.error('❌ Error updating completed call:', error);
    return;
  }

  // Log activity if we have lead_id
  if (metadata?.lead_id) {
    const { error: activityError } = await supabase
      .from('activities')
      .insert({
        lead_id: metadata.lead_id,
        type: 'call',
        description: `Call completed (${Math.round(duration)}s)`,
        metadata: {
          call_sid: callSid,
          recording_url,
          cost,
        },
      });

    if (activityError) {
      console.error('❌ Error logging activity:', activityError);
    }
  }

  console.log(`✅ Call completed: ${callSid} (${duration}s)`);
}

async function handleCallStarted(data: any) {
  const { id: callSid, started_at, metadata } = data;

  // Update call record
  const { error } = await supabase
    .from('voice_calls')
    .update({
      status: 'in_progress' as CallStatus,
      started_at,
    })
    .eq('call_sid', callSid);

  if (error) {
    console.error('❌ Error updating started call:', error);
    return;
  }

  console.log(`📞 Call started: ${callSid}`);
}

async function handleCallFailed(data: any) {
  const { id: callSid, reason, ended_at, metadata } = data;

  // Determine status based on reason
  let status: CallStatus = 'failed';
  if (reason?.toLowerCase().includes('busy')) {
    status = 'busy';
  } else if (reason?.toLowerCase().includes('no answer') || reason?.toLowerCase().includes('unanswered')) {
    status = 'no_answer';
  }

  // Update call record
  const { error } = await supabase
    .from('voice_calls')
    .update({
      status,
      ended_at,
      metadata: {
        reason,
      },
    })
    .eq('call_sid', callSid);

  if (error) {
    console.error('❌ Error updating failed call:', error);
    return;
  }

  // Log activity
  if (metadata?.lead_id) {
    await supabase
      .from('activities')
      .insert({
        lead_id: metadata.lead_id,
        type: 'call',
        description: `Call failed: ${reason}`,
      });
  }

  console.log(`❌ Call failed: ${callSid} - ${reason}`);
}
