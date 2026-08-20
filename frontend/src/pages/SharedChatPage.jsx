import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Bot, ShieldCheck, AlertCircle, ArrowLeft, FileText } from 'lucide-react';
import { api } from '../services/api';
import { Badge } from '../components/ui/Badge';

function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function getFileTypeLabel(name = '') {
  const ext = name.split('.').pop()?.toUpperCase();
  return ext || 'FILE';
}

function renderInlineStyles(text) {
  if (!text) return null;
  const tokens = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);

  return tokens.map((token, index) => {
    if (token.startsWith('`') && token.endsWith('`')) {
      return (
        <code
          key={index}
          className="rounded bg-[#E8F0EA] px-1.5 py-0.5 text-[0.85rem] font-mono text-[#315B45] border border-[#D1E0D7]"
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    if (token.startsWith('**') && token.endsWith('**')) {
      return (
        <strong key={index} className="font-semibold text-[#20211E]">
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
            className="my-3.5 rounded-lg overflow-hidden border border-[#E5E0D6] bg-[#20211E] text-[#FFFDF8] text-[13px] sm:text-[14px] font-mono"
          >
            {language && (
              <div className="bg-[#181917] px-3.5 py-1.5 text-[0.7rem] text-[#85867E] font-bold uppercase tracking-wider border-b border-[#333530]">
                {language}
              </div>
            )}
            <pre className="p-3.5 overflow-x-auto leading-relaxed">
              <code>{code}</code>
            </pre>
          </div>
        );
      }

      const paragraphs = part.split(/\n\s*\n/);

      return (
        <div key={partIndex} className="space-y-4">
          {paragraphs.map((para, pIndex) => {
            const trimmed = para.trim();
            if (!trimmed) return null;

            const lines = trimmed.split('\n');
            const isBulletList = lines.every((l) => /^[-*•]\s+/.test(l.trim()));
            const isNumberedList = lines.every((l) => /^\d+\.\s+/.test(l.trim()));

            if (isBulletList) {
              return (
                <ul key={pIndex} className="space-y-2 pl-1 my-2.5">
                  {lines.map((line, lIndex) => {
                    const itemText = line.replace(/^[-*•]\s+/, '');
                    return (
                      <li key={lIndex} className="flex items-start gap-2.5 leading-[1.6]">
                        <span className="text-[#315B45] font-bold shrink-0 mt-1">•</span>
                        <span className="flex-1 text-[#20211E]">{renderInlineStyles(itemText)}</span>
                      </li>
                    );
                  })}
                </ul>
              );
            }

            if (isNumberedList) {
              return (
                <ol key={pIndex} className="space-y-2 pl-1 my-2.5 list-decimal list-inside">
                  {lines.map((line, lIndex) => {
                    const itemText = line.replace(/^\d+\.\s+/, '');
                    return (
                      <li key={lIndex} className="leading-[1.6]">
                        <span>{renderInlineStyles(itemText)}</span>
                      </li>
                    );
                  })}
                </ol>
              );
            }

            if (trimmed.startsWith('### ')) {
              return (
                <h4 key={pIndex} className="text-[17px] font-semibold text-[#20211E] mt-4 mb-2 leading-snug">
                  {renderInlineStyles(trimmed.slice(4))}
                </h4>
              );
            }
            if (trimmed.startsWith('## ')) {
              return (
                <h3 key={pIndex} className="text-[18px] font-semibold text-[#20211E] mt-5 mb-2 leading-snug">
                  {renderInlineStyles(trimmed.slice(3))}
                </h3>
              );
            }

            return (
              <p key={pIndex} className="leading-[1.65] text-[#20211E]">
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

  return <div className="text-[15px] sm:text-[16px] leading-[1.65] font-normal text-[#20211E] space-y-4">{elements}</div>;
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
      <div className="min-h-screen flex items-center justify-center p-6 text-[#74756E] text-sm font-semibold bg-[#F8F6F0]">
        Loading shared conversation...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-3 bg-[#F8F6F0]">
        <AlertCircle className="h-8 w-8 text-[#B83A35]" />
        <h2 className="text-base font-bold text-[#20211E]">
          Conversation Not Found
        </h2>
        <p className="text-xs text-[#6F7068] max-w-sm">
          This shared link may have expired or is invalid.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-[#315B45] font-semibold hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F6F0] text-[#20211E]">
      {/* Read-Only Notice Banner */}
      <div className="bg-[#E8F0EA] border-b border-[#D1E0D7] px-4 py-2 text-center flex items-center justify-center gap-2">
        <ShieldCheck className="h-4 w-4 text-[#315B45] shrink-0" />
        <span className="text-xs font-medium text-[#315B45]">
          This is a shared, read-only conversation. Personal identifying details were automatically redacted.
        </span>
      </div>

      <div className="flex-1 max-w-4xl lg:max-w-5xl mx-auto w-full p-4 sm:p-8 flex flex-col space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-[#E5E0D6] pb-3.5">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-[#315B45] flex items-center justify-center text-[#FFFDF8]">
              <Bot className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-[#20211E] tracking-tight">
                  {data.title || 'Shared Career Advice'}
                </h1>
                <Badge variant="green" size="sm">
                  Read Only
                </Badge>
              </div>
              <p className="text-[0.72rem] text-[#74756E]">
                Shared on {data.createdAt ? new Date(data.createdAt).toLocaleDateString() : 'Recent'}
              </p>
            </div>
          </div>

          <Link
            to="/chat-mentor"
            className="text-xs font-semibold text-[#315B45] hover:underline flex items-center gap-1"
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
                <div className="h-7 w-7 rounded-md shrink-0 flex items-center justify-center bg-[#E8F0EA] text-[#315B45] border border-[#D1E0D7] mt-1">
                  <Bot className="h-4 w-4" />
                </div>
              )}

              <div
                className={`group relative ${
                  msg.role === 'user'
                    ? 'max-w-[85%] sm:max-w-[75%] lg:max-w-[720px] bg-[#E8F0EA] border border-[#D6E3D9] text-[#20211E] rounded-xl px-4 sm:px-5 py-3.5 text-[15px] sm:text-[16px] leading-[1.55] shadow-2xs'
                    : 'max-w-[92%] sm:max-w-[85%] lg:max-w-[860px] bg-[#FFFDF8] border border-[#E5E0D6] text-[#20211E] rounded-xl px-4 sm:px-5 py-4 text-[15px] sm:text-[16px] leading-[1.65] shadow-2xs'
                }`}
              >
                <FormattedMessage content={msg.content} />

                {/* Attached Document Display Box */}
                {msg.metadata?.attachment && (
                  <div className="mt-3 flex items-center gap-3 p-3 rounded-lg bg-[#FFFDF8] border border-[#D6E3D9] text-xs text-[#20211E]">
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-[#E8F0EA] text-[#315B45] shrink-0">
                      <FileText className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] sm:text-[15px] font-semibold text-[#20211E] truncate">{msg.metadata.attachment.name}</p>
                      <p className="text-[12px] sm:text-[13px] text-[#74756E] font-mono">
                        {getFileTypeLabel(msg.metadata.attachment.name)} · {formatFileSize(msg.metadata.attachment.size)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
