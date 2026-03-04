import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { translations } from './constants';

// Component Imports
import Navbar from './components/Navbar';
import Home from './components/Home';
import Analyzer from './components/Analyzer';

export default function App() {
  const [language, setLanguage] = useState('en');
  const t = translations[language];

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
            <Route
              path="/analyze"
              element={
                <Analyzer
                  language={language}
                  t={t}
                  translations={translations}
                  setLanguage={setLanguage}
                />
              }
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}