import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Bot,
  Send,
  X,
  Loader2,
  Plus,
  History as HistoryIcon,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  Sparkles,
  Search,
  Trash2,
  Edit2,
  MessageSquare,
  Database,
  BarChart3,
  Cpu,
  AlertCircle,
  CornerDownLeft,
} from 'lucide-react';

// API Base URL for Chat backend (routed through Node.js backend on port 5000)
const API_BASE = (
  import.meta.env.VITE_CHAT_API_BASE_URL || '/api/chat'
).replace(/\/+$/, '');

// Bot persona configurations
const BOT_PERSONAS = {
  'Customer Support Bot': {
    badge: 'Customer Support AI',
    color: '#6366f1',
    accentClass: 'persona-support',
    icon: MessageSquare,
    tagline: 'Instant answers, ticket resolutions & system troubleshooting.',
    prompts: [
      { label: '🔑 Reset account & password', query: 'How do I reset my password and recover my account?' },
      { label: '⚡ System features & tools', query: 'What features are supported in this platform?' },
      { label: '🛠️ Troubleshoot login issue', query: 'I am experiencing an issue with my login session. Can you help?' },
      { label: '👤 Connect to human support', query: 'How can I connect with human technical support?' },
    ],
  },
  'Knowledge Base / RAG Bot': {
    badge: 'Knowledge Base & RAG',
    color: '#38bdf8',
    accentClass: 'persona-knowledge',
    icon: Database,
    tagline: 'Grounded in MongoDB test_copy documents, collections & guides.',
    prompts: [
      { label: '📂 Indexed collections', query: 'What collections and documents are indexed in MongoDB?' },
      { label: '👥 Search users & members', query: 'Can you show me the active employees and departments?' },
      { label: '📋 Workspace guidelines', query: 'What workspace guidelines and policies are available in the documents?' },
      { label: '📊 Summarize projects', query: 'Summarize the active projects and tasks from the knowledge base.' },
    ],
  },
  'Sales & Lead Bot': {
    badge: 'Sales & Lead AI',
    color: '#10b981',
    accentClass: 'persona-sales',
    icon: BarChart3,
    tagline: 'Lead automation, pricing qualification & booking consultations.',
    prompts: [
      { label: '💳 Pricing & tiers', query: 'What subscription pricing tiers and enterprise plans do you offer?' },
      { label: '📅 Book a product demo', query: 'I would like to schedule a product demo with your sales team.' },
      { label: '📈 Platform ROI & value', query: 'What is the ROI and key business benefits of using your AI solution?' },
      { label: '🏢 Enterprise onboarding', query: 'Qualify my company for an enterprise implementation and rollout.' },
    ],
  },
  'Custom Workflow Assistant': {
    badge: 'Workflow Automation',
    color: '#f59e0b',
    accentClass: 'persona-custom',
    icon: Cpu,
    tagline: 'Custom function tools, automated pipelines & webhook triggers.',
    prompts: [
      { label: '🔗 Webhook triggers', query: 'How do I configure custom webhook triggers and automated jobs?' },
      { label: '🔌 Available API endpoints', query: 'List the available REST API endpoints and integration steps.' },
      { label: '🧠 Function calling tools', query: 'How does tool calling and custom agent reasoning work here?' },
      { label: '⚙️ Automation templates', query: 'Show me templates for custom automated data workflows.' },
    ],
  },
};

const DEFAULT_PERSONA = {
  badge: 'AI Assistant',
  color: '#6366f1',
  accentClass: 'persona-support',
  icon: Bot,
  tagline: 'Connected to your enterprise AI workspace and data.',
  prompts: [
    { label: '💡 What can you do?', query: 'What capabilities and assistance can you provide?' },
    { label: '🔍 Search knowledge base', query: 'Search the database documents for recent records.' },
    { label: '🚀 Automate workflow', query: 'How do I automate my daily workflow tasks?' },
  ],
};


