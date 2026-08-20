import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bot,
  Send,
  Copy,
  Check,
  AlertCircle,
  X,
  ShieldCheck,
  Paperclip,
  FileText
} from 'lucide-react';
import { api } from '../services/api';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { ChatHistoryRail } from '../components/chat/ChatHistoryRail';
import { ChatHistoryPanel } from '../components/chat/ChatHistoryPanel';
import { RenameConversationModal } from '../components/chat/RenameConversationModal';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const starterPrompts = [
  {
    label: 'Resume & ATS',
    prompt: 'How should I structure my resume bullet points to maximize ATS score and recruiter impact?'
  },
  {
    label: 'System Design',
    prompt: 'What is the recommended framework for answering System Design interview questions for SDE-1 and SDE-2?'
  },
  {
    label: 'DSA Roadmap',
    prompt: 'What is the best 30-day strategy to master Dynamic Programming, Trees, and Graph patterns?'
  },
  {
    label: 'Interview Prep',
    prompt: 'How do I structure behavioral answers using the STAR method without sounding rehearsed?'
  }
];

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
          className="rounded px-1.5 py-0.5 text-[0.85rem] font-mono text-[#315B45] bg-[#E8F0EA] border border-[#D1E0D7]"
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
                        <span className="flex-1">{renderInlineStyles(itemText)}</span>
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
              <p key={pIndex} className="leading-[1.65]">
                {lines.map((line, lIndex) => (
                  <span key={lIndex}>
                    {renderInlineStyles(line)}
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

  return <div className="text-[15px] sm:text-[16px] leading-[1.65] font-normal tracking-normal text-[#20211E] space-y-4">{elements}</div>;
}

export function ChatMentorPage() {
  const [promptText, setPromptText] = useState('');
  const [attachedFile, setAttachedFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [messages, setMessages] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [activeConversationTitle, setActiveConversationTitle] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  // Drawer state: default closed so the chat has full horizontal space
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [focusSearchTrigger, setFocusSearchTrigger] = useState(0);

  // Modals state
  const [deletingConv, setDeletingConv] = useState(null);
  const [renamingConv, setRenamingConv] = useState(null);
  const [sharingConv, setSharingConv] = useState(null);
  const [shareLink, setShareLink] = useState('');
  const [isShareCopied, setIsShareCopied] = useState(false);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();

  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch saved conversations
  const { data: conversationsData = [], isLoading: isHistoryLoading } = useQuery({
    queryKey: ['chat-conversations'],
    queryFn: async () => {
      const response = await api.get('/ai/chat/conversations');
      return response.data?.data || [];
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (convId) => {
      await api.delete(`/ai/chat/conversations/${convId}`);
    },
    onSuccess: (_, convId) => {
      queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
      if (activeConversationId === convId) {
        handleNewChat();
      }
      setDeletingConv(null);
    }
  });

  const renameMutation = useMutation({
    mutationFn: async ({ convId, title }) => {
      const response = await api.patch(`/ai/chat/conversations/${convId}`, { title });
      return response.data?.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
      if (activeConversationId === variables.convId) {
        setActiveConversationTitle(variables.title);
      }
      setRenamingConv(null);
    }
  });

  const shareMutation = useMutation({
    mutationFn: async (convId) => {
      const response = await api.post(`/ai/chat/conversations/${convId}/share`);
      return response.data?.data;
    },
    onSuccess: (data) => {
      if (data?.shareToken) {
        setShareLink(`${window.location.origin}/shared/chat/${data.shareToken}`);
      }
    }
  });

  function handleOpenShare(conv) {
    setSharingConv(conv);
    setShareLink('');
    setIsShareCopied(false);
    shareMutation.mutate(conv._id || conv.id);
  }

  function handleOpenDelete(conv) {
    setDeletingConv(conv);
  }

  function handleOpenRename(conv) {
    setRenamingConv(conv);
  }

  function handleCopyShareLink() {
    if (!shareLink) return;
    navigator.clipboard.writeText(shareLink);
    setIsShareCopied(true);
    setTimeout(() => setIsShareCopied(false), 2000);
  }

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

  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    setFileError('');
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setFileError('File is too large. Maximum size is 5 MB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const fileName = (file.name || '').toLowerCase();
    const validExtensions = ['.pdf', '.doc', '.docx', '.txt'];
    const hasValidExt = validExtensions.some((ext) => fileName.endsWith(ext));

    const validMimes = [
      'application/pdf',
      'application/msword',
      'application/doc',
      'application/x-msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/octet-stream'
    ];
    const hasValidMime = validMimes.includes(file.type) || file.type.startsWith('text/');

    if (!hasValidExt && !hasValidMime) {
      setFileError('Unsupported file type. Please upload PDF, DOC, DOCX, or TXT.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setAttachedFile(file);
  }

  function handleRemoveAttachment() {
    setAttachedFile(null);
    setFileError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function handleSendPrompt(textToSend) {
    const rawText = typeof textToSend === 'string' ? textToSend : promptText;
    const finalPrompt = (rawText || '').trim();

    if ((!finalPrompt && !attachedFile) || chatMutation.isPending) return;

    const currentAttachment = attachedFile;
    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: finalPrompt || (currentAttachment ? `Please review this attached document: ${currentAttachment.name}` : ''),
      metadata: currentAttachment
        ? {
            attachment: {
              name: currentAttachment.name,
              size: currentAttachment.size,
              mimeType: currentAttachment.type
            }
          }
        : undefined,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    setPromptText('');
    setAttachedFile(null);
    setFileError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    if (currentAttachment) {
      const formData = new FormData();
      if (activeConversationId) {
        formData.append('conversationId', activeConversationId);
      }
      if (finalPrompt) {
        formData.append('prompt', finalPrompt);
      }
      formData.append('file', currentAttachment);
      formData.append('context', JSON.stringify({ monthsLeft: 3, hoursDaily: 4 }));
      chatMutation.mutate(formData);
    } else {
      chatMutation.mutate({
        conversationId: activeConversationId,
        prompt: finalPrompt,
        context: {
          monthsLeft: 3,
          hoursDaily: 4
        }
      });
    }
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
    event.target.style.height = `${Math.min(event.target.scrollHeight, 140)}px`;
  }

  function handleCopy(id, text) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function handleNewChat() {
    setActiveConversationId(null);
    setActiveConversationTitle('');
    setMessages([]);
    setPromptText('');
    setAttachedFile(null);
    setFileError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    textareaRef.current?.focus();
    setIsDrawerOpen(false);
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
        metadata: m.metadata || {},
        timestamp: m.createdAt
          ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : ''
      }));

      setActiveConversationId(convId);
      setActiveConversationTitle(data?.conversation?.title || conv.title || 'Conversation');
      setMessages(formatted);
      setIsDrawerOpen(false);
    } catch (err) {
      console.error('Failed to load conversation:', err);
    }
  }

  function handleOpenSearchFromRail() {
    setIsDrawerOpen(true);
    setFocusSearchTrigger(Date.now());
  }

  return (
    <main className="flex-1 flex h-full min-h-0 overflow-hidden bg-[#F8F6F0] text-[#20211E] relative">
      {/* Primary Full-Height Chat Workspace */}
      <div className="flex-1 flex flex-col min-w-0 h-full min-h-0 overflow-hidden">
        {/* Compact Header */}
        <header className="shrink-0 border-b border-[#E5E0D6] px-4 sm:px-8 py-2.5 bg-[#F8F6F0] flex items-center justify-between z-10">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-7 w-7 rounded-md bg-[#E8F0EA] border border-[#D1E0D7] flex items-center justify-center text-[#315B45] shrink-0">
              <Bot className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-xs sm:text-sm font-bold text-[#20211E] tracking-tight shrink-0">
                  Career Mentor
                </h1>
                <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[0.65rem] font-bold text-[#315B45] bg-[#E8F0EA] border border-[#D1E0D7] shrink-0">
                  AI Mentor
                </span>
                {activeConversationTitle && messages.length > 0 && (
                  <span className="hidden sm:inline-flex text-xs text-[#74756E] font-medium truncate max-w-[280px]">
                    • {activeConversationTitle}
                  </span>
                )}
              </div>
              <p className="text-[0.68rem] text-[#6F7068] hidden md:block truncate">
                Strategy, resume bullets, document reviews, system design, and behavioral guidance.
              </p>
            </div>
          </div>
        </header>

        {/* Scrollable Conversation Area (Consumes all flexible height) */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-8 py-4 scroll-smooth flex flex-col">
          {messages.length === 0 ? (
            /* Compact Centered Empty State */
            <div className="my-auto flex flex-col items-center justify-center max-w-md mx-auto text-center py-4 space-y-4">
              <div className="h-10 w-10 rounded-xl bg-[#E8F0EA] border border-[#D1E0D7] flex items-center justify-center text-[#315B45] shadow-2xs">
                <Bot className="h-5 w-5" />
              </div>

              <div className="space-y-1">
                <h2 className="text-base sm:text-lg font-bold text-[#20211E] tracking-tight">
                  How can I help today?
                </h2>
                <p className="text-xs text-[#6F7068] leading-relaxed max-w-sm">
                  Ask about resumes, DSA, interviews, system design, or career preparation.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                {starterPrompts.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendPrompt(item.prompt)}
                    className="inline-flex items-center px-3 py-1.5 rounded-lg border border-[#E5E0D6] bg-[#FFFDF8] hover:border-[#315B45] hover:bg-[#E8F0EA] text-xs font-semibold text-[#20211E] transition cursor-pointer shadow-2xs"
                  >
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Active Conversation Messages (Top-aligned, natural flow) */
            <div className="max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto w-full space-y-5 pb-2">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div
                      className={`h-7 w-7 rounded-md shrink-0 flex items-center justify-center text-xs mt-1 ${
                        msg.isError
                          ? 'bg-[#FDECEB] text-[#B83A35] border border-[#F7CBC9]'
                          : 'bg-[#E8F0EA] text-[#315B45] border border-[#D1E0D7]'
                      }`}
                    >
                      {msg.isError ? <AlertCircle className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </div>
                  )}

                  <div
                    className={`group relative ${
                      msg.role === 'user'
                        ? 'max-w-[85%] sm:max-w-[75%] lg:max-w-[720px] bg-[#E8F0EA] border border-[#D6E3D9] text-[#20211E] rounded-xl px-4 sm:px-5 py-3.5 text-[15px] sm:text-[16px] leading-[1.55] shadow-2xs'
                        : msg.isError
                          ? 'max-w-[92%] sm:max-w-[85%] lg:max-w-[860px] bg-[#FDECEB] border border-[#F7CBC9] text-[#B83A35] rounded-xl px-4 sm:px-5 py-4 text-[15px] sm:text-[16px] leading-[1.65]'
                          : 'max-w-[92%] sm:max-w-[85%] lg:max-w-[860px] bg-[#FFFDF8] border border-[#E5E0D6] text-[#20211E] rounded-xl px-4 sm:px-5 py-4 text-[15px] sm:text-[16px] leading-[1.65] shadow-2xs'
                    }`}
                  >
                    {msg.role === 'assistant' && !msg.isError ? (
                      <FormattedMessage content={msg.content} />
                    ) : (
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    )}

                    {/* Attached Document Display Box */}
                    {msg.metadata?.attachment && (
                      <div className="mt-3 flex items-center gap-3 p-3 rounded-lg bg-[#FFFDF8] border border-[#D6E3D9] text-xs text-[#20211E]">
                        <div className="flex h-8 w-8 items-center justify-center rounded bg-[#E8F0EA] text-[#315B45] shrink-0">
                          <FileText className="h-4.5 w-4.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[14px] sm:text-[15px] font-semibold text-[#20211E] truncate">
                            {msg.metadata.attachment.name}
                          </p>
                          <p className="text-[12px] sm:text-[13px] text-[#74756E] font-mono">
                            {getFileTypeLabel(msg.metadata.attachment.name)} · {formatFileSize(msg.metadata.attachment.size)}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Metadata Row */}
                    <div
                      className={`flex items-center justify-between gap-3 mt-3 pt-2 border-t text-[12px] sm:text-[13px] ${
                        msg.role === 'user' ? 'border-[#D6E3D9] text-[#74756E]' : 'border-[#E5E0D6] text-[#74756E]'
                      }`}
                    >
                      <span>{msg.timestamp}</span>

                      {msg.role === 'assistant' && !msg.isError && (
                        <button
                          type="button"
                          onClick={() => handleCopy(msg.id, msg.content)}
                          className="opacity-0 group-hover:opacity-100 transition flex items-center gap-1.5 text-[12px] sm:text-[13px] text-[#74756E] hover:text-[#315B45] cursor-pointer"
                          title="Copy to clipboard"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-[#315B45]" />
                              <span className="text-[#315B45] font-semibold">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
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

        {/* Anchored Bottom Chat Composer (20-24px bottom breathing room) */}
        <div className="shrink-0 px-4 sm:px-8 pt-2.5 pb-5 sm:pb-6 bg-[#F8F6F0] border-t border-[#E5E0D6] z-10">
          <div className="max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto w-full space-y-2">
            {/* Error Notification */}
            {fileError && (
              <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-[#FDECEB] border border-[#F7CBC9] text-[#B83A35] text-xs animate-fadeIn">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{fileError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFileError('')}
                  className="text-[#B83A35] hover:opacity-70 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Compact Attachment Preview */}
            {attachedFile && (
              <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg border border-[#E5E0D6] bg-[#FFFDF8] text-xs animate-fadeIn">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="h-4 w-4 text-[#315B45] shrink-0" />
                  <div className="flex items-baseline gap-1.5 min-w-0 truncate">
                    <span className="text-[14px] font-semibold text-[#20211E] truncate">{attachedFile.name}</span>
                    <span className="text-[12px] text-[#74756E] shrink-0 font-mono">
                      ({formatFileSize(attachedFile.size)})
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveAttachment}
                  className="p-1 rounded-md text-[#74756E] hover:text-[#B83A35] hover:bg-[#FDECEB] transition cursor-pointer"
                  title="Remove attachment"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
              className="hidden"
              onChange={handleFileSelect}
            />

            {/* Composer Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendPrompt();
              }}
              className="flex items-end gap-2 bg-[#FFFDF8] rounded-xl border border-[#D8D2C6] p-2 focus-within:border-[#315B45] transition shadow-2xs"
            >
              {/* Attachment Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-lg text-[#74756E] hover:text-[#20211E] hover:bg-[#F5F2EA] transition cursor-pointer mb-0.5 shrink-0"
                title="Attach document (PDF, DOC, DOCX, TXT - max 5MB)"
              >
                <Paperclip className="h-4.5 w-4.5" />
              </button>

              <textarea
                ref={textareaRef}
                rows={1}
                value={promptText}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                placeholder={
                  attachedFile
                    ? `Ask mentor about ${attachedFile.name} (or leave blank to analyze)...`
                    : 'Ask mentor about preparation, interviews, or engineering strategies...'
                }
                className="flex-1 bg-transparent px-2 py-1 text-[15px] sm:text-[16px] text-[#20211E] outline-none resize-none max-h-32 placeholder:text-[#777970] leading-relaxed"
              />

              <Button
                type="submit"
                size="md"
                icon={Send}
                isLoading={chatMutation.isPending}
                disabled={(!promptText.trim() && !attachedFile) || chatMutation.isPending}
                className="shrink-0"
              >
                Send
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Subtle Collapsed Rail on Right Edge */}
      <ChatHistoryRail
        onOpenSearch={handleOpenSearchFromRail}
        onTogglePanel={() => setIsDrawerOpen((prev) => !prev)}
        onNewChat={handleNewChat}
      />

      {/* Slide-over Right Chat History Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-40 flex justify-end animate-fadeIn">
          {/* Subtle Transparent Backdrop */}
          <div
            className="fixed inset-0 bg-[#20211E]/20 backdrop-blur-2xs transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <div className="relative w-[320px] sm:w-[340px] h-full shadow-2xl z-10 animate-slideLeft">
            <ChatHistoryPanel
              conversations={conversationsData}
              activeConversationId={activeConversationId}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onClearSearch={() => setSearchQuery('')}
              focusSearchTrigger={focusSearchTrigger}
              isLoading={isHistoryLoading}
              onClose={() => setIsDrawerOpen(false)}
              onNewChat={handleNewChat}
              onSelectConversation={handleLoadConversation}
              onRename={handleOpenRename}
              onShare={handleOpenShare}
              onDelete={handleOpenDelete}
            />
          </div>
        </div>
      )}

      {/* Rename Conversation Modal */}
      <RenameConversationModal
        isOpen={Boolean(renamingConv)}
        conversation={renamingConv}
        isLoading={renameMutation.isPending}
        onClose={() => setRenamingConv(null)}
        onSave={(title) => {
          if (renamingConv) {
            renameMutation.mutate({
              convId: renamingConv._id || renamingConv.id,
              title
            });
          }
        }}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deletingConv)}
        onClose={() => setDeletingConv(null)}
        title="Delete Conversation?"
        maxWidth="max-w-md"
      >
        <div className="space-y-3 text-xs">
          <p className="text-[#6F7068] leading-relaxed">
            Are you sure you want to delete <strong className="text-[#20211E]">"{deletingConv?.title}"</strong>? This action is permanent.
          </p>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setDeletingConv(null)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(deletingConv._id || deletingConv.id)}
            >
              Delete Permanently
            </Button>
          </div>
        </div>
      </Modal>

      {/* Share Link Modal */}
      <Modal
        isOpen={Boolean(sharingConv)}
        onClose={() => {
          setSharingConv(null);
          setShareLink('');
        }}
        title="Share Conversation"
        maxWidth="max-w-md"
      >
        <div className="space-y-3 text-xs">
          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-[#E8F0EA] border border-[#D1E0D7] text-[#315B45]">
            <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="text-[0.72rem] leading-relaxed">
              <strong>Privacy-Safe Snapshot:</strong> Personal identifying details are automatically redacted before creating this public link.
            </div>
          </div>

          {shareMutation.isPending ? (
            <div className="py-4 text-center text-[#74756E]">
              Generating secure snapshot...
            </div>
          ) : shareLink ? (
            <div className="space-y-1.5">
              <label className="block text-[0.68rem] font-bold uppercase tracking-wider text-[#74756E]">
                Public Read-Only Link
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareLink}
                  className="flex-1 bg-[#FFFDF8] border border-[#E5E0D6] rounded-lg px-2.5 py-1.5 text-xs text-[#20211E] outline-none select-all"
                />
                <Button
                  size="sm"
                  icon={isShareCopied ? Check : Copy}
                  onClick={handleCopyShareLink}
                >
                  {isShareCopied ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-3 text-center text-[#B83A35]">
              Failed to generate share link. Please try again.
            </div>
          )}

          <div className="flex justify-end pt-1">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSharingConv(null);
                setShareLink('');
              }}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </main>
  );
}