import React, { useState } from 'react';
import { User } from '../types';

interface LoginProps {
  onLogin: (username: string) => void;
}

// ----------------------------------------------------------------------
// EDIT YOUR LOGO HERE
// Paste the URL of your image file below.
// ----------------------------------------------------------------------
const LOGO_URL = "https://cdn-icons-png.flaticon.com/512/1265/1265775.png"; 
// ----------------------------------------------------------------------

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      return;
    }

    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    try {
      // Retrieve accounts from local storage
      const accountsStr = localStorage.getItem('voice_diary_accounts');
      const accounts = accountsStr ? JSON.parse(accountsStr) : {};

      if (accounts[cleanUsername]) {
        // User exists - Verify password
        if (accounts[cleanUsername] === cleanPassword) {
          onLogin(cleanUsername);
        } else {
          setError('Incorrect password');
        }
      } else {
        // User does not exist - Create new account (Registration)
        accounts[cleanUsername] = cleanPassword;
        localStorage.setItem('voice_diary_accounts', JSON.stringify(accounts));
        
        onLogin(cleanUsername);
      }
    } catch (err) {
      console.error("Auth error", err);
      setError("An error occurred during authentication.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-950 text-slate-200">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-indigo-500/10 mb-6 ring-1 ring-indigo-500/30 shadow-[0_0_30px_rgba(99,102,241,0.2)] transform rotate-3 hover:rotate-6 transition-transform duration-500 overflow-hidden relative">
            {/* Logo Image */}
            <img 
              src={LOGO_URL} 
              alt="App Logo" 
              className="w-14 h-14 object-contain opacity-90 invert"
              onError={(e) => {
                // Fallback if image fails to load
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement?.classList.add('fallback-icon');
              }}
            />
            
            {/* Fallback SVG (Hidden by default unless image fails) */}
            <svg xmlns="http://www.w3.org/2000/svg" className="absolute h-10 w-10 text-indigo-400 hidden fallback-show" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-1.028 1.086-2.09 1.315-3.131m-14.65 0a14.828 14.828 0 00-1.314-3.132m2.138-1.527a9.96 9.96 0 0110.198 0m-8.775 3.125a6.002 6.002 0 017.352 0m-4.276 4.625l-.271.436" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-purple-300 to-indigo-300 mb-3 tracking-tight">
            Diary
          </h1>
          <p className="text-slate-400 font-light tracking-wide uppercase text-xs">The Library Thought Archive</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-8 rounded-2xl shadow-xl">
          <div className="mb-4">
            <label htmlFor="username" className="block text-sm font-medium text-slate-400 mb-2">
              Library ID / Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError('');
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                placeholder="e.g., Librarian_01"
                autoComplete="username"
              />
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-slate-400 mb-2">
              Passkey
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                placeholder="Enter your secure key"
                autoComplete="current-password"
              />
            </div>
            {error && <p className="text-red-400 text-xs mt-2 flex items-center"><svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>{error}</p>}
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium py-3 px-4 rounded-lg shadow-lg shadow-indigo-500/20 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Access Archive
          </button>
        </form>
        
        <div className="mt-8 text-center">
            <p className="text-xs text-slate-600 mb-1">
                Collect your thoughts. Archive the mind.
            </p>
            <p className="text-[10px] text-slate-700 mt-4">
                System Administrator: login as 'admin'
            </p>
        </div>
      </div>
      <style>{`
        .fallback-icon .fallback-show {
          display: block !important;
        }
      `}</style>
    </div>
  );
};

export default Login;