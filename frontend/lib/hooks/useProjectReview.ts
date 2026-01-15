'use client';

import { useState, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface ProjectApplication {
  id: string;
  wallet_address: string;
  project_name: string;
  description: string;
  category: string;
  image_url: string | null;
  country: string;
  region: string;
  latitude: number | null;
  longitude: number | null;
  funding_goal: number;
  bond_price: number;
  revenue_model: string;
  projected_apy: number;
  milestones: { description: string; target_date: string }[];
  status: 'pending' | 'in_review' | 'approved' | 'rejected' | 'created';
  agent_analysis: any | null;
  final_funding_goal: number | null;
  final_projected_apy: number | null;
  final_milestones: any | null;
  project_id: string | null;
  tx_hash: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  application_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: any;
  created_at: string;
}

export interface StreamEvent {
  type: 'status' | 'analysis' | 'token' | 'done' | 'error';
  data: any;
}

// Submit new application
async function submitApplication(data: Omit<ProjectApplication, 'id' | 'status' | 'agent_analysis' | 'final_funding_goal' | 'final_projected_apy' | 'final_milestones' | 'project_id' | 'tx_hash' | 'created_at' | 'updated_at'>): Promise<ProjectApplication> {
  const res = await fetch('/api/review/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const result = await res.json();
  if (!res.ok) throw new Error(result.error);
  return result.data;
}

// Fetch application with messages
async function fetchApplication(id: string): Promise<{ application: ProjectApplication; messages: ChatMessage[] }> {
  const res = await fetch(`/api/review/${id}/chat`);
  const result = await res.json();
  if (!res.ok) throw new Error(result.error);
  return result;
}

// Update application
async function updateApplication(id: string, data: any): Promise<ProjectApplication> {
  const res = await fetch(`/api/review/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const result = await res.json();
  if (!res.ok) throw new Error(result.error);
  return result.data;
}

export function useProjectReview(applicationId?: string) {
  const queryClient = useQueryClient();
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [streamEvents, setStreamEvents] = useState<StreamEvent[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Query for fetching application data
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['review', applicationId],
    queryFn: () => fetchApplication(applicationId!),
    enabled: !!applicationId,
  });

  // Mutation for submitting new application
  const submitMutation = useMutation({
    mutationFn: submitApplication,
    onSuccess: (data) => {
      toast.success('Application submitted for review!');
      return data;
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Mutation for updating application
  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & any) => updateApplication(id, data),
    onSuccess: () => {
      if (applicationId) {
        queryClient.invalidateQueries({ queryKey: ['review', applicationId] });
      }
    },
  });

  // Send chat message with streaming
  const sendMessage = useCallback(async (message?: string, startAnalysis?: boolean) => {
    if (!applicationId) return;

    // Abort any existing stream
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setIsStreaming(true);
    setStreamingContent('');
    setStreamEvents([]);

    try {
      const response = await fetch(`/api/review/${applicationId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, startAnalysis }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';
      let currentEventType = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            // Store the event type for the next data line
            currentEventType = line.slice(7).trim();
          } else if (line.startsWith('data: ')) {
            try {
              const eventData = JSON.parse(line.slice(6));
              const event: StreamEvent = { type: (currentEventType || 'data') as any, data: eventData };

              // Add to stream events (except for token events to avoid clutter)
              if (currentEventType !== 'token') {
                setStreamEvents(prev => [...prev, event]);
              }

              // Handle token content
              if (currentEventType === 'token' && eventData.content) {
                fullContent += eventData.content;
                setStreamingContent(fullContent);
              }

              // Reset event type after processing
              currentEventType = '';
            } catch {
              // Ignore parse errors
            }
          }
        }
      }

      // Refetch to get updated messages
      refetch();
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Stream error:', error);
        toast.error('Failed to get response');
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [applicationId, refetch]);

  // Stop streaming
  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
  }, []);

  // Approve application
  const approve = useCallback(async (finalValues?: {
    final_funding_goal?: number;
    final_projected_apy?: number;
    final_milestones?: any;
  }) => {
    if (!applicationId) return;

    try {
      await updateMutation.mutateAsync({
        id: applicationId,
        action: 'approve',
        ...finalValues,
      });
      toast.success('Application approved!');
    } catch (error) {
      toast.error('Failed to approve application');
    }
  }, [applicationId, updateMutation]);

  // Mark as created (after on-chain transaction)
  const markCreated = useCallback(async (projectId: string, txHash: string) => {
    if (!applicationId) return;

    try {
      await updateMutation.mutateAsync({
        id: applicationId,
        action: 'created',
        project_id: projectId,
        tx_hash: txHash,
      });
      toast.success('Project created on-chain!');
    } catch (error) {
      toast.error('Failed to update application status');
    }
  }, [applicationId, updateMutation]);

  return {
    // Data
    application: data?.application,
    messages: data?.messages || [],
    isLoading,
    error: error as Error | null,

    // Streaming state
    isStreaming,
    streamingContent,
    streamEvents,

    // Actions
    submit: submitMutation.mutateAsync,
    sendMessage,
    stopStreaming,
    approve,
    markCreated,
    refetch,

    // Loading states
    isSubmitting: submitMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
}
