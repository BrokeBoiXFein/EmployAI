// ============================================================
// Analyzer — the /analyze workspace
// ============================================================
// Layout when a resume is active:
//   ┌────────── Sticky toolbar (resume switcher + stats + actions) ──────────┐
//   ├─ Intent chip ──────────────────────────────────────────────────────────┤
//   ├─ Low-match banner (only if top score < 55%) ──────────────────────────┤
//   │  ┌──────────────────────┬──────────────────────────────────────┐      │
//   │  │ Resume profile       │ Matched jobs                          │      │
//   │  │ (sticky 420px sidebar)│ - sort tabs                          │      │
//   │  │                      │ - filter pills                       │      │
//   │  │                      │ - JobMatches cards                   │      │
//   │  └──────────────────────┴──────────────────────────────────────┘      │
//   └─ Floating chat widget ────────────────────────────────────────────────┘
//
// When no active resume exists, we show the big ResumeUpload form instead.
// ============================================================

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    FileText, ChevronDown, FolderOpen, Lightbulb, X, MessageCircle, Sparkles,
    RotateCcw, Wand2, Upload, Filter
} from 'lucide-react';
import ResumeUpload from './ResumeUpload';
import JobMatches from './JobMatches';
import ChatWidget from './ChatWidget';
import { api } from '../services/api';
import { useLang } from '../store/lang';

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

