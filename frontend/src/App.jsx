import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, Loader2, CheckCircle, Globe, Briefcase, MessageCircle, Send, X, Bot, Languages, Search, MapPin, DollarSign, ExternalLink, Building, Lightbulb } from 'lucide-react';

const translations = {
  en: {
    title: "Immigration Job Matcher",
    subtitle: "Upload your resume and let AI find your perfect job match",
    uploadResume: "Upload Your Resume",
    uploadHint: "PDF, Word, or Image • Any Language",
    analyzeButton: "Analyze Resume",
    analyzing: "Analyzing Resume...",
    analysisComplete: "Analysis Complete!",
    originalLanguage: "Original Language",
    skills: "Skills",
    experience: "Experience",
    education: "Education",
    usEquivalents: "US Equivalents & Recommendations",
    degreeEquivalent: "Degree Equivalent",
    recommendedCerts: "Recommended Certifications",
    recommendedJobs: "Recommended Job Titles",
    suggestions: "Suggestions for US Employers",
    chatTitle: "Job Search Assistant",
    chatSubtitle: "Always here to help",
    chatPlaceholder: "Ask me anything...",
    chatWelcome: "Hello! I'm your job search assistant.",
    matchingJobs: "Matching Jobs for You",
    searchingJobs: "Searching for jobs...",
    viewJob: "View Job",
    noJobsFound: "No jobs found.",
    languageName: "English"
  },
  es: {
    title: "Buscador de Empleos para Inmigrantes",
    subtitle: "Sube tu currículum y deja que la IA encuentre tu trabajo ideal",
    uploadResume: "Subir Currículum",
    uploadHint: "PDF, Word o Imagen • Cualquier Idioma",
    analyzeButton: "Analizar Currículum",
    analyzing: "Analizando Currículum...",
    analysisComplete: "¡Análisis Completado!",
    originalLanguage: "Idioma Original",
    skills: "Habilidades",
    experience: "Experiencia",
    education: "Educación",
    usEquivalents: "Equivalentes en EE. UU. y Recomendaciones",
    degreeEquivalent: "Equivalente de Título",
    recommendedCerts: "Certificaciones Recomendadas",
    recommendedJobs: "Títulos de Trabajo Recomendados",
    suggestions: "Sugerencias para Empleadores de EE. UU.",
    chatTitle: "Asistente de Búsqueda de Empleo",
    chatSubtitle: "Siempre aquí para ayudar",
    chatPlaceholder: "Pregúntame lo que sea...",
    chatWelcome: "¡Hola! Soy tu asistente de búsqueda de empleo.",
    matchingJobs: "Empleos para Ti",
    searchingJobs: "Buscando empleos...",
    viewJob: "Ver Empleo",
    noJobsFound: "No se encontraron empleos.",
    languageName: "Spanish"
  },
  fr: {
    title: "Recherche d'Emploi pour Immigrés",
    subtitle: "Téléchargez votre CV et laissez l'IA trouver votre emploi idéal",
    uploadResume: "Télécharger le CV",
    uploadHint: "PDF, Word ou Image • Toute Langue",
    analyzeButton: "Analyser le CV",
    analyzing: "Analyse du CV...",
    analysisComplete: "Analyse Terminée !",
    originalLanguage: "Langue Originale",
    skills: "Compétences",
    experience: "Expérience",
    education: "Éducation",
    usEquivalents: "Équivalents US et Recommandations",
    degreeEquivalent: "Équivalent du Diplôme",
    recommendedCerts: "Certifications Recommandées",
    recommendedJobs: "Titres de Postes Recommandés",
    suggestions: "Suggestions pour les Employeurs US",
    chatTitle: "Assistant Recherche d'Emploi",
    chatSubtitle: "Toujours là pour vous aider",
    chatPlaceholder: "Posez-moi une question...",
    chatWelcome: "Bonjour ! Je suis votre assistant de recherche d'emploi.",
    matchingJobs: "Emplois correspondants",
    searchingJobs: "Recherche d'emplois...",
    viewJob: "Voir l'Offre",
    noJobsFound: "Aucun emploi trouvé.",
    languageName: "French"
  },
  ar: {
    title: "متطابق وظائف المهاجرين",
    subtitle: "ارفع سيرتك الذاتية ودع الذكاء الاصطناعي يجد لك الوظيفة المثالية",
    uploadResume: "تحميل السيرة الذاتية",
    uploadHint: "PDF أو Word أو صورة • أي لغة",
    analyzeButton: "تحليل السيرة الذاتية",
    analyzing: "جاري تحليل السيرة الذاتية...",
    analysisComplete: "اكتمل التحليل!",
    originalLanguage: "اللغة الأصلية",
    skills: "المهارات",
    experience: "الخبرة",
    education: "التعليم",
    usEquivalents: "المعادلات والتوصيات في الولايات المتحدة",
    degreeEquivalent: "معادل الشهادة",
    recommendedCerts: "الشهادات الموصى بها",
    recommendedJobs: "المسميات الوظيفية الموصى بها",
    suggestions: "اقتراحات لأصحاب العمل في الولايات المتحدة",
    chatTitle: "مساعد البحث عن وظيفة",
    chatSubtitle: "هنا للمساعدة دائماً",
    chatPlaceholder: "اسألني عن أي شيء...",
    chatWelcome: "مرحباً! أنا مساعدك في البحث عن وظيفة.",
    matchingJobs: "وظائف مطابقة لك",
    searchingJobs: "جاري البحث عن وظائف...",
    viewJob: "عرض الوظيفة",
    noJobsFound: "لم يتم العثور على وظائف.",
    languageName: "Arabic"
  },
  zh: {
    title: "移民职位匹配器",
    subtitle: "上传您的简历，让人工智能为您找到完美的工作",
    uploadResume: "上传简历",
    uploadHint: "PDF、Word 或图片 • 任何语言",
    analyzeButton: "分析简历",
    analyzing: "正在分析简历...",
    analysisComplete: "分析完成！",
    originalLanguage: "原始语言",
    skills: "技能",
    experience: "工作经验",
    education: "教育背景",
    usEquivalents: "美国学历认证与建议",
    degreeEquivalent: "学位等效",
    recommendedCerts: "推荐证书",
    recommendedJobs: "推荐职位名称",
    suggestions: "对美国雇主的建议",
    chatTitle: "求职助手",
    chatSubtitle: "随时为您提供帮助",
    chatPlaceholder: "问我任何问题...",
    chatWelcome: "您好！我是您的求职助手。",
    matchingJobs: "为您匹配的职位",
    searchingJobs: "正在搜索职位...",
    viewJob: "查看职位",
    noJobsFound: "未找到职位。",
    languageName: "Chinese"
  },
  hi: {
    title: "प्रवासी जॉब मैचर",
    subtitle: "अपना रिज्यूमे अपलोड करें और AI को आपके लिए सही जॉब खोजने दें",
    uploadResume: "रिज्यूमे अपलोड करें",
    uploadHint: "PDF, Word या इमेज • कोई भी भाषा",
    analyzeButton: "रिज्यूमे का विश्लेषण करें",
    analyzing: "रिज्यूमे का विश्लेषण किया जा रहा है...",
    analysisComplete: "विश्लेषण पूरा हुआ!",
    originalLanguage: "मूल भाषा",
    skills: "कौशल",
    experience: "अनुभव",
    education: "शिक्षा",
    usEquivalents: "अमेरिकी समकक्ष और सिफारिशें",
    degreeEquivalent: "डिग्री समकक्ष",
    recommendedCerts: "अनुशंसित प्रमाणन",
    recommendedJobs: "अनुशंसित जॉब टाइटल्स",
    suggestions: "अमेरिकी नियोक्ताओं के लिए सुझाव",
    chatTitle: "जॉब सर्च असिस्टेंट",
    chatSubtitle: "हमेशा आपकी मदद के लिए यहाँ है",
    chatPlaceholder: "मुझसे कुछ भी पूछें...",
    chatWelcome: "नमस्ते! मैं आपका जॉब सर्च असिस्टेंट हूँ।",
    matchingJobs: "आपके लिए मेल खाने वाली नौकरियां",
    searchingJobs: "नौकरियां खोजी जा रही हैं...",
    viewJob: "जॉब देखें",
    noJobsFound: "कोई नौकरी नहीं मिली।",
    languageName: "Hindi"
  }
};

