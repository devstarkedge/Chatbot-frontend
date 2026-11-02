import React, { useState, useEffect } from 'react';
import { Navbar, Login, Dashboard, ChatbotWidget, Footer } from './components';
import './App.css';

const API_BASE_URL =
  import.meta.env.VITE_AUTH_API_BASE_URL || '/api/auth';

function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(() => {
    localStorage.removeItem('starkauth_token');
    localStorage.removeItem('starkauth_user');
    return localStorage.getItem('token');
  });

  // Chatbot State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedBotOption, setSelectedBotOption] = useState('Customer Support Bot');

  // Restore saved session on initial load using the token
  useEffect(() => {
    if (token) {
      fetch(`${API_BASE_URL}/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.user) {
            setCurrentUser(data.user);
          } else {
            localStorage.removeItem('token');
            setToken(null);
            setCurrentUser(null);
          }
        })
        .catch(() => {
          localStorage.removeItem('token');
          setToken(null);
          setCurrentUser(null);
        });
    }
  }, [token]);

  // Handle successful login from Login component
  const handleLoginSuccess = (newToken, user) => {
    setToken(newToken);
    setCurrentUser(user);
    localStorage.clear();
    localStorage.setItem('token', newToken);
  };

  // Handle logout
  const handleLogout = () => {
    setToken(null);
    setCurrentUser(null);
    localStorage.removeItem('token');
    localStorage.clear();
    setIsChatOpen(false);
  };

  return (
    <div className="app-container">
      {/* Background Animated Gradient Orbs */}
      <div className="ambient-background">
        <div className="ambient-orb ambient-orb-1" />
        <div className="ambient-orb ambient-orb-2" />
        <div className="ambient-orb ambient-orb-3" />
        <div className="grid-overlay" />
      </div>

      {/* Top Navbar Component */}
      <Navbar currentUser={currentUser} onLogout={handleLogout} />

      {/* Main Content Area */}
      <main
        className="main-wrapper"
        style={{ padding: currentUser ? '0' : '2.5rem 1.5rem' }}
      >
        {currentUser ? (
          <>
            {/* Authenticated Dashboard / Chatbot Options */}
            <Dashboard
              currentUser={currentUser}
              selectedBotOption={selectedBotOption}
              onSelectBot={setSelectedBotOption}
              onOpenChat={() => setIsChatOpen(true)}
            />

            {/* Floating Interactive Chatbot Component */}
            <ChatbotWidget
              key={currentUser.id}
              currentUser={currentUser}
              token={token}
              selectedBotOption={selectedBotOption}
              isChatOpen={isChatOpen}
              setIsChatOpen={setIsChatOpen}
            />
          </>
        ) : (
          /* Dedicated Login Component */
          <Login onLoginSuccess={handleLoginSuccess} />
        )}
      </main>

      {/* Footer Component */}
      <Footer />
    </div>
  );
}

export default App;
