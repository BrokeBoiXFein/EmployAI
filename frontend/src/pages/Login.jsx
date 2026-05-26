import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../store/auth';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuth(s => s.login);
  const error = useAuth(s => s.error);
  const clearError = useAuth(s => s.clearError);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Where to send them after login. Defaults to /analyze, but if
  // ProtectedRoute kicked them here, it set a `from` in location.state.
  const redirectTo = location.state?.from || '/analyze';

  const onSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await login({ email, password });
      navigate(redirectTo, { replace: true });
    } catch (_) {
      // error is already in the store
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12">
      <div className="bg-indigo-950/60 border border-indigo-900/50 rounded-2xl p-8 backdrop-blur-md">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-500/30 mb-3">
            <LogIn className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome back</h1>
          <p className="text-indigo-300/70 text-sm mt-1">Log in to continue your job search</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-indigo-200 mb-1.5">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400" />
              <input
                type="email"
                required
                autoFocus
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
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (error) clearError(); }}
                className="w-full bg-indigo-900/40 border border-indigo-800/50 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-indigo-400/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-700/50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl shadow-lg shadow-indigo-500/20 transition"
          >
            {submitting ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <p className="text-center text-indigo-300/70 text-sm mt-6">
          Don't have an account?{' '}
          <Link to="/signup" className="text-indigo-300 hover:text-white font-medium">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
