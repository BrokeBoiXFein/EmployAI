import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../store/auth';
import { useLang } from '../store/lang';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuth(s => s.login);
  const error = useAuth(s => s.error);
  const clearError = useAuth(s => s.clearError);
  const t = useLang(s => s.t);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const redirectTo = location.state?.from || '/analyze';

  const onSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await login({ email, password });
      navigate(redirectTo, { replace: true });
    } catch (_) { /* error in store */ }
    finally { setSubmitting(false); }
  };

  return (
    <div className="max-w-md mx-auto px-4 mt-12">
      <div className="rounded-lg p-8
                      bg-white border border-slate-200 shadow-sm
                      dark:bg-slate-900 dark:border-slate-800 dark:shadow-none">
        <div className="flex flex-col items-center mb-6">
          <div className="p-3 rounded-lg mb-3 bg-sky-600 dark:bg-sky-700">
            <LogIn className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t.authWelcomeBack}</h1>
          <p className="text-sm mt-1 text-slate-500 dark:text-slate-400">{t.authLoginSub}</p>
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
            <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-200">{t.authEmail}</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input type="email" required autoFocus value={email}
                     onChange={(e) => { setEmail(e.target.value); if (error) clearError(); }}
                     className="w-full rounded-md pl-10 pr-4 py-2.5
                                bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400
                                dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder-slate-500
                                focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                     placeholder={t.authEmailPh} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-200">{t.authPassword}</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input type="password" required value={password}
                     onChange={(e) => { setPassword(e.target.value); if (error) clearError(); }}
                     className="w-full rounded-md pl-10 pr-4 py-2.5
                                bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400
                                dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder-slate-500
                                focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                     placeholder={t.authPasswordPh} />
            </div>
          </div>

          <button type="submit" disabled={submitting}
                  className="w-full font-semibold py-2.5 rounded-md transition-colors cursor-pointer
                             bg-sky-600 hover:bg-sky-700 text-white
                             dark:bg-sky-600 dark:hover:bg-sky-500 dark:text-white
                             disabled:opacity-50 disabled:cursor-not-allowed">
            {submitting ? t.authLoggingIn : t.authLogIn}
          </button>
        </form>

        <p className="text-center text-sm mt-6 text-slate-500 dark:text-slate-400">
          {t.authNoAccount}{' '}
          <Link to="/signup" className="font-medium text-sky-700 hover:text-sky-900 dark:text-sky-400 dark:hover:text-sky-300">{t.navSignUp}</Link>
        </p>
      </div>
    </div>
  );
}