const stripHtml = (html) => {
  if (!html) return 'No description available';
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  return tempDiv.textContent || tempDiv.innerText || '';
};

export default function ResumeAnalyzer() {
  const [language, setLanguage] = useState('en');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);

  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);

  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const t = translations[language];

  useEffect(() => {
    setMessages([{ role: 'assistant', content: t.chatWelcome }]);
  }, [language]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileUpload = async (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setError(null);
    setAnalysis(null);
    setJobs([]);
  };

  const analyzeResume = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('language', t.languageName);

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/analyze-resume`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze resume');
      }

      setAnalysis(data.analysis);

      if (data.analysis.recommendedJobTitles && data.analysis.recommendedJobTitles.length > 0) {
        await searchJobs(data.analysis.recommendedJobTitles);
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.message || 'Failed to analyze resume. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const searchJobs = async (jobTitles) => {
    setJobsLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/search-jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jobTitles }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setJobs(data.jobs);
      }
    } catch (err) {
      console.error('Job search error:', err);
    } finally {
      setJobsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || chatLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');

    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatLoading(true);

    try {
      const userProfile = analysis ? {
        name: analysis.name,
        skills: analysis.skills.join(', '),
        experience: analysis.experience.map(e => e.title).join(', '),
        recommendedJobs: analysis.recommendedJobTitles.join(', ')
      } : null;

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messages.concat([{ role: 'user', content: userMessage }]),
          language: t.languageName,
          userProfile
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatSalary = (salary) => {
    if (!salary) return 'Not specified';
    const min = salary.min ? `$${Math.round(salary.min).toLocaleString()}` : '';
    const max = salary.max ? `$${Math.round(salary.max).toLocaleString()}` : '';
    if (min && max) return `${min} - ${max}`;
    if (min) return `From ${min}`;
    if (max) return `Up to ${max}`;
    return 'Not specified';
  };

  return (
    <div dir={language === 'ar' ? 'rtl' : 'ltr'} style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #0c4a6e 100%)', padding: '2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '0.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', padding: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Languages style={{ width: '1.25rem', height: '1.25rem', color: '#1e40af' }} />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={{ background: 'transparent', border: 'none', outline: 'none', cursor: 'pointer', color: '#1f2937', fontWeight: '500' }}
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="ar">العربية</option>
              <option value="zh">中文</option>
              <option value="hi">हिन्दी</option>
            </select>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Globe style={{ width: '2.5rem', height: '2.5rem', color: 'white' }} />
            <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'white', margin: 0 }}>{t.title}</h1>
          </div>
          <p style={{ color: 'white', fontSize: '1.125rem' }}>{t.subtitle}</p>
        </div>

        <div style={{ background: 'white', borderRadius: '0.5rem', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', padding: '2rem', marginBottom: '1.5rem' }}>
          <div style={{ border: '2px dashed #93c5fd', borderRadius: '0.5rem', padding: '2rem', textAlign: 'center', transition: 'all 0.3s' }}>
            <input
              type="file"
              id="resume-upload"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            <label htmlFor="resume-upload" style={{ cursor: 'pointer' }}>
              <Upload style={{ width: '4rem', height: '4rem', margin: '0 auto 1rem', color: '#9ca3af', display: 'block' }} />
              <p style={{ fontSize: '1.125rem', fontWeight: '500', color: '#1f2937', marginBottom: '0.5rem' }}>
                {file ? file.name : t.uploadResume}
              </p>
              <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                {t.uploadHint}
              </p>
            </label>
          </div>

          {file && !analysis && (
            <button
              onClick={analyzeResume}
              disabled={loading}
              style={{
                width: '100%',
                marginTop: '1.5rem',
                background: loading ? '#9ca3af' : 'linear-gradient(to right, #1e40af, #3b82f6)',
                color: 'white',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                fontWeight: '500',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                fontSize: '1rem'
              }}
            >
              {loading ? (
                <>
                  <Loader2 style={{ width: '1.25rem', height: '1.25rem', animation: 'spin 1s linear infinite' }} />
                  {t.analyzing}
                </>
              ) : (
                <>
                  <FileText style={{ width: '1.25rem', height: '1.25rem' }} />
                  {t.analyzeButton}
                </>
              )}
            </button>
          )}

          {error && (
            <div style={{ marginTop: '1rem', padding: '1rem', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '0.5rem', color: '#991b1b' }}>
              {error}
            </div>
          )}
        </div>

        {analysis && (
          <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth > 1024 ? '1fr 1fr' : '1fr', gap: '1.5rem' }}>
            <div style={{ background: 'white', borderRadius: '0.5rem', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', padding: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', marginBottom: '1rem' }}>
                <CheckCircle style={{ width: '1.5rem', height: '1.5rem' }} />
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>{t.analysisComplete}</h2>
              </div>

              <div style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.5rem' }}>{analysis.name}</h3>
                <p style={{ color: '#6b7280' }}>{analysis.summary}</p>
                {analysis.originalLanguage && analysis.originalLanguage !== 'English' && (
                  <p style={{ fontSize: '0.875rem', color: '#3b82f6', marginTop: '0.5rem' }}>
                    {t.originalLanguage}: {analysis.originalLanguage}
                  </p>
                )}
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.75rem' }}>{t.skills}</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {analysis.skills?.map((skill, idx) => (
                    <span key={idx} style={{ background: '#dbeafe', color: '#1e40af', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.875rem' }}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.75rem' }}>{t.experience}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {analysis.experience?.map((exp, idx) => (
                    <div key={idx} style={{ borderLeft: '4px solid #3b82f6', paddingLeft: '1rem' }}>
                      <p style={{ fontWeight: '500', color: '#1f2937', margin: '0 0 0.25rem 0' }}>{exp.title}</p>
                      <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 0.25rem 0' }}>{exp.company} • {exp.duration}</p>
                      <p style={{ fontSize: '0.875rem', color: '#4b5563', margin: 0 }}>{exp.responsibilities}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.75rem' }}>{t.education}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {analysis.education?.map((edu, idx) => (
                    <div key={idx}>
                      <p style={{ fontWeight: '500', color: '#1f2937', margin: '0 0 0.25rem 0' }}>{edu.degree}</p>
                      <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>{edu.institution} • {edu.year}</p>
                    </div>
                  ))}
                </div>
              </div>

              {analysis.usEquivalents && (
                <div style={{ background: '#dbeafe', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.75rem' }}>{t.usEquivalents}</h3>
                  {analysis.usEquivalents.degreeEquivalent && (
                    <p style={{ fontSize: '0.875rem', color: '#1f2937', marginBottom: '0.5rem' }}>
                      <strong>{t.degreeEquivalent}:</strong> {analysis.usEquivalents.degreeEquivalent}
                    </p>
                  )}
                  {analysis.usEquivalents.certifications && (
                    <p style={{ fontSize: '0.875rem', color: '#1f2937', margin: 0 }}>
                      <strong>{t.recommendedCerts}:</strong> {analysis.usEquivalents.certifications}
                    </p>
                  )}
                </div>
              )}

              {analysis.suggestionsForUS && analysis.suggestionsForUS.length > 0 && (
                <div style={{ background: '#fef3c7', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <Lightbulb style={{ width: '1.25rem', height: '1.25rem', color: '#f59e0b' }} />
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>{t.suggestions}</h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {analysis.suggestionsForUS.map((suggestion, idx) => (
                      <div key={idx}>
                        <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#92400e', margin: '0 0 0.25rem 0' }}>{suggestion.category}</p>
                        <p style={{ fontSize: '0.875rem', color: '#78350f', margin: 0 }}>{suggestion.suggestion}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <Briefcase style={{ width: '1.25rem', height: '1.25rem', color: '#3b82f6' }} />
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>{t.recommendedJobs}</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {analysis.recommendedJobTitles?.map((title, idx) => (
                    <div key={idx} style={{ background: 'linear-gradient(to right, #3b82f6, #2563eb)', color: 'white', padding: '0.75rem', borderRadius: '0.5rem', textAlign: 'center', fontWeight: '500' }}>
                      {title}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ background: 'white', borderRadius: '0.5rem', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', padding: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <Search style={{ width: '1.5rem', height: '1.5rem', color: '#3b82f6' }} />
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>{t.matchingJobs}</h2>
              </div>

              {jobsLoading && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 0' }}>
                  <Loader2 style={{ width: '2rem', height: '2rem', color: '#3b82f6', animation: 'spin 1s linear infinite' }} />
                  <span style={{ marginLeft: '0.75rem', color: '#6b7280' }}>{t.searchingJobs}</span>
                </div>
              )}

              {!jobsLoading && jobs.length === 0 && (
                <div style={{ textAlign: 'center', padding: '3rem 0', color: '#6b7280' }}>
                  {t.noJobsFound}
                </div>
              )}

              <div style={{ maxHeight: '800px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {jobs.map((job, idx) => (
                  <div key={idx} style={{ border: '1px solid #e5e7eb', borderRadius: '0.5rem', padding: '1rem', transition: 'all 0.3s' }}>
                    <h3 style={{ fontWeight: '600', color: '#1f2937', marginBottom: '0.5rem' }}>{job.title}</h3>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                      <Building style={{ width: '1rem', height: '1rem' }} />
                      <span>{job.company.display_name}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                      <MapPin style={{ width: '1rem', height: '1rem' }} />
                      <span>{job.location.display_name}</span>
                    </div>

                    {job.salary_min && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#10b981', marginBottom: '0.75rem' }}>
                        <DollarSign style={{ width: '1rem', height: '1rem' }} />
                        <span style={{ fontWeight: '500' }}>{formatSalary({ min: job.salary_min, max: job.salary_max })}</span>
                      </div>
                    )}

                    <p style={{ fontSize: '0.875rem', color: '#4b5563', marginBottom: '0.75rem' }}>
                      {stripHtml(job.description).substring(0, 150)}...
                    </p>


                    <a
                      href={job.redirect_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        background: 'linear-gradient(to right, #3b82f6, #2563eb)',
                        color: 'white',
                        padding: '0.5rem 1rem',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        textDecoration: 'none',
                        transition: 'all 0.3s'
                      }}
                    >
                      {t.viewJob}
                      <ExternalLink style={{ width: '1rem', height: '1rem' }} />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {
        !chatOpen && (
          <button
            onClick={() => setChatOpen(true)}
            style={{
              position: 'fixed',
              bottom: '1.5rem',
              right: '1.5rem',
              background: 'linear-gradient(to right, #3b82f6, #2563eb)',
              color: 'white',
              padding: '1rem',
              borderRadius: '9999px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
              transition: 'all 0.3s'
            }}
          >
            <MessageCircle style={{ width: '1.5rem', height: '1.5rem' }} />
          </button>
        )
      }

      {
        chatOpen && (
          <div style={{
            position: 'fixed',
            bottom: '1.5rem',
            right: '1.5rem',
            width: '384px',
            height: '600px',
            background: 'white',
            borderRadius: '0.75rem',
            boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 50
          }}>
            <div style={{
              background: 'linear-gradient(to right, #3b82f6, #2563eb)',
              color: 'white',
              padding: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Bot style={{ width: '1.5rem', height: '1.5rem' }} />
                <div>
                  <h3 style={{ fontWeight: '600', margin: 0 }}>{t.chatTitle}</h3>
                  <p style={{ fontSize: '0.75rem', color: '#dbeafe', margin: 0 }}>{t.chatSubtitle}</p>
                </div>
              </div>
              <button
                onClick={() => setChatOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: '0.25rem' }}
              >
                <X style={{ width: '1.25rem', height: '1.25rem' }} />
              </button>
            </div>

            <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {messages.map((msg, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '80%',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    background: msg.role === 'user' ? '#3b82f6' : '#f3f4f6',
                    color: msg.role === 'user' ? 'white' : '#1f2937'
                  }}>
                    <p style={{ fontSize: '0.875rem', whiteSpace: 'pre-wrap', margin: 0 }}>{msg.content}</p>
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{ background: '#f3f4f6', padding: '0.75rem', borderRadius: '0.5rem' }}>
                    <Loader2 style={{ width: '1.25rem', height: '1.25rem', color: '#3b82f6', animation: 'spin 1s linear infinite' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div style={{ borderTop: '1px solid #e5e7eb', padding: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={t.chatPlaceholder}
                  disabled={chatLoading}
                  style={{
                    flex: 1,
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    padding: '0.5rem 1rem',
                    outline: 'none',
                    fontSize: '0.875rem'
                  }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || chatLoading}
                  style={{
                    background: (!inputMessage.trim() || chatLoading) ? '#9ca3af' : 'linear-gradient(to right, #3b82f6, #2563eb)',
                    color: 'white',
                    padding: '0.5rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    cursor: (!inputMessage.trim() || chatLoading) ? 'not-allowed' : 'pointer'
                  }}
                >
                  <Send style={{ width: '1.25rem', height: '1.25rem' }} />
                </button>
              </div>
            </div>
          </div>
        )
      }

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}