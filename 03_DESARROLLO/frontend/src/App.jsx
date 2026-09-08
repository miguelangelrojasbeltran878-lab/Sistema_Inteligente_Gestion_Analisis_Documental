import React, { useState, useEffect } from 'react';
import LandingPortal from './components/LandingPortal';
import Workspace from './components/Workspace';

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('uts_token') || null);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    if (token) {
      const storedUser = localStorage.getItem('uts_user');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          handleLogout();
        }
      }
    }
  }, [token]);

  const handleLogin = async (email, password) => {
    setAuthError(null);
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail?.message || errData.detail || 'Credenciales inválidas');
      }

      const json = await res.json();
      const payload = json.data;
      setToken(payload.access_token);
      setUser(payload.user);
      localStorage.setItem('uts_token', payload.access_token);
      localStorage.setItem('uts_user', JSON.stringify(payload.user));
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('uts_token');
    localStorage.removeItem('uts_user');
  };

  return (
    <div className="min-h-screen bg-apple-bg text-apple-text font-sans">
      {!token || !user ? (
        <LandingPortal onLogin={handleLogin} error={authError} />
      ) : (
        <Workspace user={user} token={token} onLogout={handleLogout} />
      )}
    </div>
  );
}
