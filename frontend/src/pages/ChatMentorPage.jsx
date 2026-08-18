import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bot,
  Sparkles,
  Send,
  User,
  RotateCcw,
  History,
  Copy,
  Check,
  AlertCircle,
  HelpCircle,
  Zap,
  GraduationCap,
  X,
  ChevronRight,
  MessageSquare
} from 'lucide-react';
import { api } from '../services/api';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

const suggestedPrompts = [
  {
    title: 'Resume & ATS Optimization',
    prompt: 'How should I structure my resume for a Full Stack Developer role to maximize ATS score?',
    icon: Sparkles
  },
  {
    title: 'System Design Preparation',
    prompt: 'What are the most commonly asked System Design interview questions for SDE-1 and SDE-2?',
    icon: Zap
  },
  {
    title: 'Salary Negotiation',
    prompt: 'How do I negotiate salary for an entry-level software offer without sounding aggressive?',
    icon: MessageSquare
  },
  {
    title: '30-Day DSA Roadmap',
    prompt: 'What is the best 30-day strategy to revise Dynamic Programming, Trees, and Graphs?',
    icon: GraduationCap
  }
];

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

export function ChatMentorPage() {
  const [promptText, setPromptText] = useState('');
  const [messages, setMessages] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [activeConversationTitle, setActiveConversationTitle] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const queryClient = useQueryClient();

  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch saved conversations
  const { data: conversationsData, isLoading: isHistoryLoading } = useQuery({
    queryKey: ['chat-conversations'],
    queryFn: async () => {
      const response = await api.get('/ai/chat/conversations');
      return response.data?.data || [];
    },
    enabled: isHistoryOpen
  });

  const chatMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await api.post('/ai/chat', payload);
      return response.data?.data;
    },
    onSuccess: (data) => {
      if (data?.conversationId) {
        setActiveConversationId(data.conversationId);
      }
      if (data?.conversationTitle) {
        setActiveConversationTitle(data.conversationTitle);
      }
      if (data?.response) {
        setMessages((prev) => [
          ...prev,
          {
            id: `mentor-${Date.now()}`,
            role: 'assistant',
            content: data.response,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
      }
    },
    onError: (error) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Unable to reach AI mentor. Please check your network or try again.';
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: errorMessage,
          isError: true,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  });

  function handleSendPrompt(textToSend) {
    const rawText = typeof textToSend === 'string' ? textToSend : promptText;
    const finalPrompt = (rawText || '').trim();
    if (!finalPrompt || chatMutation.isPending) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: finalPrompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    setPromptText('');

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    chatMutation.mutate({
      conversationId: activeConversationId,
      prompt: finalPrompt,
      context: {
        monthsLeft: 3,
        hoursDaily: 4
      }
    });
  }

  function handleKeyDown(event) {
    if (event.nativeEvent?.isComposing) return;
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendPrompt();
    }
  }

  function handleInput(event) {
    const val = event.target.value;
    setPromptText(val);
    event.target.style.height = 'auto';
    event.target.style.height = `${Math.min(event.target.scrollHeight, 160)}px`;
  }

  function handleCopy(id, text) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function handleClearChat() {
    setActiveConversationId(null);
    setActiveConversationTitle('');
    setMessages([]);
    setPromptText('');
  }

  async function handleLoadConversation(conv) {
    try {
      const convId = conv._id || conv.id;
      const res = await api.get(`/ai/chat/conversations/${convId}`);
      const data = res.data?.data;
      const rawMessages = data?.messages || [];
      const formatted = rawMessages.map((m) => ({
        id: m._id || m.id,
        role: m.role,
        content: m.content || (m.role === 'user' ? m.prompt : m.response),
        timestamp: m.createdAt
          ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : ''
      }));

      setActiveConversationId(convId);
      setActiveConversationTitle(data?.conversation?.title || conv.title || 'Conversation');
      setMessages(formatted);
      setIsHistoryOpen(false);
    } catch (err) {
      console.error('Failed to load conversation:', err);
    }
  }

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] max-w-5xl mx-auto w-full p-4 sm:p-6 relative overflow-hidden animate-fadeIn">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-xs">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Career Mentor
              </h1>
              <Badge variant="green" size="sm">
                AI Mentor
              </Badge>
              {activeConversationTitle && messages.length > 0 && (
                <span className="hidden sm:inline-flex text-xs text-slate-500 font-semibold truncate max-w-[200px]">
                  • {activeConversationTitle}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Placement preparation strategy, resume bullet refinement, and negotiation drills.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={History}
            onClick={() => setIsHistoryOpen(true)}
          >
            History
          </Button>

          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              icon={RotateCcw}
              onClick={handleClearChat}
            >
              New Chat
            </Button>
          )}
        </div>
      </header>

      {/* Main Chat Stream */}
      <div className="flex-1 overflow-y-auto py-6 space-y-6 scroll-smooth pr-1">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col justify-center max-w-2xl mx-auto space-y-8 py-8">
            <div className="text-center space-y-2">
              <div className="h-14 w-14 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-2xs">
                <Bot className="h-7 w-7" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                How can I guide your preparation today?
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                Ask about behavioral STAR structures, System Design interview frameworks, DSA milestones, or offer negotiations.
              </p>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center gap-1.5 text-[0.68rem] font-bold uppercase tracking-wider text-slate-400 px-1">
                <HelpCircle className="h-3.5 w-3.5 text-emerald-600" />
                <span>Suggested Starter Questions</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {suggestedPrompts.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <Card
                      key={index}
                      hover
                      padding="sm"
                      onClick={() => handleSendPrompt(item.prompt)}
                      className="group flex flex-col text-left cursor-pointer space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[0.7rem] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
                          {item.title}
                        </span>
                        <Icon className="h-3.5 w-3.5 text-slate-400 group-hover:text-emerald-600 transition" />
                      </div>
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300 line-clamp-2 leading-relaxed">
                        {item.prompt}
                      </p>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div
                    className={`h-7 w-7 rounded-lg shrink-0 flex items-center justify-center shadow-xs ${
                      msg.isError
                        ? 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {msg.isError ? <AlertCircle className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                )}

                <div
                  className={`group relative max-w-[88%] sm:max-w-[80%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-2xs ${
                    msg.role === 'user'
                      ? 'bg-emerald-600 text-white rounded-br-xs whitespace-pre-wrap'
                      : msg.isError
                      ? 'bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-200'
                      : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  {msg.role === 'assistant' && !msg.isError ? (
                    <FormattedMessage content={msg.content} />
                  ) : (
                    <div>{msg.content}</div>
                  )}

                  <div
                    className={`flex items-center justify-between gap-3 mt-2 pt-1.5 border-t text-[0.65rem] ${
                      msg.role === 'user'
                        ? 'border-emerald-500/40 text-emerald-100'
                        : 'border-slate-100 dark:border-slate-800 text-slate-400'
                    }`}
                  >
                    <span>{msg.timestamp}</span>

                    {msg.role === 'assistant' && !msg.isError && (
                      <button
                        type="button"
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="opacity-0 group-hover:opacity-100 transition flex items-center gap-1 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer"
                        title="Copy to clipboard"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span className="text-emerald-600 font-semibold">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="shrink-0 pt-3 border-t border-slate-200/80 dark:border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendPrompt();
          }}
          className="flex items-end gap-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-2 shadow-sm focus-within:border-emerald-500 transition"
        >
          <textarea
            ref={textareaRef}
            rows={1}
            value={promptText}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Ask mentor about preparation, interviews, or engineering strategies..."
            className="flex-1 bg-transparent px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 outline-none resize-none max-h-32"
          />

          <Button
            type="submit"
            size="sm"
            icon={Send}
            isLoading={chatMutation.isPending}
            disabled={!promptText.trim() || chatMutation.isPending}
          >
            Send
          </Button>
        </form>
      </div>

      {/* History Drawer Modal */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div
            className="fixed inset-0"
            onClick={() => setIsHistoryOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 h-full p-5 space-y-4 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col z-10">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <History className="h-4 w-4 text-emerald-600" />
                <span>Conversation History</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsHistoryOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {isHistoryLoading ? (
                <p className="text-xs text-slate-400 text-center py-6">Loading conversations...</p>
              ) : (conversationsData || []).length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No previous conversations found.</p>
              ) : (
                (conversationsData || []).map((conv) => (
                  <div
                    key={conv._id || conv.id}
                    onClick={() => handleLoadConversation(conv)}
                    className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition text-xs space-y-1"
                  >
                    <p className="font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                      {conv.title || 'Conversation'}
                    </p>
                    <p className="text-[0.68rem] text-slate-400">
                      {conv.updatedAt ? new Date(conv.updatedAt).toLocaleDateString() : 'Recent'}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}