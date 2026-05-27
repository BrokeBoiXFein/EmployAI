import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, ChevronDown, FolderOpen, Lightbulb, X, MessageCircle, Sparkles } from 'lucide-react';
import ResumeUpload from './ResumeUpload';
import AnalysisResults from './AnalysisResults';
import JobMatches from './JobMatches';
import ChatWidget from './ChatWidget';
import { api } from '../services/api';

// Read what the user typed on the Home page (if anything) and stash here.
// Keep in sync with Home.jsx's INTENT_KEY constant.
const INTENT_KEY = 'employai_intent';

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

    // The user's typed intent (from Home). If present, gets blended with
    // the resume embedding server-side to bias the matches.
    const [focusText, setFocusText] = useState(() => {
        try { return localStorage.getItem(INTENT_KEY) || ''; } catch { return ''; }
    });

    // Chat state
    const [chatOpen, setChatOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [chatLoading, setChatLoading] = useState(false);

    // "Low match" coach banner — shown when the top job match falls below
    // our threshold. Dismissed per session so the user isn't nagged.
    const LOW_MATCH_THRESHOLD = 0.55;
    const [bannerDismissed, setBannerDismissed] = useState(false);
    const topScore = jobs[0]?.matchScore;
    const showLowMatchBanner = (
        !bannerDismissed &&
        !jobsLoading &&
        jobs.length > 0 &&
        typeof topScore === 'number' &&
        topScore < LOW_MATCH_THRESHOLD
    );

    // Reset dismissal whenever we run a new search — if their next resume
    // also has low matches, we want to offer help again.
    useEffect(() => { setBannerDismissed(false); }, [activeResumeId]);

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

    // Backend: looks up resume by id, uses its embedding (optionally blended
    // with the user's typed intent) to score & sort Adzuna jobs by semantic
    // similarity. Returns jobs[].matchScore in [-1, 1].
    const searchJobs = async (resumeId, intentOverride) => {
        if (!resumeId) return;
        setJobsLoading(true);
        try {
            // Allow explicit override (e.g. when clearing the chip) so we
            // don't race the focusText state update.
            const focus = intentOverride !== undefined ? intentOverride : focusText;
            const data = await api.post('/api/search-jobs', {
                resumeId,
                focusText: focus || undefined
            });
            if (data.success) setJobs(data.jobs);
        } catch (err) {
            console.error('Job search error:', err);
        } finally {
            setJobsLoading(false);
        }
    };

    const clearIntent = () => {
        try { localStorage.removeItem(INTENT_KEY); } catch { /* ignore */ }
        setFocusText('');
        // Re-run search without the intent bias so the user sees the
        // change immediately
        if (activeResumeId) searchJobs(activeResumeId, '');
    };

    // Accepts an optional explicit text. When called without args, falls back
    // to the input-field contents (default ChatWidget behavior). This lets
    // the low-match banner trigger a sendMessage without typing through the input.
    const sendMessage = async (text) => {
        const userMessage = (typeof text === 'string' ? text : inputMessage).trim();
        if (!userMessage || chatLoading) return;
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

    // Open the chat widget AND send a specific message. Used by the
    // low-match banner — opens the widget first so the user sees the
    // exchange happen, then fires the coaching prompt.
    const askChatForHelp = (pct) => {
        const topTitle = jobs[0]?.title ? ` (top match was "${jobs[0].title}")` : '';
        const prompt =
            `My best job match is only ${pct}%${topTitle}. What specific changes should I make ` +
            `to my resume — and what alternative job titles should I consider — to find better-fitting jobs?`;
        setChatOpen(true);
        sendMessage(prompt);
        setBannerDismissed(true); // hide the banner once they've engaged
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-20">
            {/* Switcher — only shown if the user has at least one resume */}
            {resumes.length > 0 && (
                <div className="max-w-3xl mx-auto mb-6 flex flex-wrap items-center gap-3 px-4 py-3 rounded-2xl
                                bg-white border border-slate-200
                                dark:bg-slate-900 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <FileText className="w-4 h-4 text-sky-700 dark:text-sky-400" />
                        Active resume:
                    </div>
                    <div className="relative flex-1 min-w-[180px]">
                        <select value={activeResumeId || ''}
                                onChange={(e) => switchActive(e.target.value)}
                                className="w-full appearance-none rounded-xl pl-3 pr-9 py-2 text-sm cursor-pointer
                                           bg-slate-50 border border-slate-200 text-slate-900
                                           dark:bg-slate-800 dark:border-slate-700 dark:text-white
                                           focus:outline-none focus:ring-2 focus:ring-sky-500">
                            {!activeResumeId && <option value="">— pick a resume —</option>}
                            {resumes.map(r => (
                                <option key={r.id} value={r.id} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">{r.label}</option>
                            ))}
                        </select>
                        <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
                    </div>
                    <Link to="/resumes"
                          className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl transition-colors cursor-pointer
                                     text-slate-600 hover:text-slate-900 hover:bg-slate-100
                                     dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800">
                        <FolderOpen className="w-4 h-4" />
                        Manage
                    </Link>
                </div>
            )}

            {/* Intent chip — appears if the user typed something on Home.
                Shows what we're biasing matches toward, with a dismiss button. */}
            {focusText && (
                <div className="max-w-3xl mx-auto mb-6 flex items-center gap-3 px-4 py-3 rounded-2xl
                                bg-sky-50 border border-sky-200
                                dark:bg-sky-500/10 dark:border-sky-500/30">
                    <Sparkles className="w-4 h-4 text-sky-700 dark:text-sky-400 shrink-0" />
                    <div className="flex-1 text-sm min-w-0">
                        <span className="font-semibold text-sky-900 dark:text-sky-200">Biasing matches toward:</span>{' '}
                        <span className="text-sky-800 dark:text-sky-100 italic">"{focusText}"</span>
                    </div>
                    <button
                        onClick={clearIntent}
                        className="p-1.5 rounded-lg text-sky-700 hover:text-sky-900 hover:bg-sky-100
                                   dark:text-sky-400 dark:hover:text-white dark:hover:bg-sky-500/20
                                   transition-colors cursor-pointer shrink-0"
                        title="Clear intent and re-rank"
                    >
                        <X className="w-4 h-4" />
                    </button>
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
                <div className="max-w-3xl mx-auto mb-8 p-4 rounded-2xl text-center
                                bg-red-50 border border-red-200 text-red-700
                                dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-300">
                    {error}
                </div>
            )}

            {showLowMatchBanner && (
                <div className="max-w-5xl mx-auto mb-6 flex items-start gap-3 p-4 rounded-2xl
                                bg-amber-50 border border-amber-200
                                dark:bg-amber-500/10 dark:border-amber-500/30">
                    <div className="p-2 rounded-xl shrink-0
                                    bg-amber-100 text-amber-700
                                    dark:bg-amber-500/20 dark:text-amber-300">
                        <Lightbulb className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-amber-900 dark:text-amber-100">
                            Your top match is only {Math.max(0, Math.round(topScore * 100))}%.
                        </p>
                        <p className="text-sm mt-0.5 text-amber-800 dark:text-amber-200/80">
                            Want the AI assistant to suggest specific resume tweaks or alternative job titles to explore?
                        </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => askChatForHelp(Math.max(0, Math.round(topScore * 100)))}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold transition-colors cursor-pointer
                                           bg-amber-500 hover:bg-amber-600 text-amber-950
                                           dark:bg-amber-500 dark:hover:bg-amber-400">
                            <MessageCircle className="w-4 h-4" />
                            Get tips
                        </button>
                        <button onClick={() => setBannerDismissed(true)}
                                className="p-2 rounded-xl transition-colors cursor-pointer
                                           text-amber-700 hover:text-amber-900 hover:bg-amber-100
                                           dark:text-amber-300 dark:hover:text-white dark:hover:bg-amber-500/20"
                                title="Dismiss">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
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
        </div>
    );
}
