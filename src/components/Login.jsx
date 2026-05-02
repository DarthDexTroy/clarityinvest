import React, { useState } from 'react';
import './Login.css';

export default function Login({ onLogin }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.email || !formData.password) {
      setError('Please fill in all required fields');
      return;
    }

    if (isSignUp) {
      if (!formData.name) {
        setError('Please enter your name');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
    }

    // Mock authentication - store in localStorage
    const userData = {
      name: formData.name || formData.email.split('@')[0],
      email: formData.email,
      loggedIn: true
    };

    localStorage.setItem('clarityinvest_user', JSON.stringify(userData));
    onLogin(userData);
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
    setFormData({ name: '', email: '', password: '', confirmPassword: '' });
  };

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      <div className="login-card">
        <div className="login-header">
          <div className="logo-section">
            <div className="logo-icon">💎</div>
            <h1>CLARITYINVEST</h1>
          </div>
          <p className="tagline">
            {isSignUp ? 'Start your investment journey' : 'Welcome back'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="error-message">
              <span>⚠️</span>
              {error}
            </div>
          )}

          {isSignUp && (
            <div className="form-field">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                autoComplete="name"
              />
            </div>
          )}

          <div className="form-field">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>

          <div className="form-field">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder={isSignUp ? 'Create a password (min 6 characters)' : 'Enter your password'}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
            />
          </div>

          {isSignUp && (
            <div className="form-field">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter your password"
                autoComplete="new-password"
              />
            </div>
          )}

          <button type="submit" className="login-button">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="login-footer">
          <button onClick={toggleMode} className="toggle-button">
            {isSignUp ? (
              <>
                Already have an account? <span>Sign In</span>
              </>
            ) : (
              <>
                Don't have an account? <span>Sign Up</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
