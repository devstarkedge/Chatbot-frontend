import React, { useState } from 'react';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  KeyRound,
} from 'lucide-react';

const API_BASE_URL =
  import.meta.env.VITE_AUTH_API_BASE_URL || 'http://localhost:5000/api/auth';

function Login({ onLoginSuccess }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (alert) setAlert(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert(null);

    if (!formData.email.trim() || !formData.password) {
      setAlert({
        type: 'error',
        message: 'Please provide both your email address and password.',
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Login failed. Please check your credentials.');
      }

      setAlert({
        type: 'success',
        message: 'Login successful! Entering dashboard...',
      });

      onLoginSuccess(data.token, data.user);
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.message || 'Server connection error. Please ensure the backend is running.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card" id="auth-form-card">
      <div className="card-header">
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'rgba(99, 102, 241, 0.15)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem auto',
          }}
        >
          <KeyRound size={24} color="#818cf8" />
        </div>
        <h1 className="card-title" id="form-heading">
          Welcome Back
        </h1>
        <p className="card-subtitle">
          Enter your credentials to access your account in <strong>test_copy</strong>.
        </p>
      </div>

      {/* Alert Banner */}
      {alert && (
        <div
          className={`alert-banner ${alert.type === 'error' ? 'alert-error' : 'alert-success'}`}
          id="auth-alert-banner"
        >
          {alert.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{alert.message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} id="login-form" noValidate>
        {/* Email Address */}
        <div className="form-group">
          <label className="form-label" htmlFor="input-email">
            Email Address
          </label>
          <div className="input-wrapper">
            <Mail size={18} className="input-icon" />
            <input
              id="input-email"
              type="email"
              name="email"
              className="form-input"
              placeholder="Enter your registered email"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              required
            />
          </div>
        </div>

        {/* Password */}
        <div className="form-group">
          <label className="form-label" htmlFor="input-password">
            Password
          </label>
          <div className="input-wrapper">
            <Lock size={18} className="input-icon" />
            <input
              id="input-password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              className="form-input"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              className="password-toggle-btn"
              id="toggle-password-visibility"
              onClick={() => setShowPassword((prev) => !prev)}
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Remember Me & Forgot Password */}
        <div className="form-extras">
          <label className="checkbox-label" htmlFor="remember-me-checkbox">
            <input
              type="checkbox"
              id="remember-me-checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <span>Remember me</span>
          </label>

          <a
            href="#forgot"
            className="forgot-link"
            id="forgot-password-link"
            onClick={(e) => {
              e.preventDefault();
              setAlert({
                type: 'error',
                message: 'For password assistance, please contact your workspace administrator.',
              });
            }}
          >
            Forgot password?
          </a>
        </div>

        {/* Sign In Button */}
        <button
          type="submit"
          className="btn-primary"
          id="submit-login-btn"
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="spinner" />
              <span>Verifying Credentials...</span>
            </>
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default Login;
