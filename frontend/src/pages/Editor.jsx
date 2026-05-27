// ============================================================
// Resume Studio — in-app resume coaching
// ============================================================
// Two-pane layout:
//   Left  = read-only structured view of the active resume
//   Right = AI Coach: suggestion cards with Apply / Skip
// Plus the Builder modal for generating US-tailored resumes.
//
// Applying a suggestion mutates the resume's parsedData on the
// server and clears its embedding, so the next visit to /analyze
// gets a re-computed match score (the "see your score go up" loop).
//
// Note: BuiltResumePreview intentionally stays white-paper-look in
// both themes — the preview *represents a document*, and documents
// are white. The modal wrapping it has dark-mode chrome.
// ============================================================

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    FileText, ChevronDown, Sparkles, Lightbulb, Loader2, Check, X,
    Search, Languages, ArrowRight, FolderOpen, Wand2, Copy, FileDown
} from 'lucide-react';
import { api, API_URL, tokenStorage } from '../services/api';

const TEMPLATES = [
    { value: 'hybrid',        label: 'Hybrid',        desc: 'Skills-led + chronological — best for immigrants' },
    { value: 'chronological', label: 'Chronological', desc: 'Classic US format — best for steady careers' },
    { value: 'skills_first',  label: 'Skills-first',  desc: 'Functional — best for career changers / gaps' }
];

const TYPE_META = {
    rewrite_summary:         { label: 'Summary',           verb: 'Rewrite' },
    rewrite_responsibilities:{ label: 'Experience bullet', verb: 'Rewrite' },
    rewrite_skill:           { label: 'Skill',             verb: 'Replace' },
    add_skill:               { label: 'New skill',         verb: 'Add' },
    add_target_role:         { label: 'Target role',       verb: 'Add' },
    add_certification:       { label: 'Certification',     verb: 'Add' }
};

const LANGUAGES = [
    { code: 'English',  label: 'English'  },
    { code: 'Spanish',  label: 'Español'  },
    { code: 'French',   label: 'Français' },
    { code: 'Arabic',   label: 'العربية' },
    { code: 'Chinese',  label: '中文'    },
    { code: 'Hindi',    label: 'हिन्दी' }
];

// Shared input class used in both the coach and the builder
const INPUT_CLS =
    'w-full rounded-md px-3 py-2 text-sm ' +
    'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 ' +
    'dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder-slate-500 ' +
    'focus:outline-none focus:ring-2 focus:ring-sky-500';

const SELECT_CLS = INPUT_CLS + ' appearance-none cursor-pointer pl-3 pr-9';

const CARD_CLS =
    'rounded-lg p-6 ' +
    'bg-white border border-slate-200 ' +
    'dark:bg-slate-900 dark:border-slate-800';

