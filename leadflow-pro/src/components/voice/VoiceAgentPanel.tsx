"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Phone, PhoneCall, PhoneOff, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface VoiceAgentPanelProps {
  leadId: string;
  leadName: string;
  phoneNumber: string;
}

export function VoiceAgentPanel({ leadId, leadName, phoneNumber }: VoiceAgentPanelProps) {
  const [isCalling, setIsCalling] = useState(false);
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'connected' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const startCall = async () => {
    setIsCalling(true);
    setCallStatus('calling');
    setError(null);

    try {
      const response = await fetch('/api/voice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leadId,
          phoneNumber,
          script: 'cold_call',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start call');
      }

      setCallStatus('connected');
    } catch (err: any) {
      console.error('Call Error:', err);
      setError(err.message || 'Error initiating call');
      setCallStatus('error');
    } finally {
      setIsCalling(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">AI Voice Agent</CardTitle>
            <CardDescription>Initiate a smart cold call via Bottie</CardDescription>
          </div>
          <Badge variant={callStatus === 'connected' ? 'default' : 'secondary'} className="capitalize">
            {callStatus}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 p-4 rounded-lg bg-accent/20 border">
          <div className="p-2 rounded-full bg-primary/10">
            <Phone className="size-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">{leadName}</p>
            <p className="text-xs text-muted-foreground">{phoneNumber}</p>
          </div>
        </div>

        {error && (
          <p className="text-xs text-destructive bg-destructive/10 p-2 rounded">{error}</p>
        )}

        <Button 
          className="w-full" 
          size="lg"
          onClick={startCall}
          disabled={isCalling || callStatus === 'calling' || !phoneNumber}
        >
          {isCalling ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Initializing...
            </>
          ) : callStatus === 'connected' ? (
            <>
              <PhoneCall className="mr-2 h-4 w-4" />
              Call Initiated
            </>
          ) : (
            <>
              <Phone className="mr-2 h-4 w-4" />
              Start Cold Call
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
