import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Loader2, CheckCircle2, AlertCircle, ChevronRight, Clock } from 'lucide-react';

const FunctionDisplay = ({ toolCall }) => {
  const [expanded, setExpanded] = useState(false);
  const name = toolCall?.name || 'Function';
  const status = toolCall?.status || 'pending';
  const results = toolCall?.results;

  const parsedResults = (() => {
    if (!results) return null;
    try {
      return typeof results === 'string' ? JSON.parse(results) : results;
    } catch {
      return results;
    }
  })();

  const isError = results && (
    (typeof results === 'string' && /error|failed/i.test(results)) ||
    (parsedResults?.success === false)
  );

  const statusConfig = {
    pending: { icon: Clock, color: 'text-stone-400', text: 'Pending' },
    running: { icon: Loader2, color: 'text-stone-500', text: 'Searching...', spin: true },
    in_progress: { icon: Loader2, color: 'text-stone-500', text: 'Searching...', spin: true },
    completed: isError
      ? { icon: AlertCircle, color: 'text-red-500', text: 'Failed' }
      : { icon: CheckCircle2, color: 'text-green-600', text: 'Found' },
    success: { icon: CheckCircle2, color: 'text-green-600', text: 'Found' },
    failed: { icon: AlertCircle, color: 'text-red-500', text: 'Failed' },
    error: { icon: AlertCircle, color: 'text-red-500', text: 'Failed' }
  }[status] || { icon: Clock, color: 'text-stone-500', text: '' };

  const Icon = statusConfig.icon;
  const formattedName = name.replace('Order.', '').replace('Product.', '').toLowerCase();

  return (
    <div className="mt-2 text-xs">
      <button
        onClick={() => setExpanded(!expanded)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all hover:bg-stone-50 ${
          expanded ? 'bg-stone-50 border-stone-300' : 'bg-white border-stone-200'
        }`}
      >
        <Icon className={`h-3 w-3 ${statusConfig.color} ${statusConfig.spin ? 'animate-spin' : ''}`} />
        <span className="text-stone-700">{formattedName}</span>
        {statusConfig.text && (
          <span className={`text-stone-500 ${isError ? 'text-red-600' : ''}`}>
            • {statusConfig.text}
          </span>
        )}
        {!statusConfig.spin && (toolCall.arguments_string || results) && (
          <ChevronRight className={`h-3 w-3 text-stone-400 transition-transform ml-auto ${expanded ? 'rotate-90' : ''}`} />
        )}
      </button>
    </div>
  );
};

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="h-7 w-7 rounded-full bg-emerald-100 flex items-center justify-center mt-0.5 flex-shrink-0">
          <div className="h-2 w-2 rounded-full bg-emerald-500" />
        </div>
      )}
      <div className={`max-w-[85%] ${isUser ? 'flex flex-col items-end' : ''}`}>
        {message.content && (
          <div className={`rounded-2xl px-4 py-2.5 ${
            isUser ? 'bg-emerald-600 text-white' : 'bg-white border border-stone-200'
          }`}>
            {isUser ? (
              <p className="text-sm leading-relaxed">{message.content}</p>
            ) : (
              <ReactMarkdown
                className="text-sm prose prose-sm prose-stone max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                components={{
                  p: ({ children }) => <p className="my-1 leading-relaxed">{children}</p>,
                  ul: ({ children }) => <ul className="my-1 ml-4 list-disc">{children}</ul>,
                  ol: ({ children }) => <ol className="my-1 ml-4 list-decimal">{children}</ol>,
                  li: ({ children }) => <li className="my-0.5">{children}</li>,
                  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                }}
              >
                {message.content}
              </ReactMarkdown>
            )}
          </div>
        )}

        {message.tool_calls?.length > 0 && (
          <div className="space-y-1 mt-1">
            {message.tool_calls.map((toolCall, idx) => (
              <FunctionDisplay key={idx} toolCall={toolCall} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}