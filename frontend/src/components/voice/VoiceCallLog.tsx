"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from 'date-fns';
import { Phone, Clock, Calendar } from "lucide-react";

interface CallLog {
  id: string;
  leadId: string;
  phoneNumber: string;
  status: string;
  startTime: string;
  duration?: number;
}

interface VoiceCallLogProps {
  leadId: string;
}

export function VoiceCallLog({ leadId }: VoiceCallLogProps) {
  const [logs, setLogs] = useState<CallLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch(`/api/voice?leadId=${leadId}`);
        const data = await response.json();
        setLogs(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to fetch call logs:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();
    // Refresh interval for live status updates
    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, [leadId]);

  if (isLoading) {
    return <div className="text-sm text-muted-foreground p-4">Loading call history...</div>;
  }

  if (logs.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center text-muted-foreground text-sm">
          No calls logged for this lead yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <Phone className="size-4" /> Call History
      </h3>
      {logs.map((log) => (
        <Card key={log.id} className="overflow-hidden">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Badge variant={
                    log.status === 'COMPLETED' ? 'default' : 
                    log.status === 'FAILED' ? 'destructive' : 'secondary'
                  } className="text-[10px] h-4 px-1">
                    {log.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(log.startTime), { addSuffix: true })}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-[11px] text-muted-foreground mt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3" />
                    {new Date(log.startTime).toLocaleDateString()}
                  </span>
                  {log.duration && (
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" />
                      {log.duration}s
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
