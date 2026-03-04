import React, { useState, useEffect } from 'react';
import ResumeUpload from './ResumeUpload';
import AnalysisResults from './AnalysisResults';
import JobMatches from './JobMatches';
import ChatWidget from './ChatWidget';

const stripHtml = (html) => {
    if (!html) return 'No description available';
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || '';
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

export default function Analyzer({ language, t, translations, setLanguage }) {
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

    useEffect(() => {
        setMessages([{ role: 'assistant', content: t.chatWelcome }]);
    }, [language, t.chatWelcome]);

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

            const apiUrl = import.meta.env.VITE_API_URL || 'https://employai.onrender.com';
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
            const apiUrl = import.meta.env.VITE_API_URL || 'https://employai.onrender.com';
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

            const apiUrl = import.meta.env.VITE_API_URL || 'https://employai.onrender.com';
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

    return (
        <>
            <ResumeUpload
                file={file}
                handleFileUpload={handleFileUpload}
                analyzeResume={analyzeResume}
                loading={loading}
                t={t}
            />

            {error && (
                <div className="max-w-3xl mx-auto mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-center animate-in shake duration-500">
                    {error}
                </div>
            )}

            {analysis && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                    <AnalysisResults analysis={analysis} t={t} />
                    <JobMatches
                        jobs={jobs}
                        loading={jobsLoading}
                        t={t}
                        formatSalary={formatSalary}
                        stripHtml={stripHtml}
                    />
                </div>
            )}

            <ChatWidget
                chatOpen={chatOpen}
                setChatOpen={setChatOpen}
                messages={messages}
                inputMessage={inputMessage}
                setInputMessage={setInputMessage}
                handleKeyPress={handleKeyPress}
                sendMessage={sendMessage}
                chatLoading={chatLoading}
                t={t}
            />
        </>
    );
}