// Format relative or local time
function formatTimestamp(isoString) {
  try {
    const date = isoString ? new Date(isoString) : new Date();
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function formatRelativeDate(isoString) {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMin < 2) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

// -----------------------------------------------------------------------------
// Sub-component: Code Block with Syntax Styling & Copy Button
// -----------------------------------------------------------------------------
function CodeSnippetBlock({ code, lang }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="chat-code-block">
      <div className="chat-code-header">
        <span className="chat-code-lang">{lang || 'code'}</span>
        <button
          type="button"
          className="chat-code-copy-btn"
          onClick={handleCopy}
          title="Copy code to clipboard"
        >
          {copied ? (
            <>
              <Check size={13} className="text-emerald" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy size={13} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="chat-code-content">
        <code>{code}</code>
      </pre>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Sub-component: Markdown Content Parser & Renderer
// -----------------------------------------------------------------------------
function renderInlineFormatted(text, keyPrefix = 'inline') {
  if (!text) return null;

  // Match: `inline code`, **bold**, [text](url), https://url
  const inlineRegex = /(`[^`]+`|\*\*[^*]+\*\*|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|https?:\/\/[^\s)]+)/g;
  const elements = [];
  let lastIdx = 0;
  let match;
  let partIdx = 0;

  while ((match = inlineRegex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      elements.push(
        <span key={`${keyPrefix}-txt-${partIdx++}`}>
          {text.substring(lastIdx, match.index)}
        </span>
      );
    }

    const token = match[0];
    if (token.startsWith('`') && token.endsWith('`')) {
      elements.push(
        <code key={`${keyPrefix}-code-${partIdx++}`} className="chat-inline-code">
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('**') && token.endsWith('**')) {
      elements.push(
        <strong key={`${keyPrefix}-bold-${partIdx++}`} className="chat-strong">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (match[2] && match[3]) {
      elements.push(
        <a
          key={`${keyPrefix}-link-${partIdx++}`}
          href={match[3]}
          target="_blank"
          rel="noopener noreferrer"
          className="chat-link"
        >
          {match[2]}
        </a>
      );
    } else if (token.startsWith('http')) {
      elements.push(
        <a
          key={`${keyPrefix}-url-${partIdx++}`}
          href={token}
          target="_blank"
          rel="noopener noreferrer"
          className="chat-link"
        >
          {token}
        </a>
      );
    }

    lastIdx = match.index + token.length;
  }

  if (lastIdx < text.length) {
    elements.push(
      <span key={`${keyPrefix}-end-${partIdx++}`}>{text.substring(lastIdx)}</span>
    );
  }

  return elements.length > 0 ? elements : text;
}

function FormattedMarkdown({ content }) {
  if (!content) return null;

  // Split content by fenced code blocks ```lang ... ```
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  const blocks = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      blocks.push({
        type: 'text',
        content: content.substring(lastIndex, match.index),
      });
    }
    blocks.push({
      type: 'code',
      lang: match[1] || 'code',
      code: match[2].replace(/\n$/, ''),
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    blocks.push({ type: 'text', content: content.substring(lastIndex) });
  }

  return (
    <div className="chat-markdown-body">
      {blocks.map((block, bIdx) => {
        if (block.type === 'code') {
          return (
            <CodeSnippetBlock
              key={`code-${bIdx}`}
              code={block.code}
              lang={block.lang}
            />
          );
        }

        // Process text block by paragraphs and lines
        const lines = block.content.split('\n');
        return (
          <div key={`text-${bIdx}`} className="chat-text-block">
            {lines.map((line, lIdx) => {
              const trimmed = line.trim();
              if (!trimmed) {
                return <div key={`empty-${lIdx}`} className="chat-line-gap" />;
              }

              // Heading 3
              if (trimmed.startsWith('### ')) {
                return (
                  <h4 key={`h3-${lIdx}`} className="chat-heading-3">
                    {renderInlineFormatted(trimmed.slice(4), `h3-${lIdx}`)}
                  </h4>
                );
              }
              // Heading 2 or 1
              if (trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
                const headerText = trimmed.startsWith('## ')
                  ? trimmed.slice(3)
                  : trimmed.slice(2);
                return (
                  <h3 key={`h2-${lIdx}`} className="chat-heading-2">
                    {renderInlineFormatted(headerText, `h2-${lIdx}`)}
                  </h3>
                );
              }

              // Bullet points
              if (/^[-*•]\s+/.test(trimmed)) {
                const bulletText = trimmed.replace(/^[-*•]\s+/, '');
                return (
                  <div key={`li-${lIdx}`} className="chat-bullet-item">
                    <span className="chat-bullet-dot" />
                    <div className="chat-bullet-text">
                      {renderInlineFormatted(bulletText, `bullet-${lIdx}`)}
                    </div>
                  </div>
                );
              }

              // Numbered list
              const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
              if (numMatch) {
                return (
                  <div key={`num-${lIdx}`} className="chat-numbered-item">
                    <span className="chat-number-badge">{numMatch[1]}.</span>
                    <div className="chat-numbered-text">
                      {renderInlineFormatted(numMatch[2], `num-${lIdx}`)}
                    </div>
                  </div>
                );
              }

              // Regular paragraph
              return (
                <p key={`p-${lIdx}`} className="chat-paragraph">
                  {renderInlineFormatted(trimmed, `p-${lIdx}`)}
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Main Chatbot Widget Component
// -----------------------------------------------------------------------------
export default function ChatbotWidget({
  currentUser,
  token,
  selectedBotOption,
  isChatOpen,
  setIsChatOpen,
}) {
  // Determine active persona configuration
  const persona = BOT_PERSONAS[selectedBotOption] || DEFAULT_PERSONA;
  const PersonaIcon = persona.icon || Bot;

  // Authorization headers for backend requests
  const getAuthHeaders = () => {
    const activeToken = token || localStorage.getItem('token') || '';
    return {
      'Content-Type': 'application/json',
      ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
    };
  };

  // Get active user info (userId, email, role) from props or token
  const getUserInfo = () => {
    let uid = currentUser?.id || currentUser?._id;
    let mail = currentUser?.email;
    let urole = currentUser?.role;

    if (!uid || !mail || !urole) {
      try {
        const activeToken = token || localStorage.getItem('token');
        if (activeToken) {
          const parts = activeToken.split('.');
          if (parts.length === 3) {
            const decoded = JSON.parse(atob(parts[1]));
            if (!uid) uid = decoded.id || decoded._id;
            if (!mail) mail = decoded.email;
            if (!urole) urole = decoded.role;
          }
        }
      } catch {
        // ignore decode failure
      }
    }

    return {
      userId: uid ? String(uid) : '',
      email: mail || '',
      role: urole || 'user',
    };
  };

  const initialGreeting = useMemo(() => {
    const greetingText = currentUser?.name
      ? `Hello ${currentUser.name}! I am your ${selectedBotOption || 'AI Assistant'}. How can I help your workflow today?`
      : persona.greeting;
    return {
      id: 1,
      sender: 'bot',
      text: greetingText,
      timestamp: formatTimestamp(),
    };
  }, [currentUser, selectedBotOption, persona]);

  // Messages & Conversation State
  const [messages, setMessages] = useState([initialGreeting]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [error, setError] = useState(null);
  const [isBackendOnline, setIsBackendOnline] = useState(true);

  // Widget Window Controls
  const [isExpanded, setIsExpanded] = useState(false);

  // History Drawer State
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [chatSessions, setChatSessions] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [deletingSessionId, setDeletingSessionId] = useState(null);

  // UI Micro-interactions
  const [copiedMessageId, setCopiedMessageId] = useState(null);

  const messagesEndRef = useRef(null);
  const abortRef = useRef(null);
  const textareaRef = useRef(null);
  const nextIdRef = useRef(2);

  const nextId = () => nextIdRef.current++;

  // Auto-scroll on new messages or typing
  useEffect(() => {
    if (isChatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isChatOpen, isTyping]);

  // Health check on mount
  useEffect(() => {
    let mounted = true;
    fetch(`${API_BASE}/health`)
      .then((res) => {
        if (mounted) setIsBackendOnline(res.ok);
      })
      .catch(() => {
        if (mounted) setIsBackendOnline(false);
      });
    return () => {
      mounted = false;
      abortRef.current?.abort();
    };
  }, []);

  // Update greeting when bot option changes and no conversation has taken place
  const prevBotOptionRef = useRef(selectedBotOption);
  useEffect(() => {
    if (prevBotOptionRef.current !== selectedBotOption) {
      prevBotOptionRef.current = selectedBotOption;
      setMessages((prev) => (prev.length <= 1 && !sessionId ? [initialGreeting] : prev));
    }
  }, [selectedBotOption, initialGreeting, sessionId]);

  // ---------------------------------------------------------------------------
  // Backend API Actions (routed through Node.js backend)
  // ---------------------------------------------------------------------------
  const loadChatSessions = async () => {
    setIsLoadingHistory(true);
    setHistoryError(null);
    try {
      const res = await fetch(`${API_BASE}/chats`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setChatSessions(data.sessions || []);
    } catch (err) {
      console.error('Chat history error:', err);
      setHistoryError(err.message || 'Could not load chat history.');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const toggleHistory = () => {
    const opening = !isHistoryOpen;
    setIsHistoryOpen(opening);
    if (opening) {
      loadChatSessions();
    }
  };

  const continueChat = async (chat) => {
    if (isLoadingChat) return;
    setIsLoadingChat(true);
    setHistoryError(null);
    try {
      const res = await fetch(
        `${API_BASE}/chats/${encodeURIComponent(chat.session_id)}`,
        { headers: getAuthHeaders() }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

      const historyMessages = (data.messages || []).map((message) => ({
        id: nextId(),
        sender: message.role === 'user' ? 'user' : 'bot',
        text: message.content,
        sources: message.sources || [],
        timestamp: formatTimestamp(message.created_at),
      }));

      setMessages(historyMessages.length ? historyMessages : [initialGreeting]);
      setSessionId(data.session_id || chat.session_id);
      setError(null);
      setIsHistoryOpen(false);
    } catch (err) {
      console.error('Chat restore error:', err);
      setHistoryError(err.message || 'Could not open this conversation.');
    } finally {
      setIsLoadingChat(false);
    }
  };

  const handleRenameSession = async (sId, e) => {
    e?.stopPropagation();
    if (!editingTitle.trim()) {
      setEditingSessionId(null);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/chats/${encodeURIComponent(sId)}/rename`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ title: editingTitle.trim() }),
      });
      if (!res.ok) throw new Error('Rename failed');

      setChatSessions((prev) =>
        prev.map((s) => (s.session_id === sId ? { ...s, title: editingTitle.trim() } : s))
      );
      setEditingSessionId(null);
      setEditingTitle('');
    } catch (err) {
      console.error('Rename error:', err);
    }
  };

  const handleDeleteSession = async (sId, e) => {
    e?.stopPropagation();
    try {
      const res = await fetch(`${API_BASE}/chats/${encodeURIComponent(sId)}/delete`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Delete failed');

      setChatSessions((prev) => prev.filter((s) => s.session_id !== sId));
      setDeletingSessionId(null);

      // If deleted session was active, reset chat
      if (sessionId === sId) {
        handleNewChat();
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const sendQuestion = async (question) => {
    const text = question.trim();
    if (!text || isTyping) return;

    setError(null);
    const userTimestamp = formatTimestamp();
    setMessages((prev) => [
      ...prev,
      { id: nextId(), sender: 'user', text, timestamp: userTimestamp },
    ]);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setIsTyping(true);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const userInfo = getUserInfo();
      const requestPayload = {
        question: text,
        ...(sessionId ? { session_id: sessionId } : {}),
        user_id: userInfo.userId,
        email: userInfo.email,
        role: userInfo.role,
      };

      const res = await fetch(`${API_BASE}/ask`, {
        method: 'POST',
        headers: getAuthHeaders(),
        signal: controller.signal,
        body: JSON.stringify(requestPayload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

      if (data.session_id && data.session_id !== sessionId) {
        setSessionId(data.session_id);
      }

      const botTimestamp = formatTimestamp();
      setMessages((prev) => [
        ...prev,
        {
          id: nextId(),
          sender: 'bot',
          text: data.answer || '(no answer generated)',
          sources: data.sources || [],
          timestamp: botTimestamp,
        },
      ]);

      if (isHistoryOpen) {
        await loadChatSessions();
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('Chat error:', err);
      setError(err.message || 'Network connection error');
      setMessages((prev) => [
        ...prev,
        {
          id: nextId(),
          sender: 'bot',
          text: `⚠️ **Unable to get response:** ${err.message || 'Please check your backend connection and try again.'}`,
          isError: true,
          timestamp: formatTimestamp(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleRetryLast = () => {
    // Find last user message
    const lastUserMessage = [...messages].reverse().find((m) => m.sender === 'user');
    if (lastUserMessage) {
      sendQuestion(lastUserMessage.text);
    }
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    sendQuestion(input);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleTextareaInput = (e) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    const targetHeight = Math.min(e.target.scrollHeight, 120);
    e.target.style.height = `${targetHeight}px`;
    e.target.style.overflowY = e.target.scrollHeight > 120 ? 'auto' : 'hidden';
  };

  const handleNewChat = () => {
    abortRef.current?.abort();
    setSessionId(null);
    setMessages([initialGreeting]);
    setInput('');
    setError(null);
    setIsTyping(false);
    setIsHistoryOpen(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.overflowY = 'hidden';
    }
  };

  // Copy message text helper
  const handleCopyMessage = (msgId, text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedMessageId(msgId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    });
  };

  // Filtered history sessions
  const filteredSessions = useMemo(() => {
    if (!historySearch.trim()) return chatSessions;
    const query = historySearch.toLowerCase();
    return chatSessions.filter(
      (s) =>
        (s.title && s.title.toLowerCase().includes(query)) ||
        (s.session_id && s.session_id.toLowerCase().includes(query))
    );
  }, [chatSessions, historySearch]);

  const isConversationFresh = messages.length <= 1;

  return (
    <>
      {/* Floating Bot Launch Trigger Button */}
      <div className="floating-bot-trigger" id="floating-chatbot-trigger">
        {!isChatOpen && (
          <div
            className="floating-tooltip"
            onClick={() => setIsChatOpen(true)}
            role="button"
            tabIndex={0}
          >
            <Sparkles size={14} className="tooltip-sparkle" />
            <span>Chatbot Assistant ready &bull; Ask {selectedBotOption}</span>
          </div>
        )}

        <button
          type="button"
          className={`floating-bot-btn ${isChatOpen ? 'active' : ''}`}
          onClick={() => setIsChatOpen((prev) => !prev)}
          title={isChatOpen ? 'Close chat' : `Open ${selectedBotOption}`}
          aria-label={isChatOpen ? 'Close chat window' : 'Open chat window'}
          aria-expanded={isChatOpen}
        >
          {!isChatOpen && (
            <span
              className={`bot-notification-badge ${isBackendOnline ? 'online' : 'standby'}`}
              title={isBackendOnline ? 'RAG Server Connected' : 'Server Standby'}
            />
          )}
          {isChatOpen ? <X size={26} /> : <Bot size={28} />}
        </button>
      </div>

      {/* Floating Chatbot Window / Drawer */}
      {isChatOpen && (
        <div
          className={`chatbot-widget-window ${isExpanded ? 'expanded' : ''} ${persona.accentClass}`}
          id="chatbot-widget-window"
          role="region"
          aria-label="AI Chatbot Assistant"
        >
          {/* Header */}
          <header className="chat-widget-header">
            <div className="chat-bot-info">
              <div
                className="chat-bot-avatar"
                style={{
                  background: `linear-gradient(135deg, ${persona.color}, #ec4899)`,
                }}
              >
                <PersonaIcon size={20} />
                <span
                  className={`avatar-status-pip ${isBackendOnline ? 'online' : 'standby'}`}
                />
              </div>

              <div className="chat-bot-names">
                <div className="chat-bot-title-row">
                  <h4>{selectedBotOption}</h4>
                </div>
                <div className="chat-bot-status-row">
                  <span
                    className={`status-dot ${isBackendOnline ? 'dot-online' : 'dot-standby'}`}
                  />
                  <span className="status-label">
                    {isBackendOnline ? 'Connected' : 'Offline Mode'}
                  </span>
                  <span className="status-separator">&bull;</span>
                  <span
                    className="session-tag"
                    title={sessionId ? `Session ID: ${sessionId}` : 'New session'}
                  >
                    {sessionId ? `#${sessionId.slice(0, 8)}` : 'New session'}
                  </span>
                </div>
              </div>
            </div>

            {/* Header Controls */}
            <div className="chat-header-actions">
              {/* History Toggle */}
              <button
                type="button"
                className={`chat-icon-btn chat-history-btn ${isHistoryOpen ? 'active' : ''}`}
                onClick={toggleHistory}
                title="Conversation history"
                aria-label="Conversation history"
                aria-expanded={isHistoryOpen}
              >
                <HistoryIcon size={17} />
                <span className="btn-label-desktop">History</span>
              </button>

              {/* Maximize / Restore Toggle */}
              <button
                type="button"
                className="chat-icon-btn"
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? 'Restore compact view' : 'Expand window'}
                aria-label={isExpanded ? 'Restore window size' : 'Expand window size'}
              >
                {isExpanded ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
              </button>

              {/* New Chat Button */}
              <button
                type="button"
                className="chat-icon-btn"
                onClick={handleNewChat}
                title="Start a new chat"
                aria-label="Start a new chat"
              >
                <Plus size={18} />
              </button>

              {/* Close Button */}
              <button
                type="button"
                className="chat-icon-btn chat-close-btn"
                onClick={() => setIsChatOpen(false)}
                title="Close chat window"
                aria-label="Close chat window"
              >
                <X size={18} />
              </button>
            </div>
          </header>

          {/* Slide-over Conversation History Panel */}
          {isHistoryOpen && (
            <aside
              className="chat-history-panel"
              id="chat-history-panel"
              aria-label="Conversation history"
            >
              <div className="chat-history-panel-header">
                <button
                  type="button"
                  className="chat-history-new-chat-btn"
                  onClick={handleNewChat}
                  title="Start fresh conversation"
                >
                  <Plus size={14} />
                  <span>New Chat</span>
                </button>
                <button
                  type="button"
                  className="chat-history-close-btn"
                  onClick={() => setIsHistoryOpen(false)}
                  title="Close history"
                  aria-label="Close history"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Search History */}
              <div className="chat-history-search-row">
                <Search size={14} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search chats by title..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="chat-history-search-input"
                />
                {historySearch && (
                  <button
                    type="button"
                    className="search-clear-btn"
                    onClick={() => setHistorySearch('')}
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* History Content */}
              <div className="chat-history-scroll-area">
                {historyError && (
                  <div className="chat-history-state error">
                    <AlertCircle size={16} />
                    <span>{historyError}</span>
                  </div>
                )}

                {!historyError && isLoadingHistory && (
                  <div className="chat-history-state loading">
                    <Loader2 size={20} className="spin" />
                    <span>Loading conversations…</span>
                  </div>
                )}

                {!historyError &&
                  !isLoadingHistory &&
                  filteredSessions.length === 0 && (
                    <div className="chat-history-empty">
                      <Bot size={28} className="empty-bot-icon" />
                      <p>
                        {historySearch
                          ? 'No chats match your search query.'
                          : 'No saved conversations yet. Start asking questions!'}
                      </p>
                    </div>
                  )}

                {!historyError &&
                  !isLoadingHistory &&
                  filteredSessions.length > 0 && (
                    <div className="chat-history-list">
                      {filteredSessions.map((chat) => {
                        const isActive = chat.session_id === sessionId;
                        const isEditing = editingSessionId === chat.session_id;
                        const isDeleting = deletingSessionId === chat.session_id;

                        return (
                          <div
                            key={chat.session_id}
                            className={`chat-history-item-wrap ${isActive ? 'active' : ''}`}
                          >
                            {isEditing ? (
                              <div className="chat-history-edit-row">
                                <input
                                  type="text"
                                  className="chat-rename-input"
                                  value={editingTitle}
                                  onChange={(e) => setEditingTitle(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleRenameSession(chat.session_id, e);
                                    } else if (e.key === 'Escape') {
                                      setEditingSessionId(null);
                                    }
                                  }}
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  className="chat-inline-action save"
                                  onClick={(e) =>
                                    handleRenameSession(chat.session_id, e)
                                  }
                                  title="Save title"
                                >
                                  <Check size={14} />
                                </button>
                                <button
                                  type="button"
                                  className="chat-inline-action cancel"
                                  onClick={() => setEditingSessionId(null)}
                                  title="Cancel"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                className="chat-history-item-btn"
                                onClick={() => continueChat(chat)}
                                disabled={isLoadingChat || isTyping}
                              >
                                <div className="chat-history-item-top">
                                  <span className="chat-history-item-title">
                                    {chat.title || 'Untitled conversation'}
                                  </span>
                                  {isActive && (
                                    <span className="chat-active-badge">Active</span>
                                  )}
                                </div>
                                <div className="chat-history-item-bottom">
                                  <span>{chat.message_count || 0} messages</span>
                                  <span>&bull;</span>
                                  <span>{formatRelativeDate(chat.updated_at)}</span>
                                </div>
                              </button>
                            )}

                            {/* Session item action buttons */}
                            {!isEditing && (
                              <div className="chat-history-item-actions">
                                <button
                                  type="button"
                                  className="chat-action-btn edit"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingSessionId(chat.session_id);
                                    setEditingTitle(chat.title || '');
                                  }}
                                  title="Rename conversation"
                                >
                                  <Edit2 size={13} />
                                </button>

                                {isDeleting ? (
                                  <div className="chat-delete-confirm">
                                    <button
                                      type="button"
                                      className="chat-action-btn confirm-del"
                                      onClick={(e) =>
                                        handleDeleteSession(chat.session_id, e)
                                      }
                                      title="Confirm delete"
                                    >
                                      Delete?
                                    </button>
                                    <button
                                      type="button"
                                      className="chat-action-btn cancel-del"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDeletingSessionId(null);
                                      }}
                                      title="Cancel"
                                    >
                                      <X size={12} />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    className="chat-action-btn delete"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeletingSessionId(chat.session_id);
                                    }}
                                    title="Delete conversation"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
              </div>
            </aside>
          )}

          {/* Main Messages Scroll Container */}
          <div
            className="chat-messages-container"
            role="log"
            aria-live="polite"
            aria-label="Chat messages"
          >
            {/* Fresh Chat Welcome Hero Banner */}
            {isConversationFresh && (
              <div className="chat-welcome-banner">
                <div
                  className="welcome-bot-orb"
                  style={{
                    background: `linear-gradient(135deg, ${persona.color}, #ec4899)`,
                  }}
                >
                  <PersonaIcon size={26} />
                </div>
                <h3>{selectedBotOption}</h3>
              </div>
            )}

            {/* Render Messages */}
            {messages.map((m) => {
              const isUser = m.sender === 'user';

              return (
                <div
                  key={m.id}
                  className={`chat-msg-row ${isUser ? 'row-user' : 'row-bot'}`}
                >
                  {/* Bot Avatar Icon */}
                  {!isUser && (
                    <div
                      className="chat-msg-avatar"
                      style={{
                        background: `linear-gradient(135deg, ${persona.color}, #ec4899)`,
                      }}
                    >
                      <PersonaIcon size={14} />
                    </div>
                  )}

                  <div className="chat-msg-wrapper">
                    <div
                      className={`chat-msg-bubble ${isUser ? 'bubble-user' : 'bubble-bot'} ${m.isError ? 'bubble-error' : ''}`}
                    >
                      {/* Message Content */}
                      {isUser ? (
                        <p className="user-text-content">{m.text}</p>
                      ) : (
                        <FormattedMarkdown content={m.text} />
                      )}

                    </div>

                    {/* Message Action Footer Bar */}
                    <div className={`chat-msg-footer ${isUser ? 'footer-user' : 'footer-bot'}`}>
                      {m.timestamp && (
                        <span className="chat-msg-time">{m.timestamp}</span>
                      )}

                      <div className="chat-msg-actions">
                        {/* Copy button */}
                        <button
                          type="button"
                          className="msg-action-btn"
                          onClick={() => handleCopyMessage(m.id, m.text)}
                          title="Copy message"
                        >
                          {copiedMessageId === m.id ? (
                            <Check size={12} className="text-emerald" />
                          ) : (
                            <Copy size={12} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Animated Typing Indicator */}
            {isTyping && (
              <div className="chat-msg-row row-bot">
                <div
                  className="chat-msg-avatar"
                  style={{
                    background: `linear-gradient(135deg, ${persona.color}, #ec4899)`,
                  }}
                >
                  <PersonaIcon size={14} />
                </div>
                <div className="chat-msg-wrapper">
                  <div className="chat-msg-bubble bubble-bot typing-indicator">
                    <div className="typing-dots">
                      <span className="dot dot-1" />
                      <span className="dot dot-2" />
                      <span className="dot dot-3" />
                    </div>
                    <span className="typing-label">Thinking…</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>


          {/* Global Network / API Error Banner */}
          {error && (
            <div className="chat-error-banner" role="alert">
              <AlertCircle size={15} />
              <span>{error}</span>
              <button
                type="button"
                className="chat-error-retry"
                onClick={handleRetryLast}
              >
                Retry
              </button>
            </div>
          )}

          {/* Input Area Form */}
          <form className="chat-input-form" onSubmit={handleSubmit}>
            <div className="chat-input-container">
              <textarea
                ref={textareaRef}
                className="chat-textarea-field"
                rows={1}
                placeholder={`Ask ${selectedBotOption}…`}
                value={input}
                onChange={handleTextareaInput}
                onKeyDown={handleKeyDown}
                disabled={isTyping}
                maxLength={1000}
                autoFocus
              />

              {/* Clear input button if input has text */}
              {input && (
                <button
                  type="button"
                  className="chat-input-clear-btn"
                  onClick={() => {
                    setInput('');
                    if (textareaRef.current) {
                      textareaRef.current.style.height = 'auto';
                      textareaRef.current.style.overflowY = 'hidden';
                      textareaRef.current.focus();
                    }
                  }}
                  title="Clear input text"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="chat-input-actions">
              {/* Submit / Send Button */}
              <button
                type="submit"
                className="chat-send-btn"
                disabled={isTyping || !input.trim()}
                title="Send message (Enter)"
                aria-label="Send message"
              >
                {isTyping ? (
                  <Loader2 size={18} className="spin" />
                ) : (
                  <>
                    <Send size={16} />
                    <CornerDownLeft size={10} className="send-key-icon" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
