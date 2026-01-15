'use client';

import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useProjectReview, type ChatMessage, type StreamEvent } from '@/lib/hooks/useProjectReview';
import {
  Send,
  Loader2,
  User,
  MapPin,
  TrendingUp,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  StopCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReviewChatProps {
  applicationId: string;
  onApproved?: () => void;
}

export function ReviewChat({ applicationId, onApproved }: ReviewChatProps) {
  const {
    application,
    messages,
    isLoading,
    isStreaming,
    streamingContent,
    streamEvents,
    sendMessage,
    stopStreaming,
  } = useProjectReview(applicationId);

  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [hasStartedAnalysis, setHasStartedAnalysis] = useState(false);
  const [userHasScrolled, setUserHasScrolled] = useState(false);

  // Check if user is near bottom of messages
  const isNearBottom = () => {
    const container = messagesContainerRef.current;
    if (!container) return true;
    const threshold = 100;
    return container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
  };

  // Handle user scroll - detect when they scroll up
  const handleScroll = () => {
    if (!isNearBottom()) {
      setUserHasScrolled(true);
    } else {
      setUserHasScrolled(false);
    }
  };

  // Scroll to bottom when new messages arrive (only if user hasn't scrolled up)
  useEffect(() => {
    if (!userHasScrolled && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, streamingContent, userHasScrolled]);

  // Start analysis when component mounts
  useEffect(() => {
    if (application && !hasStartedAnalysis && messages.length <= 1) {
      setHasStartedAnalysis(true);
      sendMessage(undefined, true);
    }
  }, [application, hasStartedAnalysis, messages.length, sendMessage]);

  const handleSend = async () => {
    if (!inputValue.trim() || isStreaming) return;

    const message = inputValue.trim();
    setInputValue('');
    await sendMessage(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <Card className="flex flex-col h-[500px] md:h-[600px] lg:h-[700px] xl:h-[calc(100vh-180px)] bg-neutral-900/50 border-neutral-800">
      {/* Header */}
      <div className="p-4 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-orange-500/30">
            <img
              src="/amara.png"
              alt="Amara Okonkwo"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h3 className="text-white font-medium">Amara Okonkwo</h3>
            <p className="text-xs text-neutral-400">
              Development Advisor • Reviewing: {application?.project_name}
            </p>
          </div>
          {application?.status === 'approved' && (
            <div className="ml-auto flex items-center gap-2 text-green-500">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm">Approved</span>
            </div>
          )}
        </div>
      </div>

      {/* Analysis Steps */}
      {streamEvents.length > 0 && (
        <div className="p-3 border-b border-neutral-800 bg-neutral-900/30">
          <div className="flex flex-wrap gap-2">
            {streamEvents
              .filter(e => e.type === 'status' || e.type === 'analysis')
              .map((event, i) => (
                <AnalysisStep key={i} event={event} />
              ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages
          .filter(m => m.role !== 'system')
          .map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}

        {/* Streaming message */}
        {isStreaming && streamingContent && (
          <MessageBubble
            message={{
              id: 'streaming',
              application_id: applicationId,
              role: 'assistant',
              content: streamingContent,
              created_at: new Date().toISOString(),
            }}
            isStreaming
          />
        )}

        {/* Loading indicator */}
        {isStreaming && !streamingContent && (
          <div className="flex items-center gap-2 text-neutral-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Amara is reviewing your project...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-neutral-800">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your response..."
            disabled={isStreaming}
            className="bg-neutral-800 border-neutral-700 text-white"
          />
          {isStreaming ? (
            <Button
              onClick={stopStreaming}
              variant="outline"
              className="border-red-500/50 text-red-400 hover:bg-red-500/10"
            >
              <StopCircle className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSend}
              disabled={!inputValue.trim()}
              className="bg-orange-500 hover:bg-orange-600"
            >
              <Send className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

// Message bubble component
function MessageBubble({
  message,
  isStreaming,
}: {
  message: ChatMessage;
  isStreaming?: boolean;
}) {
  const isAssistant = message.role === 'assistant';

  return (
    <div className={cn('flex gap-3', isAssistant ? 'justify-start' : 'justify-end')}>
      {isAssistant && (
        <div className="w-8 h-8 rounded-full overflow-hidden border border-orange-500/30 flex-shrink-0">
          <img
            src="/amara.png"
            alt="Amara"
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div
        className={cn(
          'max-w-[80%] rounded-lg p-3',
          isAssistant
            ? 'bg-neutral-800 text-white'
            : 'bg-orange-500/20 text-white'
        )}
      >
        <div className="prose prose-invert prose-sm max-w-none">
          <MarkdownContent content={message.content} />
        </div>
        {isStreaming && (
          <span className="inline-block w-2 h-4 bg-orange-500 animate-pulse ml-1" />
        )}
      </div>
      {!isAssistant && (
        <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-white" />
        </div>
      )}
    </div>
  );
}

// Parse inline formatting (bold, italic, etc.)
function parseInlineFormatting(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let keyIndex = 0;

  while (remaining.length > 0) {
    // Look for **bold** pattern
    const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);

    if (boldMatch && boldMatch.index !== undefined) {
      // Add text before the match
      if (boldMatch.index > 0) {
        parts.push(remaining.slice(0, boldMatch.index));
      }
      // Add the bold text
      parts.push(
        <strong key={keyIndex++} className="font-semibold text-white">
          {boldMatch[1]}
        </strong>
      );
      // Continue with the rest
      remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
    } else {
      // No more matches, add remaining text
      parts.push(remaining);
      break;
    }
  }

  return parts;
}

// Simple markdown renderer
function MarkdownContent({ content }: { content: string }) {
  const lines = content.split('\n');

  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        if (line.startsWith('### ')) {
          return (
            <h4 key={i} className="text-orange-400 font-semibold mt-3">
              {parseInlineFormatting(line.slice(4))}
            </h4>
          );
        }
        if (line.startsWith('## ')) {
          return (
            <h3 key={i} className="text-orange-400 font-bold mt-4">
              {parseInlineFormatting(line.slice(3))}
            </h3>
          );
        }
        if (line.startsWith('- ')) {
          return (
            <li key={i} className="ml-4 list-disc">
              {parseInlineFormatting(line.slice(2))}
            </li>
          );
        }
        if (line.match(/^\d+\.\s/)) {
          return (
            <li key={i} className="ml-4 list-decimal">
              {parseInlineFormatting(line.replace(/^\d+\.\s/, ''))}
            </li>
          );
        }
        if (line.trim()) {
          return <p key={i}>{parseInlineFormatting(line)}</p>;
        }
        return null;
      })}
    </div>
  );
}

// Analysis step indicator
function AnalysisStep({ event }: { event: StreamEvent }) {
  const getIcon = () => {
    if (event.type === 'analysis') {
      switch (event.data.type) {
        case 'location':
          return <MapPin className="w-3 h-3" />;
        case 'market':
          return <TrendingUp className="w-3 h-3" />;
        case 'funding':
          return <DollarSign className="w-3 h-3" />;
      }
    }
    if (event.data.step === 'complete') {
      return <CheckCircle2 className="w-3 h-3" />;
    }
    return <Loader2 className="w-3 h-3 animate-spin" />;
  };

  const isComplete = event.data.step === 'complete' || event.type === 'analysis';

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 px-2 py-1 rounded-full text-xs',
        isComplete
          ? 'bg-green-500/20 text-green-400'
          : 'bg-orange-500/20 text-orange-400'
      )}
    >
      {getIcon()}
      <span>{event.data.message || event.data.step}</span>
    </div>
  );
}
