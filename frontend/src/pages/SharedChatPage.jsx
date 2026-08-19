import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Bot, ShieldCheck, AlertCircle, ArrowLeft } from 'lucide-react';
import { api } from '../services/api';
import { Badge } from '../components/ui/Badge';

function renderInlineStyles(text) {
  if (!text) return null;
  const tokens = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);

  return tokens.map((token, index) => {
    if (token.startsWith('`') && token.endsWith('`')) {
      return (
        <code
          key={index}
          className="rounded-md bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[0.7rem] font-mono text-emerald-700 dark:text-emerald-400 border border-slate-200 dark:border-slate-700"
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    if (token.startsWith('**') && token.endsWith('**')) {
      return (
        <strong key={index} className="font-bold text-slate-900 dark:text-white">
          {token.slice(2, -2)}
        </strong>
      );
    }
    return token;
  });
}

function FormattedMessage({ content }) {
  const elements = useMemo(() => {
    if (!content) return null;
    const parts = content.split(/(```[\s\S]*?```)/g);

    return parts.map((part, partIndex) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const lines = part.slice(3, -3).trim().split('\n');
        const language = lines[0]?.match(/^[a-zA-Z0-9_-]+$/) ? lines[0] : '';
        const code = (language ? lines.slice(1) : lines).join('\n');

        return (
          <div
            key={partIndex}
            className="my-3 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 text-slate-100 text-xs font-mono"
          >
            {language && (
              <div className="bg-slate-800 px-3 py-1.5 text-[0.65rem] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-700">
                {language}
              </div>
            )}
            <pre className="p-3 overflow-x-auto leading-relaxed">
              <code>{code}</code>
            </pre>
          </div>
        );
      }

      const paragraphs = part.split(/\n\s*\n/);

      return (
        <div key={partIndex} className="space-y-3">
          {paragraphs.map((para, pIndex) => {
            const trimmed = para.trim();
            if (!trimmed) return null;

            const lines = trimmed.split('\n');
            const isBulletList = lines.every((l) => /^[-*•]\s+/.test(l.trim()));
            const isNumberedList = lines.every((l) => /^\d+\.\s+/.test(l.trim()));

            if (isBulletList) {
              return (
                <ul key={pIndex} className="space-y-1.5 pl-1 my-2">
                  {lines.map((line, lIndex) => {
                    const itemText = line.replace(/^[-*•]\s+/, '');
                    return (
                      <li key={lIndex} className="flex items-start gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                        <span className="flex-1">{renderInlineStyles(itemText)}</span>
                      </li>
                    );
                  })}
                </ul>
              );
            }

            if (isNumberedList) {
              return (
                <ol key={pIndex} className="space-y-2 pl-1 my-2">
                  {lines.map((line, lIndex) => {
                    const match = line.match(/^(\d+)\.\s+(.*)/);
                    const num = match ? match[1] : `${lIndex + 1}`;
                    const itemText = match ? match[2] : line;
                    return (
                      <li key={lIndex} className="flex items-start gap-2.5">
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-[0.65rem] font-bold text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5">
                          {num}
                        </span>
                        <span className="flex-1">{renderInlineStyles(itemText)}</span>
                      </li>
                    );
                  })}
                </ol>
              );
            }

            if (trimmed.startsWith('### ')) {
              return (
                <h4 key={pIndex} className="text-sm font-bold text-slate-900 dark:text-white mt-3 mb-1">
                  {renderInlineStyles(trimmed.slice(4))}
                </h4>
              );
            }
            if (trimmed.startsWith('## ')) {
              return (
                <h3 key={pIndex} className="text-base font-bold text-slate-900 dark:text-white mt-3.5 mb-1.5">
                  {renderInlineStyles(trimmed.slice(3))}
                </h3>
              );
            }

            return (
              <p key={pIndex} className="leading-relaxed">
                {lines.map((l, lIndex) => (
                  <span key={lIndex}>
                    {renderInlineStyles(l)}
                    {lIndex < lines.length - 1 && <br />}
                  </span>
                ))}
              </p>
            );
          })}
        </div>
      );
    });
  }, [content]);

  return <div className="text-xs leading-relaxed space-y-2">{elements}</div>;
}

export function SharedChatPage() {
  const { token } = useParams();

  const { data, isLoading, error } = useQuery({
    queryKey: ['shared-chat', token],
    queryFn: async () => {
      const response = await api.get(`/ai/chat/shared/${token}`);
      return response.data?.data;
    },
    retry: 1
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-slate-400 text-xs font-semibold">
        Loading shared conversation...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-rose-500" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Conversation Not Found
        </h2>
        <p className="text-xs text-slate-500 max-w-sm">
          This shared link may have expired or is invalid.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-semibold hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#fafaf9] dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Read-Only Notice Banner */}
      <div className="bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-900/60 px-4 py-2.5 text-center flex items-center justify-center gap-2">
        <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span className="text-xs font-medium text-emerald-900 dark:text-emerald-200">
          This is a shared, read-only conversation. Personal identifying details were automatically redacted.
        </span>
      </div>

      <div className="flex-1 max-w-4xl mx-auto w-full p-4 sm:p-6 flex flex-col space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-xs">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  {data.title || 'Shared Career Advice'}
                </h1>
                <Badge variant="green" size="sm">
                  Read Only
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Shared on {data.createdAt ? new Date(data.createdAt).toLocaleDateString() : 'Recent'}
              </p>
            </div>
          </div>

          <Link
            to="/chat-mentor"
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            Start Your Own Chat →
          </Link>
        </header>

        {/* Message Stream */}
        <div className="flex-1 space-y-5 pb-12">
          {(data.messages || []).map((msg, index) => (
            <div
              key={index}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="h-7 w-7 rounded-lg shrink-0 flex items-center justify-center shadow-xs bg-emerald-600 text-white">
                  <Bot className="h-4 w-4" />
                </div>
              )}

              <div
                className={`max-w-[88%] sm:max-w-[80%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-2xs ${
                  msg.role === 'user'
                    ? 'bg-emerald-600 text-white rounded-br-xs whitespace-pre-wrap'
                    : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-200'
                }`}
              >
                <FormattedMessage content={msg.content} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
