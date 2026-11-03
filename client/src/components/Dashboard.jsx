import React from 'react';
import {
  Sparkles,
  Layers,
  MessageSquare,
  Database,
  BarChart3,
  Cpu,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';

function Dashboard({
  currentUser,
  selectedBotOption,
  onSelectBot,
  onOpenChat,
}) {
  // Chatbot Options List
  const chatbotOptions = [
    {
      id: 'support',
      title: 'Customer Assistance',
      desc: 'Instant replies, ticket routing, and conversational FAQs for your customers.',
      icon: <MessageSquare size={24} color="#6366f1" />,
      bg: 'rgba(99, 102, 241, 0.15)',
      status: 'Ready & Active',
    },
    {
      id: 'knowledge',
      title: 'Knowledge Base / RAG Bot',
      desc: 'Answers questions grounded in your MongoDB test_copy documents and guidelines.',
      icon: <Database size={24} color="#38bdf8" />,
      bg: 'rgba(56, 189, 248, 0.15)',
      status: 'Indexed 57 users',
    },
    {
      id: 'analytics',
      title: 'Sales & Lead Bot',
      desc: 'Automates user lead qualification, captures email inquiries, and books meetings.',
      icon: <BarChart3 size={24} color="#10b981" />,
      bg: 'rgba(16, 185, 129, 0.15)',
      status: 'Lead Automation',
    },
    {
      id: 'custom',
      title: 'Custom Workflow Assistant',
      desc: 'Tailor specialized system instructions, function tools, and custom chat agents.',
      icon: <Cpu size={24} color="#f59e0b" />,
      bg: 'rgba(245, 158, 11, 0.15)',
      status: 'Customizable',
    },
  ];

  const handleCardClick = (botTitle) => {
    onSelectBot(botTitle);
    onOpenChat();
  };

  return (
    <div className="landing-container" id="landing-page-view">
      {/* Hero Welcome */}
      <header className="welcome-hero">
        <div className="welcome-badge">
          <Sparkles size={16} /> Authenticated Workspace Active
        </div>
        <h1 className="welcome-title">
          Welcome back, {currentUser?.name || 'User'}!
        </h1>
        <p className="welcome-subtitle">
          Your AI Chatbot environment is ready. Select a chatbot option below to start a session or tap the floating bot icon in the bottom corner.
        </p>
      </header>

      {/* Chatbot Options Cards Section */}
      <div className="options-heading-row">
        <h2 className="section-title">
          <Layers size={22} color="var(--accent-primary)" />
          Chatbot Options & Modules
        </h2>
        <span className="section-tag">Pick a bot module to converse</span>
      </div>

      <div className="chatbot-grid">
        {chatbotOptions.map((opt) => {
          const isActive = selectedBotOption === opt.title;
          return (
            <div
              key={opt.id}
              className={`chatbot-card ${isActive ? 'active-card' : ''}`}
              id={`chatbot-option-${opt.id}`}
              onClick={() => handleCardClick(opt.title)}
            >
              <div className="chatbot-card-icon" style={{ background: opt.bg }}>
                {opt.icon}
              </div>
              <h3 className="chatbot-card-title">{opt.title}</h3>
              <p className="chatbot-card-desc">{opt.desc}</p>
              <div className="chatbot-card-footer">
                <span className="chatbot-status-pill">
                  <CheckCircle2 size={14} /> {opt.status}
                </span>
                <button
                  type="button"
                  className="btn-open-bot"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCardClick(opt.title);
                  }}
                >
                  <span>Launch</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Dashboard;
