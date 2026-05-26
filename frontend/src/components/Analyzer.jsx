import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, ChevronDown, FolderOpen } from 'lucide-react';
import ResumeUpload from './ResumeUpload';
import AnalysisResults from './AnalysisResults';
import JobMatches from './JobMatches';
import ChatWidget from './ChatWidget';
import { api } from '../services/api';

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
    // Upload state
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Resume library + active selection
    const [resumes, setResumes] = useState([]);
    const [activeResumeId, setActiveResumeId] = useState(null);

    // Derived: the currently active resume object (or null)
    const activeResume = resumes.find(r => r.id === activeResumeId) || null;
    const analysis = activeResume?.parsedData || null;

    // Jobs come from /api/search-jobs — depend on the active resume's titles
    const [jobs, setJobs] = useState([]);
    const [jobsLoading, setJobsLoading] = useState(false);

    // Track which Adzuna job ids the user has saved or applied to, so the
    // JobMatches cards can render the right state. Using Sets for O(1) lookup.
    const [savedIds, setSavedIds] = useState(() => new Set());
    const [appliedIds, setAppliedIds] = useState(() => new Set());

    // Chat state
    const [chatOpen, setChatOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [chatLoading, setChatLoading] = useState(false);

    useEffect(() => {
        setMessages([{ role: 'assistant', content: t.chatWelcome }]);
    }, [language, t.chatWelcome]);

    // On mount: load the user's resume library + saved/applied lists.
    // Running in parallel — none of them depend on each other.
    useEffect(() => {
        (async () => {
            try {
                const [resumesRes, savedRes, appsRes] = await Promise.all([
                    api.get('/api/resumes'),
                    api.get('/api/saved').catch(() => ({ savedJobs: [] })),
                    api.get('/api/applications').catch(() => ({ applications: [] }))
                ]);
                setResumes(resumesRes.resumes);
                setActiveResumeId(resumesRes.activeResumeId);
                setSavedIds(new Set(savedRes.savedJobs.map(j => j.adzunaId)));
                setAppliedIds(new Set(appsRes.applications.map(a => a.adzunaId)));

                if (resumesRes.activeResumeId) await searchJobs(resumesRes.activeResumeId);
            } catch (err) {
                console.warn('Initial load failed:', err.message);
            }
        })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ----- Save / Apply handlers ---------------------------------
    // Optimistic UI: we update the Set first, then call the API. If
    // the API fails, we revert. Feels instant to the user.

    const toggleSave = async (job) => {
        const id = String(job.id);
        const isSaved = savedIds.has(id);
        // Optimistic toggle
        setSavedIds(prev => {
            const next = new Set(prev);
            if (isSaved) next.delete(id); else next.add(id);
            return next;
        });
        try {
            if (isSaved) {
                await api.del(`/api/saved/by-adzuna/${id}`);
            } else {
                await api.post('/api/saved', {
                    adzunaId: id,
                    title: job.title,
                    company: job.company?.display_name || null,
                    location: job.location?.display_name || null,
                    salaryMin: job.salary_min ?? null,
                    salaryMax: job.salary_max ?? null,
                    description: stripHtml(job.description).slice(0, 1000),
                    applyUrl: job.redirect_url,
                    matchScore: typeof job.matchScore === 'number' ? job.matchScore : null
                });
            }
        } catch (err) {
            // Revert on failure
            console.error('Save toggle error:', err);
            setSavedIds(prev => {
                const next = new Set(prev);
                if (isSaved) next.add(id); else next.delete(id);
                return next;
            });
        }
    };

    const markApplied = async (job) => {
        const id = String(job.id);
        if (appliedIds.has(id)) return; // already applied — no-op
        setAppliedIds(prev => new Set(prev).add(id)); // optimistic
        try {
            await api.post('/api/applications', {
                adzunaId: id,
                title: job.title,
                company: job.company?.display_name || null,
                applyUrl: job.redirect_url
            });
        } catch (err) {
            console.error('Mark applied error:', err);
            setAppliedIds(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    };

    const handleFileUpload = async (e) => {
        const uploadedFile = e.target.files[0];
        if (!uploadedFile) return;
        setFile(uploadedFile);
        setError(null);
    };

    const analyzeResume = async () => {
        if (!file) return;
        setLoading(true);
        setError(null);
        try {
            const formData = new FormData();
            formData.append('resume', file);
            formData.append('language', t.languageName);

            // POST to /api/resumes creates a new Resume row + returns analysis.
            // If it's the user's first resume, it's auto-activated.
            const data = await api.postFormData('/api/resumes', formData);

            // Add the new resume to the top of the list
            setResumes(prev => [data.resume, ...prev]);

            // If it became the active one (only happens for the first upload OR
            // if it returned activeResumeId), switch the display to it
            if (data.becameActive) {
                setActiveResumeId(data.resume.id);
                await searchJobs(data.resume.id);
            }

            setFile(null);
        } catch (err) {
            console.error('Analysis error:', err);
            setError(err.message || 'Failed to analyze resume. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const switchActive = async (newId) => {
        if (newId === activeResumeId) return;
        try {
            await api.post(`/api/resumes/${newId}/activate`);
            setActiveResumeId(newId);
            setJobs([]);
            await searchJobs(newId);
        } catch (err) {
            console.error('Switch resume error:', err);
            setError(err.message);
        }
    };

    // Backend: looks up resume by id, uses its embedding to score & sort
    // jobs from Adzuna by semantic similarity. Returns jobs[].matchScore in [-1, 1].
    const searchJobs = async (resumeId) => {
        if (!resumeId) return;
        setJobsLoading(true);
        try {
            const data = await api.post('/api/search-jobs', { resumeId });
            if (data.success) setJobs(data.jobs);
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
                skills: (analysis.skills || []).join(', '),
                experience: (analysis.experience || []).map(e => e.title).join(', '),
                recommendedJobs: (analysis.recommendedJobTitles || []).join(', ')
            } : null;

            const data = await api.post('/api/chat', {
                messages: messages.concat([{ role: 'user', content: userMessage }]),
                language: t.languageName,
                userProfile
            });

            if (data.success) {
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
            {/* Switcher — only shown if the user has at least one resume */}
            {resumes.length > 0 && (
                <div className="max-w-3xl mx-auto mb-6 flex flex-wrap items-center gap-3 bg-indigo-950/60 border border-indigo-900/50 rounded-2xl px-4 py-3 backdrop-blur-md">
                    <div className="flex items-center gap-2 text-indigo-200/80 text-sm">
                        <FileText className="w-4 h-4 text-indigo-300" />
                        Active resume:
                    </div>
                    <div className="relative flex-1 min-w-[180px]">
                        <select
                            value={activeResumeId || ''}
                            onChange={(e) => switchActive(e.target.value)}
                            className="w-full appearance-none bg-indigo-900/40 border border-indigo-800/50 rounded-xl pl-3 pr-9 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                        >
                            {!activeResumeId && <option value="">— pick a resume —</option>}
                            {resumes.map(r => (
                                <option key={r.id} value={r.id} className="bg-indigo-950">{r.label}</option>
                            ))}
                        </select>
                        <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-indigo-300 pointer-events-none" />
                    </div>
                    <Link
                        to="/resumes"
                        className="flex items-center gap-1.5 text-sm text-indigo-300 hover:text-white px-3 py-2 rounded-xl hover:bg-white/5 transition"
                    >
                        <FolderOpen className="w-4 h-4" />
                        Manage
                    </Link>
                </div>
            )}

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
                        savedIds={savedIds}
                        appliedIds={appliedIds}
                        onToggleSave={toggleSave}
                        onMarkApplied={markApplied}
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
