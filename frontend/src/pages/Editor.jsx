// ============================================================
// Resume Studio — in-app resume coaching
// ============================================================
// Two-pane layout:
//   Left  = read-only structured view of the active resume
//   Right = AI Coach: suggestion cards with Apply / Skip
//
// Applying a suggestion mutates the resume's parsedData on the
// server and clears its embedding, so the next visit to /analyze
// gets a re-computed match score (the "see your score go up" loop).
// ============================================================

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    FileText, ChevronDown, Sparkles, Lightbulb, Loader2, Check, X,
    Search, Languages, ArrowRight, FolderOpen, Wand2, Download, Copy,
    FileDown
} from 'lucide-react';
import { api, API_URL, tokenStorage } from '../services/api';

const TEMPLATES = [
    { value: 'hybrid',        label: 'Hybrid',        desc: 'Skills-led + chronological — best for immigrants' },
    { value: 'chronological', label: 'Chronological', desc: 'Classic US format — best for steady careers' },
    { value: 'skills_first',  label: 'Skills-first',  desc: 'Functional — best for career changers / gaps' }
];

// Mirror the server-side SUGGESTION_TYPES. The Apply/Skip buttons work
// for all of them; this just powers a friendly category label/icon.
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

export default function Editor() {
    const [resumes, setResumes] = useState([]);
    const [activeResumeId, setActiveResumeId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [suggestions, setSuggestions] = useState([]);
    const [suggesting, setSuggesting] = useState(false);
    const [busyId, setBusyId] = useState(null); // suggestion-card busy
    const [focus, setFocus] = useState('');
    const [language, setLanguage] = useState('English');

    // Builder modal state
    const [builderOpen, setBuilderOpen] = useState(false);
    const [builderTemplate, setBuilderTemplate] = useState('hybrid');
    const [builderLanguage, setBuilderLanguage] = useState('English');
    const [building, setBuilding] = useState(false);
    const [buildResult, setBuildResult] = useState(null); // { structured, markdown, plainText }
    const [downloading, setDownloading] = useState(false);
    const [copiedKey, setCopiedKey] = useState(null); // 'text' | 'markdown' for the brief checkmark feedback

    const activeResume = resumes.find(r => r.id === activeResumeId) || null;
    const data = activeResume?.parsedData || null;

    useEffect(() => {
        (async () => {
            try {
                const { resumes, activeResumeId } = await api.get('/api/resumes');
                setResumes(resumes);
                setActiveResumeId(activeResumeId);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // Switching resumes → clear stale suggestions
    useEffect(() => {
        setSuggestions([]);
    }, [activeResumeId]);

    const switchActive = async (newId) => {
        if (!newId || newId === activeResumeId) return;
        try {
            await api.post(`/api/resumes/${newId}/activate`);
            setActiveResumeId(newId);
        } catch (err) {
            setError(err.message);
        }
    };

    const generate = async () => {
        if (!activeResumeId || suggesting) return;
        setSuggesting(true);
        setError(null);
        try {
            const { suggestions } = await api.post(
                `/api/resumes/${activeResumeId}/suggestions`,
                { language, focus: focus.trim() || undefined }
            );
            setSuggestions(suggestions || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setSuggesting(false);
        }
    };

    const apply = async (suggestion) => {
        setBusyId(suggestion.id);
        try {
            const { resume } = await api.post(
                `/api/resumes/${activeResumeId}/apply-suggestion`,
                { suggestion }
            );
            // Replace the resume in our local list with the updated version
            setResumes(prev => prev.map(r => r.id === resume.id ? resume : r));
            // Drop this suggestion from the visible list
            setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
        } catch (err) {
            setError(err.message);
        } finally {
            setBusyId(null);
        }
    };

    const skip = (suggestion) => {
        setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
    };

    // ----- Builder ---------------------------------------------
    const openBuilder = () => {
        if (!activeResumeId) return;
        // Default the modal's language to whatever the Coach is set to —
        // user probably wants advice + output in the same language
        setBuilderLanguage(language);
        setBuilderOpen(true);
        setBuildResult(null);
    };

    const closeBuilder = () => {
        setBuilderOpen(false);
        setBuildResult(null);
    };

    const runBuild = async () => {
        if (!activeResumeId || building) return;
        setBuilding(true);
        setError(null);
        try {
            const data = await api.post(
                `/api/resumes/${activeResumeId}/build`,
                { template: builderTemplate, language: builderLanguage }
            );
            setBuildResult(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setBuilding(false);
        }
    };

    const copyToClipboard = async (text, key) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedKey(key);
            setTimeout(() => setCopiedKey(null), 1500);
        } catch (err) {
            setError('Copy failed — your browser may have blocked clipboard access');
        }
    };

    // Manual fetch for the binary .docx — the JSON-only api wrapper
    // can't return blobs. Token attached the same way for consistency.
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
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            setError(err.message);
        } finally {
            setDownloading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-indigo-300/70">
                <Loader2 className="w-8 h-8 animate-spin mb-3" />
                <p>Loading studio…</p>
            </div>
        );
    }

    // Empty state — no resumes yet
    if (resumes.length === 0) {
        return (
            <div className="max-w-3xl mx-auto bg-indigo-950/60 border border-indigo-900/50 rounded-2xl p-12 text-center backdrop-blur-md">
                <Wand2 className="w-12 h-12 text-indigo-400/50 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-white mb-2">No resume to coach yet</h2>
                <p className="text-indigo-300/70 mb-6">
                    Upload a resume first — the studio will help you improve it line by line.
                </p>
                <Link
                    to="/analyze"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-500/20 transition"
                >
                    Upload a resume
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header bar with resume switcher + language */}
            <div className="mb-6 flex flex-wrap items-center gap-3 bg-indigo-950/60 border border-indigo-900/50 rounded-2xl px-4 py-3 backdrop-blur-md">
                <div className="flex items-center gap-2 text-indigo-200/80 text-sm shrink-0">
                    <FileText className="w-4 h-4 text-indigo-300" />
                    Editing:
                </div>
                <div className="relative flex-1 min-w-[200px]">
                    <select
                        value={activeResumeId || ''}
                        onChange={(e) => switchActive(e.target.value)}
                        className="w-full appearance-none bg-indigo-900/40 border border-indigo-800/50 rounded-xl pl-3 pr-9 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                        {resumes.map(r => (
                            <option key={r.id} value={r.id} className="bg-indigo-950">{r.label}</option>
                        ))}
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-indigo-300 pointer-events-none" />
                </div>
                <Link
                    to="/resumes"
                    className="flex items-center gap-1.5 text-sm text-indigo-300 hover:text-white px-3 py-2 rounded-xl hover:bg-white/5 transition shrink-0"
                >
                    <FolderOpen className="w-4 h-4" />
                    Manage
                </Link>
                <Link
                    to="/analyze"
                    className="flex items-center gap-1.5 text-sm text-white px-3 py-2 rounded-xl bg-indigo-600/40 hover:bg-indigo-600 border border-indigo-500/40 transition shrink-0"
                    title="Re-rank jobs against your updated resume"
                >
                    <Search className="w-4 h-4" />
                    Re-rank jobs
                </Link>
                <button
                    onClick={openBuilder}
                    className="flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-amber-950 shadow-lg shadow-amber-500/20 transition shrink-0"
                    title="Generate a US-tailored version of this resume"
                >
                    <Wand2 className="w-4 h-4" />
                    Build US Resume
                </button>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* LEFT — read-only resume preview */}
                <div className="bg-indigo-950/60 border border-indigo-900/50 rounded-2xl p-6 backdrop-blur-md">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-indigo-300" />
                        Your resume
                    </h2>
                    <ResumeView data={data} />
                </div>

                {/* RIGHT — AI Coach */}
                <div className="bg-indigo-950/60 border border-indigo-900/50 rounded-2xl p-6 backdrop-blur-md lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-amber-300" />
                        AI Coach
                    </h2>

                    {/* Language picker for rationales */}
                    <div className="mb-3">
                        <label className="text-xs font-medium text-indigo-300/70 flex items-center gap-1.5 mb-1">
                            <Languages className="w-3.5 h-3.5" />
                            Explain in
                        </label>
                        <div className="relative">
                            <select
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                className="w-full appearance-none bg-indigo-900/40 border border-indigo-800/50 rounded-xl pl-3 pr-9 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                            >
                                {LANGUAGES.map(l => (
                                    <option key={l.code} value={l.code} className="bg-indigo-950">{l.label}</option>
                                ))}
                            </select>
                            <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-indigo-300 pointer-events-none" />
                        </div>
                    </div>

                    {/* Optional user focus */}
                    <div className="mb-3">
                        <label className="text-xs font-medium text-indigo-300/70 mb-1 block">
                            What should the coach focus on? <span className="text-indigo-400/50">(optional)</span>
                        </label>
                        <input
                            type="text"
                            value={focus}
                            onChange={(e) => setFocus(e.target.value)}
                            placeholder="e.g. emphasize leadership, make bullets shorter"
                            className="w-full bg-indigo-900/40 border border-indigo-800/50 rounded-xl px-3 py-2 text-white text-sm placeholder-indigo-400/40 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <button
                        onClick={generate}
                        disabled={suggesting || !activeResumeId}
                        className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-700/40 disabled:cursor-not-allowed text-amber-950 font-semibold py-2.5 rounded-xl shadow-lg shadow-amber-500/20 transition mb-4"
                    >
                        {suggesting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Coaching…
                            </>
                        ) : (
                            <>
                                <Lightbulb className="w-4 h-4" />
                                {suggestions.length > 0 ? 'New suggestions' : 'Get suggestions'}
                            </>
                        )}
                    </button>

                    {/* Suggestion cards */}
                    {!suggesting && suggestions.length === 0 && (
                        <div className="text-center py-10 bg-white/5 rounded-xl border border-dashed border-white/10">
                            <p className="text-indigo-200/50 text-sm">
                                Click <span className="font-semibold text-amber-300">Get suggestions</span> to see specific ways to strengthen this resume.
                            </p>
                        </div>
                    )}

                    <div className="space-y-3">
                        {suggestions.map(s => {
                            const meta = TYPE_META[s.type] || { label: s.type, verb: 'Update' };
                            const isBusy = busyId === s.id;
                            return (
                                <div key={s.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                            {meta.verb} · {meta.label}
                                        </span>
                                    </div>

                                    {s.currentText && s.currentText !== '[empty]' && (
                                        <div className="mb-2">
                                            <p className="text-xs text-indigo-300/60 mb-1">Currently</p>
                                            <p className="text-sm text-indigo-200/80 bg-indigo-900/30 border border-indigo-800/40 rounded-lg p-2.5 line-clamp-3">
                                                {s.currentText}
                                            </p>
                                        </div>
                                    )}

                                    <div className="mb-2 flex items-center gap-2">
                                        <ArrowRight className="w-4 h-4 text-amber-400/70 shrink-0" />
                                        <p className="text-xs text-amber-300/80">Suggested</p>
                                    </div>
                                    <p className="text-sm text-white bg-amber-500/10 border border-amber-500/30 rounded-lg p-2.5 mb-2">
                                        {s.suggestedText}
                                    </p>

                                    {s.rationale && (
                                        <p className="text-xs text-indigo-200/70 italic mb-3">
                                            {s.rationale}
                                        </p>
                                    )}

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => apply(s)}
                                            disabled={isBusy}
                                            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 transition disabled:opacity-50"
                                        >
                                            {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                            Apply
                                        </button>
                                        <button
                                            onClick={() => skip(s)}
                                            disabled={isBusy}
                                            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm text-indigo-200/80 hover:text-white hover:bg-white/5 border border-white/10 transition disabled:opacity-50"
                                        >
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
                <div
                    className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={closeBuilder}
                >
                    <div
                        className="bg-indigo-950 border border-indigo-800/60 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-indigo-900/50 sticky top-0 bg-indigo-950 z-10">
                            <div className="flex items-center gap-2">
                                <div className="bg-amber-500/20 p-1.5 rounded-lg">
                                    <Wand2 className="w-5 h-5 text-amber-300" />
                                </div>
                                <h2 className="text-lg font-semibold text-white">Build US Resume</h2>
                            </div>
                            <button
                                onClick={closeBuilder}
                                className="p-2 rounded-lg text-indigo-200/70 hover:text-white hover:bg-white/5 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-5">
                            {/* Template picker */}
                            <div>
                                <label className="text-xs font-medium text-indigo-300/70 mb-2 block">Template</label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    {TEMPLATES.map(tmpl => {
                                        const active = builderTemplate === tmpl.value;
                                        return (
                                            <button
                                                key={tmpl.value}
                                                onClick={() => { setBuilderTemplate(tmpl.value); setBuildResult(null); }}
                                                className={`text-left p-3 rounded-xl border transition ${
                                                    active
                                                        ? 'bg-amber-500/15 border-amber-500/50 ring-2 ring-amber-500/30'
                                                        : 'bg-indigo-900/40 border-indigo-800/50 hover:border-indigo-700'
                                                }`}
                                            >
                                                <p className={`text-sm font-semibold ${active ? 'text-amber-200' : 'text-white'}`}>{tmpl.label}</p>
                                                <p className="text-xs text-indigo-300/70 mt-1">{tmpl.desc}</p>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Language picker */}
                            <div>
                                <label className="text-xs font-medium text-indigo-300/70 mb-1 flex items-center gap-1.5">
                                    <Languages className="w-3.5 h-3.5" />
                                    Output language
                                </label>
                                <div className="relative">
                                    <select
                                        value={builderLanguage}
                                        onChange={(e) => { setBuilderLanguage(e.target.value); setBuildResult(null); }}
                                        className="w-full appearance-none bg-indigo-900/40 border border-indigo-800/50 rounded-xl pl-3 pr-9 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                                    >
                                        {LANGUAGES.map(l => (
                                            <option key={l.code} value={l.code} className="bg-indigo-950">{l.label}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-indigo-300 pointer-events-none" />
                                </div>
                            </div>

                            {/* Generate */}
                            <button
                                onClick={runBuild}
                                disabled={building}
                                className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-700/40 disabled:cursor-not-allowed text-amber-950 font-semibold py-2.5 rounded-xl shadow-lg shadow-amber-500/20 transition"
                            >
                                {building ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Building…
                                    </>
                                ) : (
                                    <>
                                        <Wand2 className="w-4 h-4" />
                                        {buildResult ? 'Rebuild' : 'Generate US-tailored resume'}
                                    </>
                                )}
                            </button>

                            {/* Result */}
                            {buildResult && (
                                <div className="border-t border-indigo-900/50 pt-5 space-y-3">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="text-sm text-indigo-200/80 flex-1 min-w-[200px]">
                                            Preview below. Copy as plain text for ATS / job sites, or download .docx for Word.
                                        </p>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => copyToClipboard(buildResult.plainText, 'text')}
                                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-indigo-500/10 hover:bg-indigo-500/25 text-indigo-200 border border-indigo-500/30 transition"
                                            >
                                                {copiedKey === 'text' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                                Copy text
                                            </button>
                                            <button
                                                onClick={() => copyToClipboard(buildResult.markdown, 'markdown')}
                                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-indigo-500/10 hover:bg-indigo-500/25 text-indigo-200 border border-indigo-500/30 transition"
                                            >
                                                {copiedKey === 'markdown' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                                Copy markdown
                                            </button>
                                            <button
                                                onClick={downloadDocx}
                                                disabled={downloading}
                                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 transition disabled:opacity-50"
                                            >
                                                {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                                                Download .docx
                                            </button>
                                        </div>
                                    </div>
                                    <div className="rounded-xl overflow-y-auto max-h-[60vh] bg-white shadow-inner">
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

// ------------------------------------------------------------
// BuiltResumePreview — paper-like preview of the US-tailored resume
// ------------------------------------------------------------
// Renders the SAME structured shape that backend's renderDocx() and
// renderMarkdown() consume. Keeping all three renderers in sync gives
// the user a true preview of what they'll download as .docx.
//
// Section order mirrors backend's SECTION_ORDER per template.
// ------------------------------------------------------------
const SECTION_ORDER = {
    chronological: ['summary', 'experience', 'skills', 'education', 'certifications'],
    hybrid:        ['summary', 'skills', 'experience', 'education', 'certifications'],
    skills_first:  ['summary', 'skills', 'certifications', 'education', 'experience']
};

function BuiltResumePreview({ structured }) {
    if (!structured) return null;
    const order = SECTION_ORDER[structured.template] || SECTION_ORDER.chronological;

    const contactBits = [
        structured.contact?.email,
        structured.contact?.phone,
        structured.contact?.location,
        structured.contact?.url
    ].filter(Boolean);

    return (
        <div className="bg-white text-gray-900 px-10 py-8 font-serif leading-relaxed" style={{ minHeight: 600 }}>
            {/* Header */}
            {structured.name && (
                <h1 className="text-3xl font-bold text-center tracking-tight">
                    {structured.name}
                </h1>
            )}
            {contactBits.length > 0 && (
                <p className="text-center text-sm text-gray-600 mt-1">
                    {contactBits.join('  •  ')}
                </p>
            )}

            <div className="space-y-5 mt-6">
                {order.map((section) => {
                    switch (section) {
                        case 'summary':
                            if (!structured.summary) return null;
                            return (
                                <Section key="summary" title="Summary">
                                    <p className="text-[15px] text-gray-800">{structured.summary}</p>
                                </Section>
                            );

                        case 'skills':
                            if (!structured.skills || (Array.isArray(structured.skills) && structured.skills.length === 0)) return null;
                            return (
                                <Section key="skills" title="Skills">
                                    {Array.isArray(structured.skills) && structured.skills.length > 0 && typeof structured.skills[0] === 'object' ? (
                                        // Categorized
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
                                                {exp.location && (
                                                    <p className="text-[13px] text-gray-600 italic">{exp.location}</p>
                                                )}
                                                {Array.isArray(exp.bullets) && exp.bullets.length > 0 && (
                                                    <ul className="list-disc list-outside ml-5 mt-1 space-y-0.5">
                                                        {exp.bullets.map((b, j) => (
                                                            <li key={j} className="text-[14px] text-gray-800">{b}</li>
                                                        ))}
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
                                        {structured.certifications.map((c, i) => (
                                            <li key={i} className="text-[14px] text-gray-800">{c}</li>
                                        ))}
                                    </ul>
                                </Section>
                            );

                        default:
                            return null;
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

// ------------------------------------------------------------
// ResumeView — read-only structured display of the parsed resume.
// Kept tight; not trying to replace AnalysisResults' fancy version.
// ------------------------------------------------------------
function ResumeView({ data }) {
    if (!data) return <p className="text-indigo-200/50 italic">No resume data.</p>;

    return (
        <div className="space-y-5 text-sm">
            {data.name && (
                <div>
                    <h3 className="text-white text-xl font-bold">{data.name}</h3>
                    {data.originalLanguage && (
                        <p className="text-indigo-300/60 text-xs mt-0.5">Original language: {data.originalLanguage}</p>
                    )}
                </div>
            )}

            {data.summary && (
                <section>
                    <h4 className="text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-1.5">Summary</h4>
                    <p className="text-indigo-100/90">{data.summary}</p>
                </section>
            )}

            {Array.isArray(data.skills) && data.skills.length > 0 && (
                <section>
                    <h4 className="text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-1.5">Skills</h4>
                    <div className="flex flex-wrap gap-1.5">
                        {data.skills.map((s, i) => (
                            <span key={i} className="px-2 py-0.5 rounded-full bg-indigo-900/40 border border-indigo-800/50 text-indigo-100 text-xs">
                                {s}
                            </span>
                        ))}
                    </div>
                </section>
            )}

            {Array.isArray(data.experience) && data.experience.length > 0 && (
                <section>
                    <h4 className="text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-1.5">Experience</h4>
                    <ul className="space-y-3">
                        {data.experience.map((e, i) => (
                            <li key={i} className="border-l-2 border-indigo-700/50 pl-3">
                                <p className="text-white font-semibold">{e.title}</p>
                                <p className="text-indigo-300/70 text-xs">{e.company} · {e.duration}</p>
                                {e.responsibilities && (
                                    <p className="text-indigo-100/80 text-xs mt-1">{e.responsibilities}</p>
                                )}
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {Array.isArray(data.education) && data.education.length > 0 && (
                <section>
                    <h4 className="text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-1.5">Education</h4>
                    <ul className="space-y-2">
                        {data.education.map((e, i) => (
                            <li key={i} className="text-indigo-100/90">
                                <span className="font-semibold">{e.degree}</span>
                                <span className="text-indigo-300/70 text-xs"> · {e.institution} · {e.year}</span>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {data.usEquivalents && (data.usEquivalents.degreeEquivalent || data.usEquivalents.certifications) && (
                <section>
                    <h4 className="text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-1.5">US Equivalents</h4>
                    {data.usEquivalents.degreeEquivalent && (
                        <p className="text-indigo-100/90"><span className="text-indigo-400/70">Degree:</span> {data.usEquivalents.degreeEquivalent}</p>
                    )}
                    {data.usEquivalents.certifications && (
                        <p className="text-indigo-100/90"><span className="text-indigo-400/70">Recommended certs:</span> {data.usEquivalents.certifications}</p>
                    )}
                </section>
            )}

            {Array.isArray(data.recommendedJobTitles) && data.recommendedJobTitles.length > 0 && (
                <section>
                    <h4 className="text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-1.5">Target roles</h4>
                    <div className="flex flex-wrap gap-1.5">
                        {data.recommendedJobTitles.map((r, i) => (
                            <span key={i} className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
                                {r}
                            </span>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
