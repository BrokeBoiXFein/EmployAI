import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, AlertCircle } from 'lucide-react';
import { useAuth } from '../store/auth';

export default function Signup({ language }) {
  const navigate = useNavigate();
  const signup = useAuth(s => s.signup);
  const error = useAuth(s => s.error);
  const clearError = useAuth(s => s.clearError);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (password.length < 8) {
      // Mirror the server-side rule so the user gets feedback before the round trip
      return;
    }
    setSubmitting(true);
    try {
      // Use the currently-selected UI language as their preferred language default.
      // They can change it later (when we add a profile-settings page).
      await signup({ email, password, name, preferredLanguage: language });
      navigate('/analyze', { replace: true });
    } catch (_) {
      // error in store
    } finally {
      setSubmitting(false);
    }
  };

  const pwTooShort = password.length > 0 && password.length < 8;

  return (
    <div className="max-w-md mx-auto mt-12">
      <div className="bg-indigo-950/60 border border-indigo-900/50 rounded-2xl p-8 backdrop-blur-md">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-500/30 mb-3">
            <UserPlus className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Create your account</h1>
          <p className="text-indigo-300/70 text-sm mt-1">Save your profile and track your applications</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-indigo-200 mb-1.5">Name <span className="text-indigo-400/50">(optional)</span></label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-indigo-900/40 border border-indigo-800/50 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-indigo-400/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Your name"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-indigo-200 mb-1.5">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (error) clearError(); }}
                className="w-full bg-indigo-900/40 border border-indigo-800/50 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-indigo-400/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-indigo-200 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400" />
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (error) clearError(); }}
                className={`w-full bg-indigo-900/40 border rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-indigo-400/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${pwTooShort ? 'border-amber-500/50' : 'border-indigo-800/50'}`}
                placeholder="At least 8 characters"
              />
            </div>
            {pwTooShort && <p className="text-amber-400/80 text-xs mt-1">Password must be at least 8 characters</p>}
          </div>

          <button
            type="submit"
            disabled={submitting || pwTooShort}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-700/50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl shadow-lg shadow-indigo-500/20 transition"
          >
            {submitting ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-indigo-300/70 text-sm mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-300 hover:text-white font-medium">Log in</Link>
        </p>
      </div>
    </div>
  );
}