export default function Editor() {
    const [resumes, setResumes] = useState([]);
    const [activeResumeId, setActiveResumeId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [suggestions, setSuggestions] = useState([]);
    const [suggesting, setSuggesting] = useState(false);
    const [busyId, setBusyId] = useState(null);
    const [focus, setFocus] = useState('');
    const [language, setLanguage] = useState('English');

    // Builder modal state
    const [builderOpen, setBuilderOpen] = useState(false);
    const [builderTemplate, setBuilderTemplate] = useState('hybrid');
    const [builderLanguage, setBuilderLanguage] = useState('English');
    const [building, setBuilding] = useState(false);
    const [buildResult, setBuildResult] = useState(null);
    const [downloading, setDownloading] = useState(false);
    const [copiedKey, setCopiedKey] = useState(null);

    const activeResume = resumes.find(r => r.id === activeResumeId) || null;
    const data = activeResume?.parsedData || null;

    useEffect(() => {
        (async () => {
            try {
                const { resumes, activeResumeId } = await api.get('/api/resumes');
                setResumes(resumes);
                setActiveResumeId(activeResumeId);
            } catch (err) { setError(err.message); }
            finally { setLoading(false); }
        })();
    }, []);

    useEffect(() => { setSuggestions([]); }, [activeResumeId]);

    const switchActive = async (newId) => {
        if (!newId || newId === activeResumeId) return;
        try {
            await api.post(`/api/resumes/${newId}/activate`);
            setActiveResumeId(newId);
        } catch (err) { setError(err.message); }
    };

    const generate = async () => {
        if (!activeResumeId || suggesting) return;
        setSuggesting(true); setError(null);
        try {
            const { suggestions } = await api.post(
                `/api/resumes/${activeResumeId}/suggestions`,
                { language, focus: focus.trim() || undefined }
            );
            setSuggestions(suggestions || []);
        } catch (err) { setError(err.message); }
        finally { setSuggesting(false); }
    };

    const apply = async (suggestion) => {
        setBusyId(suggestion.id);
        try {
            const { resume } = await api.post(
                `/api/resumes/${activeResumeId}/apply-suggestion`,
                { suggestion }
            );
            setResumes(prev => prev.map(r => r.id === resume.id ? resume : r));
            setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
        } catch (err) { setError(err.message); }
        finally { setBusyId(null); }
    };

    const skip = (suggestion) => setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));

    const openBuilder = () => {
        if (!activeResumeId) return;
        setBuilderLanguage(language);
        setBuilderOpen(true);
        setBuildResult(null);
    };
    const closeBuilder = () => { setBuilderOpen(false); setBuildResult(null); };

    const runBuild = async () => {
        if (!activeResumeId || building) return;
        setBuilding(true); setError(null);
        try {
            const d = await api.post(
                `/api/resumes/${activeResumeId}/build`,
                { template: builderTemplate, language: builderLanguage }
            );
            setBuildResult(d);
        } catch (err) { setError(err.message); }
        finally { setBuilding(false); }
    };

    const copyToClipboard = async (text, key) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedKey(key);
            setTimeout(() => setCopiedKey(null), 1500);
        } catch { setError('Copy failed — your browser may have blocked clipboard access'); }
    };

    const downloadDocx = async () => {
        if (!buildResult || downloading) return;
        setDownloading(true);
        try {
            const res = await fetch(`${API_URL}/api/resumes/${activeResumeId}/export-docx`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${tokenStorage.get()}`
                },
                body: JSON.stringify({ structured: buildResult.structured })
            });
            if (!res.ok) throw new Error(`Export failed: ${res.status}`);
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const safeName = (buildResult.structured?.name || 'resume')
                .replace(/[^\w\- ]/g, '').replace(/\s+/g, '_');
            a.download = `${safeName}.docx`;
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) { setError(err.message); }
        finally { setDownloading(false); }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24
                            text-slate-500 dark:text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mb-3" />
                <p>Loading studio…</p>
            </div>
        );
    }

    if (resumes.length === 0) {
        return (
            <div className={`max-w-3xl mx-auto p-12 text-center ${CARD_CLS}`}>
                <Wand2 className="w-12 h-12 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                <h2 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">No resume to coach yet</h2>
                <p className="mb-6 text-slate-500 dark:text-slate-400">Upload a resume first — the studio will help you improve it line by line.</p>
                <Link to="/analyze"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md font-semibold transition-colors
                                 bg-sky-600 hover:bg-sky-700 text-white
                                 dark:bg-sky-600 dark:hover:bg-sky-500">
                    Upload a resume
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-20">
            {/* Header bar */}
            <div className="mb-6 flex flex-wrap items-center gap-3 px-4 py-3 rounded-lg
                            bg-white border border-slate-200
                            dark:bg-slate-900 dark:border-slate-800">
                <div className="flex items-center gap-2 text-sm shrink-0
                                text-slate-600 dark:text-slate-400">
                    <FileText className="w-4 h-4 text-sky-700 dark:text-sky-400" />
                    Editing:
                </div>
                <div className="relative flex-1 min-w-[200px]">
                    <select value={activeResumeId || ''} onChange={(e) => switchActive(e.target.value)}
                            className={SELECT_CLS}>
                        {resumes.map(r => (
                            <option key={r.id} value={r.id} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">{r.label}</option>
                        ))}
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
                </div>
                <Link to="/resumes"
                      className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-md transition-colors cursor-pointer shrink-0
                                 text-slate-600 hover:text-slate-900 hover:bg-slate-100
                                 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800">
                    <FolderOpen className="w-4 h-4" />
                    Manage
                </Link>
                <Link to="/analyze"
                      className="flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-md transition-colors cursor-pointer shrink-0
                                 bg-sky-50 border border-sky-200 text-sky-700 hover:bg-sky-100
                                 dark:bg-sky-500/10 dark:border-sky-500/30 dark:text-sky-300 dark:hover:bg-sky-500/20"
                      title="Re-rank jobs against your updated resume">
                    <Search className="w-4 h-4" />
                    Re-rank jobs
                </Link>
                <button onClick={openBuilder}
                        className="flex items-center gap-1.5 text-sm font-bold px-3.5 py-2 rounded-md transition-colors cursor-pointer shrink-0
                                   bg-amber-500 hover:bg-amber-600 text-amber-950
                                   dark:bg-amber-500 dark:hover:bg-amber-400"
                        title="Generate a US-tailored version of this resume">
                    <Wand2 className="w-4 h-4" />
                    Build US Resume
                </button>
            </div>

            {error && (
                <div className="mb-4 p-3 rounded-md text-sm
                                bg-red-50 border border-red-200 text-red-700
                                dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-300">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* LEFT — resume preview */}
                <div className={CARD_CLS}>
                    <h2 className="h-serif text-2xl font-medium mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
                        <FileText className="w-5 h-5 text-sky-700 dark:text-sky-400" />
                        Your resume
                    </h2>
                    <ResumeView data={data} />
                </div>

                {/* RIGHT — AI Coach */}
                <div className={CARD_CLS + ' lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto'}>
                    <h2 className="h-serif text-2xl font-medium mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
                        <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        AI Coach
                    </h2>

                    <div className="mb-3">
                        <label className="text-xs font-medium flex items-center gap-1.5 mb-1
                                          text-slate-500 dark:text-slate-400">
                            <Languages className="w-3.5 h-3.5" />
                            Explain in
                        </label>
                        <div className="relative">
                            <select value={language} onChange={(e) => setLanguage(e.target.value)} className={SELECT_CLS}>
                                {LANGUAGES.map(l => (
                                    <option key={l.code} value={l.code} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">{l.label}</option>
                                ))}
                            </select>
                            <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
                        </div>
                    </div>

                    <div className="mb-3">
                        <label className="text-xs font-medium mb-1 block text-slate-500 dark:text-slate-400">
                            What should the coach focus on? <span className="text-slate-400 dark:text-slate-500">(optional)</span>
                        </label>
                        <input type="text" value={focus} onChange={(e) => setFocus(e.target.value)}
                               placeholder="e.g. emphasize leadership, make bullets shorter"
                               className={INPUT_CLS} />
                    </div>

                    <button onClick={generate} disabled={suggesting || !activeResumeId}
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md font-bold transition-colors cursor-pointer mb-4
                                       bg-amber-500 hover:bg-amber-600 text-amber-950
                                       dark:bg-amber-500 dark:hover:bg-amber-400
                                       disabled:opacity-50 disabled:cursor-not-allowed">
                        {suggesting ? (
                            <><Loader2 className="w-4 h-4 animate-spin" />Coaching…</>
                        ) : (
                            <><Lightbulb className="w-4 h-4" />{suggestions.length > 0 ? 'New suggestions' : 'Get suggestions'}</>
                        )}
                    </button>

                    {!suggesting && suggestions.length === 0 && (
                        <div className="text-center py-10 rounded-md border border-dashed
                                        bg-slate-50 border-slate-300
                                        dark:bg-slate-800/40 dark:border-slate-700">
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Click <span className="font-semibold text-amber-700 dark:text-amber-300">Get suggestions</span> to see specific ways to strengthen this resume.
                            </p>
                        </div>
                    )}

                    <div className="space-y-3">
                        {suggestions.map(s => {
                            const meta = TYPE_META[s.type] || { label: s.type, verb: 'Update' };
                            const isBusy = busyId === s.id;
                            return (
                                <div key={s.id}
                                     className="rounded-md p-4
                                                bg-slate-50 border border-slate-200
                                                dark:bg-slate-800/40 dark:border-slate-700">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xs font-bold px-2 py-0.5 rounded-full border
                                                         bg-amber-100 text-amber-700 border-amber-300
                                                         dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30">
                                            {meta.verb} · {meta.label}
                                        </span>
                                    </div>

                                    {s.currentText && s.currentText !== '[empty]' && (
                                        <div className="mb-2">
                                            <p className="text-xs mb-1 text-slate-500 dark:text-slate-500">Currently</p>
                                            <p className="text-sm rounded-lg p-2.5 line-clamp-3
                                                          bg-white border border-slate-200 text-slate-700
                                                          dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300">
                                                {s.currentText}
                                            </p>
                                        </div>
                                    )}

                                    <div className="mb-2 flex items-center gap-2">
                                        <ArrowRight className="w-4 h-4 text-amber-600 dark:text-amber-400/80 shrink-0" />
                                        <p className="text-xs text-amber-700 dark:text-amber-300/80">Suggested</p>
                                    </div>
                                    <p className="text-sm rounded-lg p-2.5 mb-2
                                                  bg-amber-50 border border-amber-300 text-slate-900
                                                  dark:bg-amber-500/10 dark:border-amber-500/30 dark:text-white">
                                        {s.suggestedText}
                                    </p>

                                    {s.rationale && (
                                        <p className="text-xs italic mb-3 text-slate-600 dark:text-slate-400">
                                            {s.rationale}
                                        </p>
                                    )}

                                    <div className="flex gap-2">
                                        <button onClick={() => apply(s)} disabled={isBusy}
                                                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer border
                                                           bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100
                                                           dark:bg-emerald-500/15 dark:border-emerald-500/40 dark:text-emerald-300 dark:hover:bg-emerald-500/25
                                                           disabled:opacity-50">
                                            {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                            Apply
                                        </button>
                                        <button onClick={() => skip(s)} disabled={isBusy}
                                                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer border
                                                           bg-white border-slate-200 text-slate-600 hover:bg-slate-100
                                                           dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800
                                                           disabled:opacity-50">
                                            <X className="w-4 h-4" />
                                            Skip
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Builder modal */}
            {builderOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                     onClick={closeBuilder}>
                    <div className="rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto
                                    bg-white border border-slate-200
                                    dark:bg-slate-900 dark:border-slate-800"
                         onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-6 py-4 sticky top-0 z-10 border-b
                                        bg-white border-slate-200
                                        dark:bg-slate-900 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-500/15">
                                    <Wand2 className="w-5 h-5 text-amber-700 dark:text-amber-300" />
                                </div>
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Build US Resume</h2>
                            </div>
                            <button onClick={closeBuilder}
                                    className="p-2 rounded-lg transition-colors cursor-pointer
                                               text-slate-500 hover:text-slate-900 hover:bg-slate-100
                                               dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-5">
                            <div>
                                <label className="text-xs font-medium mb-2 block text-slate-500 dark:text-slate-400">Template</label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    {TEMPLATES.map(tmpl => {
                                        const active = builderTemplate === tmpl.value;
                                        return (
                                            <button key={tmpl.value}
                                                    onClick={() => { setBuilderTemplate(tmpl.value); setBuildResult(null); }}
                                                    className={`text-left p-3 rounded-md border transition-colors cursor-pointer ${
                                                        active
                                                            ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-200 dark:bg-amber-500/15 dark:border-amber-500/50 dark:ring-amber-500/30'
                                                            : 'bg-slate-50 border-slate-200 hover:border-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:hover:border-slate-600'
                                                    }`}>
                                                <p className={`text-sm font-semibold ${active ? 'text-amber-700 dark:text-amber-200' : 'text-slate-900 dark:text-white'}`}>{tmpl.label}</p>
                                                <p className="text-xs mt-1 text-slate-500 dark:text-slate-400">{tmpl.desc}</p>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-medium mb-1 flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                                    <Languages className="w-3.5 h-3.5" />
                                    Output language
                                </label>
                                <div className="relative">
                                    <select value={builderLanguage}
                                            onChange={(e) => { setBuilderLanguage(e.target.value); setBuildResult(null); }}
                                            className={SELECT_CLS}>
                                        {LANGUAGES.map(l => (
                                            <option key={l.code} value={l.code} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">{l.label}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
                                </div>
                            </div>

                            <button onClick={runBuild} disabled={building}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md font-bold transition-colors cursor-pointer
                                               bg-amber-500 hover:bg-amber-600 text-amber-950
                                               dark:bg-amber-500 dark:hover:bg-amber-400
                                               disabled:opacity-50 disabled:cursor-not-allowed">
                                {building ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" />Building…</>
                                ) : (
                                    <><Wand2 className="w-4 h-4" />{buildResult ? 'Rebuild' : 'Generate US-tailored resume'}</>
                                )}
                            </button>

                            {buildResult && (
                                <div className="border-t pt-5 space-y-3 border-slate-200 dark:border-slate-800">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="text-sm flex-1 min-w-[200px] text-slate-600 dark:text-slate-400">
                                            Preview below. Copy as plain text for ATS / job sites, or download .docx for Word.
                                        </p>
                                        <div className="flex gap-2 flex-wrap">
                                            <button onClick={() => copyToClipboard(buildResult.plainText, 'text')}
                                                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors cursor-pointer
                                                               bg-sky-50 border-sky-200 text-sky-700 hover:bg-sky-100
                                                               dark:bg-sky-500/10 dark:border-sky-500/30 dark:text-sky-300 dark:hover:bg-sky-500/20">
                                                {copiedKey === 'text' ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                                Copy text
                                            </button>
                                            <button onClick={() => copyToClipboard(buildResult.markdown, 'markdown')}
                                                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors cursor-pointer
                                                               bg-sky-50 border-sky-200 text-sky-700 hover:bg-sky-100
                                                               dark:bg-sky-500/10 dark:border-sky-500/30 dark:text-sky-300 dark:hover:bg-sky-500/20">
                                                {copiedKey === 'markdown' ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                                Copy markdown
                                            </button>
                                            <button onClick={downloadDocx} disabled={downloading}
                                                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold border transition-colors cursor-pointer disabled:opacity-50
                                                               bg-emerald-100 border-emerald-300 text-emerald-700 hover:bg-emerald-200
                                                               dark:bg-emerald-500/15 dark:border-emerald-500/40 dark:text-emerald-300 dark:hover:bg-emerald-500/25">
                                                {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                                                Download .docx
                                            </button>
                                        </div>
                                    </div>
                                    {/* The paper-look preview stays white in BOTH themes — it represents the actual document. */}
                                    <div className="rounded-md overflow-y-auto max-h-[60vh] bg-white shadow-inner border border-slate-200 dark:border-slate-700">
                                        <BuiltResumePreview structured={buildResult.structured} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ============================================================
// BuiltResumePreview — paper-like preview of the US-tailored resume
// (stays white in both themes — it represents a document)
// ============================================================
const SECTION_ORDER = {
    chronological: ['summary', 'experience', 'skills', 'education', 'certifications'],
    hybrid:        ['summary', 'skills', 'experience', 'education', 'certifications'],
    skills_first:  ['summary', 'skills', 'certifications', 'education', 'experience']
};

function BuiltResumePreview({ structured }) {
    if (!structured) return null;
    const order = SECTION_ORDER[structured.template] || SECTION_ORDER.chronological;
    const contactBits = [
        structured.contact?.email, structured.contact?.phone,
        structured.contact?.location, structured.contact?.url
    ].filter(Boolean);

    return (
        <div className="bg-white text-gray-900 px-10 py-8 font-serif leading-relaxed" style={{ minHeight: 600 }}>
            {structured.name && (
                <h1 className="text-3xl font-bold text-center tracking-tight">{structured.name}</h1>
            )}
            {contactBits.length > 0 && (
                <p className="text-center text-sm text-gray-600 mt-1">{contactBits.join('  •  ')}</p>
            )}
            <div className="space-y-5 mt-6">
                {order.map((section) => {
                    switch (section) {
                        case 'summary':
                            if (!structured.summary) return null;
                            return <Section key="summary" title="Summary"><p className="text-[15px] text-gray-800">{structured.summary}</p></Section>;
                        case 'skills':
                            if (!structured.skills || (Array.isArray(structured.skills) && structured.skills.length === 0)) return null;
                            return (
                                <Section key="skills" title="Skills">
                                    {Array.isArray(structured.skills) && structured.skills.length > 0 && typeof structured.skills[0] === 'object' ? (
                                        <ul className="space-y-1">
                                            {structured.skills.map((cat, i) => (
                                                <li key={i} className="text-[14px]">
                                                    <span className="font-semibold">{cat.category}:</span>{' '}
                                                    <span className="text-gray-800">{(cat.items || []).join(', ')}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-[14px] text-gray-800">{structured.skills.join('  •  ')}</p>
                                    )}
                                </Section>
                            );
                        case 'experience':
                            if (!Array.isArray(structured.experience) || structured.experience.length === 0) return null;
                            return (
                                <Section key="experience" title="Experience">
                                    <div className="space-y-4">
                                        {structured.experience.map((exp, i) => (
                                            <div key={i}>
                                                <div className="flex items-baseline justify-between gap-3">
                                                    <p className="font-semibold text-[15px]">
                                                        {exp.title}
                                                        {exp.company && <span className="text-gray-700"> — {exp.company}</span>}
                                                    </p>
                                                    <p className="text-[13px] text-gray-600 italic whitespace-nowrap">
                                                        {[exp.startDate, exp.endDate].filter(Boolean).join(' – ')}
                                                    </p>
                                                </div>
                                                {exp.location && <p className="text-[13px] text-gray-600 italic">{exp.location}</p>}
                                                {Array.isArray(exp.bullets) && exp.bullets.length > 0 && (
                                                    <ul className="list-disc list-outside ml-5 mt-1 space-y-0.5">
                                                        {exp.bullets.map((b, j) => <li key={j} className="text-[14px] text-gray-800">{b}</li>)}
                                                    </ul>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </Section>
                            );
                        case 'education':
                            if (!Array.isArray(structured.education) || structured.education.length === 0) return null;
                            return (
                                <Section key="education" title="Education">
                                    <ul className="space-y-2">
                                        {structured.education.map((ed, i) => {
                                            const right = [ed.location, ed.year].filter(Boolean).join(' · ');
                                            return (
                                                <li key={i} className="flex items-baseline justify-between gap-3 text-[14px]">
                                                    <span>
                                                        <span className="font-semibold">{ed.degree}</span>
                                                        {ed.institution && <span className="text-gray-700">, {ed.institution}</span>}
                                                    </span>
                                                    {right && <span className="text-gray-600 italic whitespace-nowrap">{right}</span>}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </Section>
                            );
                        case 'certifications':
                            if (!Array.isArray(structured.certifications) || structured.certifications.length === 0) return null;
                            return (
                                <Section key="certifications" title="Certifications">
                                    <ul className="list-disc list-outside ml-5 space-y-0.5">
                                        {structured.certifications.map((c, i) => <li key={i} className="text-[14px] text-gray-800">{c}</li>)}
                                    </ul>
                                </Section>
                            );
                        default: return null;
                    }
                })}
            </div>
        </div>
    );
}

function Section({ title, children }) {
    return (
        <section>
            <h2 className="text-[13px] font-bold tracking-widest uppercase text-gray-900 border-b border-gray-300 pb-1 mb-2">
                {title}
            </h2>
            {children}
        </section>
    );
}

// ============================================================
// ResumeView — read-only structured display of the parsed resume
// (the LEFT pane in the Studio; full theme support)
// ============================================================
function ResumeView({ data }) {
    if (!data) return <p className="italic text-slate-500 dark:text-slate-500">No resume data.</p>;

    const sectionTitle = "text-xs font-semibold uppercase tracking-wider mb-1.5 text-sky-700 dark:text-sky-400";
    const skillChip = "px-2 py-0.5 rounded-full text-xs border " +
                      "bg-slate-100 border-slate-200 text-slate-700 " +
                      "dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200";

    return (
        <div className="space-y-5 text-sm">
            {data.name && (
                <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{data.name}</h3>
                    {data.originalLanguage && (
                        <p className="text-xs mt-0.5 text-slate-500 dark:text-slate-500">Original language: {data.originalLanguage}</p>
                    )}
                </div>
            )}

            {data.summary && (
                <section>
                    <h4 className={sectionTitle}>Summary</h4>
                    <p className="text-slate-700 dark:text-slate-200">{data.summary}</p>
                </section>
            )}

            {Array.isArray(data.skills) && data.skills.length > 0 && (
                <section>
                    <h4 className={sectionTitle}>Skills</h4>
                    <div className="flex flex-wrap gap-1.5">
                        {data.skills.map((s, i) => <span key={i} className={skillChip}>{s}</span>)}
                    </div>
                </section>
            )}

            {Array.isArray(data.experience) && data.experience.length > 0 && (
                <section>
                    <h4 className={sectionTitle}>Experience</h4>
                    <ul className="space-y-3">
                        {data.experience.map((e, i) => (
                            <li key={i} className="border-l-2 pl-3 border-sky-300 dark:border-sky-500/40">
                                <p className="font-semibold text-slate-900 dark:text-white">{e.title}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{e.company} · {e.duration}</p>
                                {e.responsibilities && (
                                    <p className="text-xs mt-1 text-slate-700 dark:text-slate-300">{e.responsibilities}</p>
                                )}
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {Array.isArray(data.education) && data.education.length > 0 && (
                <section>
                    <h4 className={sectionTitle}>Education</h4>
                    <ul className="space-y-2">
                        {data.education.map((e, i) => (
                            <li key={i} className="text-slate-700 dark:text-slate-200">
                                <span className="font-semibold">{e.degree}</span>
                                <span className="text-xs text-slate-500 dark:text-slate-400"> · {e.institution} · {e.year}</span>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {data.usEquivalents && (data.usEquivalents.degreeEquivalent || data.usEquivalents.certifications) && (
                <section>
                    <h4 className={sectionTitle}>US Equivalents</h4>
                    {data.usEquivalents.degreeEquivalent && (
                        <p className="text-slate-700 dark:text-slate-200">
                            <span className="text-slate-500 dark:text-slate-400">Degree:</span> {data.usEquivalents.degreeEquivalent}
                        </p>
                    )}
                    {data.usEquivalents.certifications && (
                        <p className="text-slate-700 dark:text-slate-200">
                            <span className="text-slate-500 dark:text-slate-400">Recommended certs:</span> {data.usEquivalents.certifications}
                        </p>
                    )}
                </section>
            )}

            {Array.isArray(data.recommendedJobTitles) && data.recommendedJobTitles.length > 0 && (
                <section>
                    <h4 className={sectionTitle}>Target roles</h4>
                    <div className="flex flex-wrap gap-1.5">
                        {data.recommendedJobTitles.map((r, i) => (
                            <span key={i}
                                  className="px-2 py-0.5 rounded-full text-xs border
                                             bg-amber-50 border-amber-300 text-amber-700
                                             dark:bg-amber-500/15 dark:border-amber-500/30 dark:text-amber-200">
                                {r}
                            </span>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
