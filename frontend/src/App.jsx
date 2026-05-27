import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useAuth } from './store/auth';
import { useTheme } from './store/theme';
import { useLang } from './store/lang';

import Navbar from './components/Navbar';
import Home from './components/Home';
import Analyzer from './components/Analyzer';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Resumes from './pages/Resumes';
import Jobs from './pages/Jobs';
import Editor from './pages/Editor';

export default function App() {
  const initAuth = useAuth(s => s.init);
  const initTheme = useTheme(s => s.init);
  // Read the current language so we can set the document direction
  // attribute (Arabic is the only RTL language we support today).
  const lang = useLang(s => s.lang);

  useEffect(() => { initAuth(); initTheme(); }, [initAuth, initTheme]);

  return (
    <Router basename={import.meta.env.BASE_URL}>
      <div className="app-container min-h-screen pb-20" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <Navbar />
        {/* Layout: just top-padding to clear the fixed Navbar.
            Each page sets its own max-width and horizontal padding. */}
        <main className="pt-16">
          <Routes>
            <Route path="/"        element={<Home />} />
            <Route path="/login"   element={<Login />} />
            <Route path="/signup"  element={<Signup />} />
            <Route path="/analyze" element={<ProtectedRoute><Analyzer /></ProtectedRoute>} />
            <Route path="/resumes" element={<ProtectedRoute><Resumes /></ProtectedRoute>} />
            <Route path="/jobs"    element={<ProtectedRoute><Jobs /></ProtectedRoute>} />
            <Route path="/editor"  element={<ProtectedRoute><Editor /></ProtectedRoute>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