export default function Analyzer() {
    const t = useLang(s => s.t);
    const lang = useLang(s => s.lang);
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [resumes, setResumes] = useState([]);
    const [activeResumeId, setActiveResumeId] = useState(null);
    const activeResume = resumes.find(r => r.id === activeResumeId) || null;
    const analysis = activeResume?.parsedData || null;

    const [jobs, setJobs] = useState([]);
    const [jobsLoading, setJobsLoading] = useState(false);

    const [savedIds, setSavedIds] = useState(() => new Set());
    const [appliedIds, setAppliedIds] = useState(() => new Set());

    const [focusText, setFocusText] = useState(() => {
        try { return localStorage.getItem(INTENT_KEY) || ''; } catch { return ''; }
    });

    const [chatOpen, setChatOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [chatLoading, setChatLoading] = useState(false);

    // When the user already has an active resume, the workspace is the
    // primary view. Upload form is hidden by default, revealed via toggle.
    const [showUpload, setShowUpload] = useState(false);

    // ----- Sort & filter state (client-side, runs over the jobs array) -----
    // Sort: 'match' (default) | 'recent' | 'pay'
    const [sortBy, setSortBy] = useState('match');
    // Filters: each toggle is a boolean. AND'd together when computing visibleJobs.
    const [filters, setFilters] = useState({ remote: false, fullTime: false, minPay: false });
    const toggleFilter = (key) => setFilters(prev => ({ ...prev, [key]: !prev[key] }));

    // Derived: the jobs actually shown after filter+sort. Memoization not
    // worth it at this scale (< 50 jobs).
    const visibleJobs = (() => {
        let list = jobs;
        if (filters.remote) {
            // Adzuna has no canonical "remote" flag, so we substring-match
            // the location and title — covers the common phrasings.
            list = list.filter(j => {
                const hay = `${j.location?.display_name || ''} ${j.title || ''}`.toLowerCase();
                return hay.includes('remote');
            });
        }
        if (filters.fullTime) {
            // contract_time is Adzuna's enum: 'full_time' | 'part_time' (or absent)
            list = list.filter(j => j.contract_time === 'full_time');
        }
        if (filters.minPay) {
            // $100k+ — use salary_max as the optimistic top of the range
            list = list.filter(j => (j.salary_max || j.salary_min || 0) >= 100000);
        }
        // Sort copy (don't mutate)
        list = [...list];
        if (sortBy === 'recent') {
            list.sort((a, b) => new Date(b.created || 0) - new Date(a.created || 0));
        } else if (sortBy === 'pay') {
            list.sort((a, b) => (b.salary_max || b.salary_min || 0) - (a.salary_max || a.salary_min || 0));
        } else {
            // match — backend already sorted, but be defensive
            list.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
        }
        return list;
    })();
    const activeFilterCount = Object.values(filters).filter(Boolean).length;

    // Low-match banner dismissal — per session per resume
    const LOW_MATCH_THRESHOLD = 0.55;
    const [bannerDismissed, setBannerDismissed] = useState(false);
    const topScore = jobs[0]?.matchScore;
    const showLowMatchBanner = (
        !bannerDismissed && !jobsLoading && jobs.length > 0 &&
        typeof topScore === 'number' && topScore < LOW_MATCH_THRESHOLD
    );

    useEffect(() => { setMessages([{ role: 'assistant', content: t.chatWelcome }]); }, [language, t.chatWelcome]);
    useEffect(() => { setBannerDismissed(false); }, [activeResumeId]);

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
            } catch (err) { console.warn('Initial load failed:', err.message); }
        })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const toggleSave = async (job) => {
        const id = String(job.id);
        const isSaved = savedIds.has(id);
        setSavedIds(prev => { const next = new Set(prev); if (isSaved) next.delete(id); else next.add(id); return next; });
        try {
            if (isSaved) {
                await api.del(`/api/saved/by-adzuna/${id}`);
            } else {
                await api.post('/api/saved', {
                    adzunaId: id, title: job.title,
                    company: job.company?.display_name || null,
                    location: job.location?.display_name || null,
                    salaryMin: job.salary_min ?? null, salaryMax: job.salary_max ?? null,
                    description: stripHtml(job.description).slice(0, 1000),
                    applyUrl: job.redirect_url,
                    matchScore: typeof job.matchScore === 'number' ? job.matchScore : null
                });
            }
        } catch (err) {
            console.error('Save toggle error:', err);
            setSavedIds(prev => { const next = new Set(prev); if (isSaved) next.add(id); else next.delete(id); return next; });
        }
    };

    const markApplied = async (job) => {
        const id = String(job.id);
        if (appliedIds.has(id)) return;
        setAppliedIds(prev => new Set(prev).add(id));
        try {
            await api.post('/api/applications', {
                adzunaId: id, title: job.title,
                company: job.company?.display_name || null,
                applyUrl: job.redirect_url
            });
        } catch (err) {
            console.error('Mark applied error:', err);
            setAppliedIds(prev => { const next = new Set(prev); next.delete(id); return next; });
        }
    };

    const handleFileUpload = (e) => {
        const uploadedFile = e.target.files[0];
        if (!uploadedFile) return;
        setFile(uploadedFile); setError(null);
    };

    const analyzeResume = async () => {
        if (!file) return;
        setLoading(true); setError(null);
        try {
            const formData = new FormData();
            formData.append('resume', file); formData.append('language', t.languageName);
            const data = await api.postFormData('/api/resumes', formData);
            setResumes(prev => [data.resume, ...prev]);
            if (data.becameActive) {
                setActiveResumeId(data.resume.id);
                await searchJobs(data.resume.id);
            }
            setFile(null);
            setShowUpload(false); // collapse upload form after successful analyze
        } catch (err) {
            console.error('Analysis error:', err);
            setError(err.message || 'Failed to analyze resume. Please try again.');
        } finally { setLoading(false); }
    };

    const switchActive = async (newId) => {
        if (newId === activeResumeId) return;
        try {
            await api.post(`/api/resumes/${newId}/activate`);
            setActiveResumeId(newId);
            setJobs([]);
            await searchJobs(newId);
        } catch (err) { console.error('Switch resume error:', err); setError(err.message); }
    };

    const searchJobs = async (resumeId, intentOverride) => {
        if (!resumeId) return;
        setJobsLoading(true);
        try {
            const focus = intentOverride !== undefined ? intentOverride : focusText;
            const data = await api.post('/api/search-jobs', {
                resumeId, focusText: focus || undefined
            });
            if (data.success) setJobs(data.jobs);
        } catch (err) { console.error('Job search error:', err); }
        finally { setJobsLoading(false); }
    };

    const clearIntent = () => {
        try { localStorage.removeItem(INTENT_KEY); } catch {}
        setFocusText('');
        if (activeResumeId) searchJobs(activeResumeId, '');
    };

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
                language: t.languageName, userProfile
            });
            if (data.success) setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
            else throw new Error(data.error || 'Failed to get response');
        } catch (err) {
            console.error('Chat error:', err);
            setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
        } finally { setChatLoading(false); }
    };

    const askChatForHelp = (pct) => {
        const topTitle = jobs[0]?.title ? ` (top match was "${jobs[0].title}")` : '';
        const prompt = `My best job match is only ${pct}%${topTitle}. What specific changes should I make to my resume — and what alternative job titles should I consider — to find better-fitting jobs?`;
        setChatOpen(true); sendMessage(prompt); setBannerDismissed(true);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    };

    // ============================================================
    // Empty state — no resumes yet OR user hasn't uploaded
    // ============================================================
    if (!analysis) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-20">
                {error && (
                    <div className="max-w-3xl mx-auto mb-6 p-4 rounded-lg text-center
                                    bg-red-50 border border-red-200 text-red-700
                                    dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-300">
                        {error}
                    </div>
                )}
                {focusText && (
                    <div className="max-w-3xl mx-auto mb-6 flex items-center gap-3 px-4 py-3 rounded-lg
                                    bg-sky-50 border border-sky-200
                                    dark:bg-sky-500/10 dark:border-sky-500/30">
                        <Sparkles className="w-4 h-4 text-sky-700 dark:text-sky-400 shrink-0" />
                        <div className="flex-1 text-sm min-w-0">
                            <span className="font-semibold text-sky-900 dark:text-sky-200">{t.anBiasingForward}</span>{' '}
                            <span className="text-sky-800 dark:text-sky-100 italic">"{focusText}"</span>
                        </div>
                        <button onClick={clearIntent} title={t.anClearIntent}
                                className="p-1.5 rounded-lg transition-colors cursor-pointer shrink-0
                                           text-sky-700 hover:bg-sky-100
                                           dark:text-sky-400 dark:hover:bg-sky-500/20">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}
                <ResumeUpload file={file} handleFileUpload={handleFileUpload}
                              analyzeResume={analyzeResume} loading={loading} />
                <ChatWidget chatOpen={chatOpen} setChatOpen={setChatOpen}
                            messages={messages} inputMessage={inputMessage}
                            setInputMessage={setInputMessage} handleKeyPress={handleKeyPress}
                            sendMessage={sendMessage} chatLoading={chatLoading} />
            </div>
        );
    }

    // ============================================================
    // Active workspace — sticky toolbar + sidebar + jobs grid
    // ============================================================
    const topMatchPct = typeof topScore === 'number' ? Math.max(0, Math.round(topScore * 100)) : null;
    const topMatchCls =
        topMatchPct === null ? 'text-slate-500'
        : topMatchPct >= 70 ? 'text-emerald-700 dark:text-emerald-400'
        : topMatchPct >= 55 ? 'text-sky-700 dark:text-sky-400'
        : topMatchPct >= 40 ? 'text-amber-700 dark:text-amber-400'
        :                     'text-slate-500';

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-20">

            {/* ===================== STICKY WORKSPACE TOOLBAR ===================== */}
            <div className="sticky top-16 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 mb-5 border-b
                            bg-white border-slate-200
                            dark:bg-slate-950 dark:border-slate-800">
                <div className="flex flex-wrap items-center gap-3">
                    {/* Active resume picker */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs uppercase tracking-widest font-bold text-slate-500 dark:text-slate-500">{t.anActive}</span>
                        <div className="relative">
                            <select value={activeResumeId || ''} onChange={(e) => switchActive(e.target.value)}
                                    className="appearance-none rounded-md pl-3 pr-9 py-2 text-sm font-medium cursor-pointer
                                               bg-slate-100 border border-slate-200 text-slate-900
                                               dark:bg-slate-800 dark:border-slate-700 dark:text-white
                                               focus:outline-none focus:ring-2 focus:ring-sky-500">
                                {resumes.map(r => (
                                    <option key={r.id} value={r.id} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">{r.label}</option>
                                ))}
                            </select>
                            <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
                        </div>
                    </div>

                    <span className="hidden md:inline-block h-6 w-px bg-slate-200 dark:bg-slate-800"></span>

                    {/* Live stats — reflect what's currently visible after filters */}
                    <div className="hidden md:flex items-center gap-5 text-sm text-slate-600 dark:text-slate-400">
                        {topMatchPct !== null && (
                            <span><span className={`font-bold ${topMatchCls}`}>{topMatchPct}%</span> {t.anTopMatch}</span>
                        )}
                        <span>
                            <span className="text-slate-900 dark:text-white font-bold">
                                {activeFilterCount > 0 ? `${visibleJobs.length}/${jobs.length}` : jobs.length}
                            </span>{' '}{t.anJobs}
                        </span>
                        <span><span className="text-slate-900 dark:text-white font-bold">{savedIds.size}</span> {t.anSaved}</span>
                    </div>

                    <div className="flex-1"></div>

                    {/* Actions */}
                    <button onClick={() => setShowUpload(s => !s)}
                            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-md transition-colors cursor-pointer
                                       text-slate-600 hover:text-slate-900 hover:bg-slate-100
                                       dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800"
                            title={t.anUploadNew}>
                        <Upload className="w-4 h-4" />
                        {t.anUploadNew}
                    </button>
                    <button onClick={() => activeResumeId && searchJobs(activeResumeId)}
                            className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-md transition-colors cursor-pointer
                                       text-sky-700 hover:text-sky-900 hover:bg-sky-50
                                       dark:text-sky-300 dark:hover:text-white dark:hover:bg-sky-500/15">
                        <RotateCcw className="w-4 h-4" />
                        {t.anReRun}
                    </button>
                    <Link to="/editor"
                          className="inline-flex items-center gap-1.5 text-sm font-bold px-3.5 py-2 rounded-md transition-colors cursor-pointer
                                     bg-amber-500 hover:bg-amber-600 text-amber-950
                                     dark:bg-amber-500 dark:hover:bg-amber-400">
                        <Wand2 className="w-4 h-4" />
                        {t.anImproveStudio}
                    </Link>
                </div>
            </div>

            {/* Intent chip */}
            {focusText && (
                <div className="mb-4 flex items-center gap-3 px-4 py-3 rounded-lg
                                bg-sky-50 border border-sky-200
                                dark:bg-sky-500/10 dark:border-sky-500/30">
                    <Sparkles className="w-4 h-4 text-sky-700 dark:text-sky-400 shrink-0" />
                    <div className="flex-1 text-sm min-w-0">
                        <span className="font-semibold text-sky-900 dark:text-sky-200">{t.anBiasingToward}</span>{' '}
                        <span className="text-sky-800 dark:text-sky-100 italic">"{focusText}"</span>
                    </div>
                    <button onClick={clearIntent}
                            className="p-1.5 rounded-lg transition-colors cursor-pointer shrink-0
                                       text-sky-700 hover:bg-sky-100
                                       dark:text-sky-400 dark:hover:bg-sky-500/20"
                            title={t.anClearIntent}>
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Low-match banner */}
            {showLowMatchBanner && (
                <div className="mb-4 flex items-start gap-3 p-4 rounded-lg
                                bg-amber-50 border border-amber-200
                                dark:bg-amber-500/10 dark:border-amber-500/30">
                    <div className="p-2 rounded-md shrink-0
                                    bg-amber-100 text-amber-700
                                    dark:bg-amber-500/20 dark:text-amber-300">
                        <Lightbulb className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-amber-900 dark:text-amber-100">
                            {t.anLowMatchTitleA}{topMatchPct}{t.anLowMatchTitleB}
                        </p>
                        <p className="text-sm mt-0.5 text-amber-800 dark:text-amber-200/80">
                            {t.anLowMatchSub}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => askChatForHelp(topMatchPct)}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-bold transition-colors cursor-pointer
                                           bg-amber-500 hover:bg-amber-600 text-amber-950
                                           dark:bg-amber-500 dark:hover:bg-amber-400">
                            <MessageCircle className="w-4 h-4" />
                            {t.anLowMatchGetTips}
                        </button>
                        <button onClick={() => setBannerDismissed(true)}
                                className="p-2 rounded-md transition-colors cursor-pointer
                                           text-amber-700 hover:bg-amber-100
                                           dark:text-amber-300 dark:hover:bg-amber-500/20"
                                title={t.anLowMatchDismiss}>
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {error && (
                <div className="mb-4 p-4 rounded-lg text-center
                                bg-red-50 border border-red-200 text-red-700
                                dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-300">
                    {error}
                </div>
            )}

            {/* Slide-out upload form when user clicks "Upload new" */}
            {showUpload && (
                <div className="mb-6">
                    <ResumeUpload file={file} handleFileUpload={handleFileUpload}
                                  analyzeResume={analyzeResume} loading={loading} />
                </div>
            )}

            {/* ===================== TWO-COLUMN WORKSPACE ===================== */}
            <div className="grid grid-cols-1 lg:grid-cols-[420px_minmax(0,1fr)] gap-6">
                {/* LEFT: compact resume sidebar */}
                <ResumeSidebar data={analysis} />

                {/* RIGHT: jobs */}
                <section>
                    <div className="flex items-end justify-between mb-3 gap-3 flex-wrap">
                        <h2 className="h-serif text-3xl font-medium text-slate-900 dark:text-white leading-tight">Matched jobs</h2>
                        <div className="hidden sm:flex items-center gap-1 text-xs p-1 rounded-lg
                                        bg-slate-100 border border-slate-200
                                        dark:bg-slate-900 dark:border-slate-800">
                            <SortTab active={sortBy === 'match'}  onClick={() => setSortBy('match')}>Best match</SortTab>
                            <SortTab active={sortBy === 'recent'} onClick={() => setSortBy('recent')}>Most recent</SortTab>
                            <SortTab active={sortBy === 'pay'}    onClick={() => setSortBy('pay')}>Highest pay</SortTab>
                        </div>
                    </div>

                    {/* Filter pills — wired up to client-side filter state */}
                    <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
                        <span className="flex items-center gap-1.5 font-bold uppercase tracking-widest text-slate-500">
                            <Filter className="w-3 h-3" /> Filters:
                        </span>
                        <FilterPill active={filters.remote}   onClick={() => toggleFilter('remote')}>Remote</FilterPill>
                        <FilterPill active={filters.fullTime} onClick={() => toggleFilter('fullTime')}>Full-time</FilterPill>
                        <FilterPill active={filters.minPay}   onClick={() => toggleFilter('minPay')}>$100k+</FilterPill>
                        {activeFilterCount > 0 && (
                            <button onClick={() => setFilters({ remote: false, fullTime: false, minPay: false })}
                                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full transition-colors cursor-pointer
                                               text-slate-500 hover:text-slate-700
                                               dark:text-slate-400 dark:hover:text-white">
                                <X className="w-3 h-3" /> Clear all
                            </button>
                        )}
                    </div>

                    {/* Empty-filter state — nothing matches the user's filters */}
                    {!jobsLoading && jobs.length > 0 && visibleJobs.length === 0 && (
                        <div className="text-center py-12 rounded-lg border border-dashed
                                        bg-slate-50 border-slate-300
                                        dark:bg-slate-800/40 dark:border-slate-700">
                            <p className="text-slate-600 dark:text-slate-300 mb-3">
                                No jobs match these filters.
                            </p>
                            <button onClick={() => setFilters({ remote: false, fullTime: false, minPay: false })}
                                    className="inline-flex items-center gap-1 text-sm font-semibold transition-colors cursor-pointer
                                               text-sky-700 hover:text-sky-900
                                               dark:text-sky-300 dark:hover:text-white">
                                Clear filters
                            </button>
                        </div>
                    )}

                    <JobMatches jobs={visibleJobs} loading={jobsLoading} t={t}
                                formatSalary={formatSalary} stripHtml={stripHtml}
                                savedIds={savedIds} appliedIds={appliedIds}
                                onToggleSave={toggleSave} onMarkApplied={markApplied} />
                </section>
            </div>

            <ChatWidget chatOpen={chatOpen} setChatOpen={setChatOpen}
                        messages={messages} inputMessage={inputMessage}
                        setInputMessage={setInputMessage} handleKeyPress={handleKeyPress}
                        sendMessage={sendMessage} chatLoading={chatLoading} t={t} />
        </div>
    );
}

// ============================================================
// ResumeSidebar — compact left-pane view of the parsed resume
// (intentionally tighter than the standalone AnalysisResults
// component, which was designed for a full-width display)
// ============================================================
function ResumeSidebar({ data }) {
    const t = useLang(s => s.t);
    if (!data) return null;

    const sectionTitle = "text-xs uppercase tracking-widest font-bold mb-2 text-slate-500 dark:text-slate-500";

    return (
        <aside className="rounded-lg overflow-hidden lg:sticky lg:top-32 lg:self-start lg:max-h-[calc(100vh-9rem)] lg:overflow-y-auto
                          bg-white border border-slate-200
                          dark:bg-slate-900 dark:border-slate-800">
            {/* Header */}
            <div className="px-6 pt-6 pb-5 border-b border-slate-100 dark:border-slate-800">
                <p className="text-xs uppercase tracking-widest font-bold mb-1 text-sky-700 dark:text-sky-400">{t.sbYourProfile}</p>
                <h1 className="h-serif text-3xl font-medium leading-tight text-slate-900 dark:text-white">{data.name}</h1>
                {data.originalLanguage && data.originalLanguage !== 'English' && (
                    <p className="text-sm mt-0.5 text-slate-500 dark:text-slate-500">
                        {t.sbTranslatedFrom} <span className="font-medium text-slate-700 dark:text-slate-300">{data.originalLanguage}</span>
                    </p>
                )}
            </div>

            {data.summary && (
                <section className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                    <h2 className={sectionTitle}>{t.sbSummary}</h2>
                    <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">{data.summary}</p>
                </section>
            )}

            {Array.isArray(data.recommendedJobTitles) && data.recommendedJobTitles.length > 0 && (
                <section className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                    <h2 className={sectionTitle}>{t.sbTargetRoles}</h2>
                    <div className="flex flex-wrap gap-1.5">
                        {data.recommendedJobTitles.map((r, i) => (
                            <span key={i} className="px-2.5 py-1 rounded-md text-xs font-bold border
                                                     bg-sky-50 border-sky-200 text-sky-700
                                                     dark:bg-sky-500/10 dark:border-sky-500/30 dark:text-sky-300">
                                {r}
                            </span>
                        ))}
                    </div>
                </section>
            )}

            {Array.isArray(data.skills) && data.skills.length > 0 && (
                <section className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                    <h2 className={sectionTitle}>{t.sbSkills}</h2>
                    <div className="flex flex-wrap gap-1.5">
                        {data.skills.map((s, i) => (
                            <span key={i} className="px-2.5 py-1 rounded-md text-xs border
                                                     bg-slate-100 border-slate-200 text-slate-700
                                                     dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200">
                                {s}
                            </span>
                        ))}
                    </div>
                </section>
            )}

            {Array.isArray(data.experience) && data.experience.length > 0 && (
                <section className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                    <h2 className={sectionTitle}>{t.sbExperience}</h2>
                    <ol className="space-y-3">
                        {data.experience.slice(0, 5).map((e, i) => (
                            <li key={i} className="border-l-2 pl-3 border-sky-300 dark:border-sky-500/40">
                                <p className="text-sm font-bold text-slate-900 dark:text-white">{e.title}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{e.company} · {e.duration}</p>
                                {e.responsibilities && (
                                    <p className="text-xs mt-1 text-slate-600 dark:text-slate-300 line-clamp-3">{e.responsibilities}</p>
                                )}
                            </li>
                        ))}
                    </ol>
                </section>
            )}

            {Array.isArray(data.education) && data.education.length > 0 && (
                <section className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                    <h2 className={sectionTitle}>{t.sbEducation}</h2>
                    <ul className="space-y-2">
                        {data.education.map((e, i) => (
                            <li key={i}>
                                <p className="text-sm font-bold text-slate-900 dark:text-white">{e.degree}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{e.institution} · {e.year}</p>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {data.usEquivalents && (data.usEquivalents.degreeEquivalent || data.usEquivalents.certifications) && (
                <section className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                    <h2 className={sectionTitle}>{t.sbUsEquivalents}</h2>
                    {data.usEquivalents.degreeEquivalent && (
                        <div className="p-3 rounded-md mb-2
                                        bg-sky-50 border border-sky-200
                                        dark:bg-sky-500/10 dark:border-sky-500/30">
                            <p className="text-xs uppercase tracking-widest font-bold mb-1 text-sky-700 dark:text-sky-400">{t.sbDegree}</p>
                            <p className="text-sm text-slate-900 dark:text-white">{data.usEquivalents.degreeEquivalent}</p>
                        </div>
                    )}
                    {data.usEquivalents.certifications && (
                        <div className="p-3 rounded-md
                                        bg-amber-50 border border-amber-200
                                        dark:bg-amber-500/10 dark:border-amber-500/30">
                            <p className="text-xs uppercase tracking-widest font-bold mb-1 text-amber-700 dark:text-amber-400">{t.sbRecCerts}</p>
                            <p className="text-sm text-slate-900 dark:text-white">{data.usEquivalents.certifications}</p>
                        </div>
                    )}
                </section>
            )}

            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/40">
                <Link to="/editor"
                      className="inline-flex items-center gap-1.5 text-sm font-bold transition-colors cursor-pointer
                                 text-sky-700 hover:text-sky-900
                                 dark:text-sky-300 dark:hover:text-white">
                    {t.sbImproveStudio}
                    <ChevronDown className="w-4 h-4 -rotate-90" />
                </Link>
            </div>
        </aside>
    );
}

// ============================================================
// SortTab / FilterPill — small helpers for the right-column header
// ============================================================
function SortTab({ active, onClick, children }) {
    return (
        <button onClick={onClick}
                className={`px-2.5 py-1.5 rounded-md font-medium cursor-pointer transition-colors ${
                    active
                        ? 'bg-sky-600 text-white dark:bg-sky-600'
                        : 'text-slate-600 hover:bg-white dark:text-slate-400 dark:hover:bg-slate-800'
                }`}>
            {children}
        </button>
    );
}

function FilterPill({ active, onClick, children }) {
    return (
        <button onClick={onClick}
                className={`rounded-full px-3 py-1 border transition-colors cursor-pointer ${
                    active
                        ? 'bg-sky-600 border-sky-600 text-white dark:bg-sky-600 dark:border-sky-600'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-sky-400 ' +
                          'dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:border-sky-500'
                }`}>
            {children}
        </button>
    );
}
