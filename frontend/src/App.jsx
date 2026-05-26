import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { translations } from './constants';
import { useAuth } from './store/auth';

// Component Imports
import Navbar from './components/Navbar';
import Home from './components/Home';
import Analyzer from './components/Analyzer';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Resumes from './pages/Resumes';

export default function App() {
  const [language, setLanguage] = useState('en');
  const t = translations[language];
  const init = useAuth(s => s.init);

  // On first mount: if a token is in localStorage, hydrate the user
  useEffect(() => { init(); }, [init]);

  return (
    <Router basename={import.meta.env.BASE_URL}>
      <div className={`app-container min-h-screen pb-20`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <Navbar
          language={language}
          setLanguage={setLanguage}
          translations={translations}
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
          <Routes>
            <Route path="/" element={<Home t={t} />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup language={language} />} />
            <Route
              path="/analyze"
              element={
                <ProtectedRoute>
                  <Analyzer
                    language={language}
                    t={t}
                    translations={translations}
                    setLanguage={setLanguage}
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/resumes"
              element={
                <ProtectedRoute>
                  <Resumes />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
