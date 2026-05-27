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
    if (password.length < 8) return; // mirror the server-side rule
    setSubmitting(true);
    try {
      await signup({ email, password, name, preferredLanguage: language });
      navigate('/analyze', { replace: true });
    } catch (_) { /* error in store */ }
    finally { setSubmitting(false); }
  };

  const pwTooShort = password.length > 0 && password.length < 8;

  // Reused input class — keeps the dark-mode variants in one place
  const inputCls = (extra = '') =>
    `w-full rounded-md pl-10 pr-4 py-2.5
     bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400
     dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder-slate-500
     focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent
     ${extra}`;

  return (
    <div className="max-w-md mx-auto px-4 mt-12">
      <div className="rounded-lg p-8
                      bg-white border border-slate-200 shadow-sm
                      dark:bg-slate-900 dark:border-slate-800 dark:shadow-none">
        <div className="flex flex-col items-center mb-6">
          <div className="p-3 rounded-lg mb-3
                          bg-sky-600 dark:bg-sky-700">
            <UserPlus className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create your account</h1>
          <p className="text-sm mt-1 text-slate-500 dark:text-slate-400">Save your profile and track your applications</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-md text-sm flex items-start gap-2
                          bg-red-50 border border-red-200 text-red-700
                          dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-300">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-200">
              Name <span className="text-slate-400 dark:text-slate-500">(optional)</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                     className={inputCls()} placeholder="Your name" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-200">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input type="email" required value={email}
                     onChange={(e) => { setEmail(e.target.value); if (error) clearError(); }}
                     className={inputCls()} placeholder="you@example.com" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-200">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input type="password" required minLength={8} value={password}
                     onChange={(e) => { setPassword(e.target.value); if (error) clearError(); }}
                     className={inputCls(pwTooShort ? 'border-amber-500 dark:border-amber-500/60' : '')}
                     placeholder="At least 8 characters" />
            </div>
            {pwTooShort && <p className="text-xs mt-1 text-amber-700 dark:text-amber-400">Password must be at least 8 characters</p>}
          </div>

          <button
            type="submit"
            disabled={submitting || pwTooShort}
            className="w-full font-semibold py-2.5 rounded-md transition-colors cursor-pointer
                       bg-sky-600 hover:bg-sky-700 text-white
                       dark:bg-sky-600 dark:hover:bg-sky-500
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm mt-6 text-slate-500 dark:text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-sky-700 hover:text-sky-900 dark:text-sky-400 dark:hover:text-sky-300">Log in</Link>
        </p>
      </div>
    </div>
  );
}
