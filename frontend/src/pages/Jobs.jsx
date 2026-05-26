// ============================================================
// Jobs — pipeline page with two tabs: Saved | Applications
// ============================================================
// Loads both lists in parallel on mount, lets the user manage them.
//
//   Saved tab        → cards with unsave + mark-applied actions
//   Applications tab → cards with status dropdown + notes editor
// ============================================================

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Bookmark, Briefcase, Heart, Trash2, ExternalLink, Building, MapPin,
    DollarSign, Sparkles, Loader2, Check, StickyNote, Search
} from 'lucide-react';
import { api } from '../services/api';

const STATUS_OPTIONS = [
    { value: 'APPLIED',      label: 'Applied',      cls: 'bg-blue-500/15 text-blue-300 border-blue-500/40' },
    { value: 'INTERVIEWING', label: 'Interviewing', cls: 'bg-purple-500/15 text-purple-300 border-purple-500/40' },
    { value: 'OFFERED',      label: 'Offered',      cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40' },
    { value: 'REJECTED',     label: 'Rejected',     cls: 'bg-red-500/15 text-red-300 border-red-500/40' },
    { value: 'WITHDRAWN',    label: 'Withdrawn',    cls: 'bg-gray-500/15 text-gray-400 border-gray-500/30' }
];
const statusOpt = (v) => STATUS_OPTIONS.find(s => s.value === v) || STATUS_OPTIONS[0];

const matchBadge = (score) => {
    if (typeof score !== 'number') return null;
    const pct = Math.max(0, Math.round(score * 100));
    let cls;
    if      (score >= 0.70) cls = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40';
    else if (score >= 0.55) cls = 'bg-blue-500/15 text-blue-300 border-blue-500/40';
    else if (score >= 0.40) cls = 'bg-amber-500/15 text-amber-300 border-amber-500/40';
    else                    cls = 'bg-gray-500/15 text-gray-400 border-gray-500/30';
    return { pct, cls };
};

const fmtSalary = (min, max) => {
    if (!min && !max) return null;
    const f = (v) => `$${Math.round(v).toLocaleString()}`;
    if (min && max) return `${f(min)} – ${f(max)}`;
    return f(min || max);
};

export default function Jobs() {
    const [tab, setTab] = useState('saved');
    const [savedJobs, setSavedJobs] = useState([]);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [busyId, setBusyId] = useState(null);

    // Track applied Adzuna ids derived from the applications list — used to
    // hide the "Mark applied" button on saved jobs the user already applied to.
    const appliedAdzunaIds = new Set(applications.map(a => a.adzunaId));

    const load = async () => {
        try {
            const [savedRes, appsRes] = await Promise.all([
                api.get('/api/saved'),
                api.get('/api/applications')
            ]);
            setSavedJobs(savedRes.savedJobs);
            setApplications(appsRes.applications);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => { load(); }, []);

    // --- Saved-tab actions -----------------------------------
    const unsave = async (id) => {
        setBusyId(id);
        try {
            await api.del(`/api/saved/${id}`);
            setSavedJobs(prev => prev.filter(j => j.id !== id));
        } catch (err) { setError(err.message); }
        finally { setBusyId(null); }
    };

    const markAppliedFromSaved = async (savedJob) => {
        setBusyId(savedJob.id);
        try {
            const { application } = await api.post('/api/applications', {
                adzunaId: savedJob.adzunaId,
                title: savedJob.title,
                company: savedJob.company,
                applyUrl: savedJob.applyUrl
            });
            // Add to applications list (or replace if it already existed)
            setApplications(prev => {
                const without = prev.filter(a => a.id !== application.id);
                return [application, ...without];
            });
        } catch (err) { setError(err.message); }
        finally { setBusyId(null); }
    };

    // --- Applications-tab actions ----------------------------
    const updateStatus = async (id, status) => {
        setBusyId(id);
        // Optimistic update
        setApplications(prev => prev.map(a => a.id === id ? { ...a, status } : a));
        try {
            await api.patch(`/api/applications/${id}`, { status });
        } catch (err) {
            setError(err.message);
            load(); // refetch on failure to recover correct state
        } finally { setBusyId(null); }
    };

    const updateNotes = async (id, notes) => {
        // Debounced-style: just send on blur, no busy indicator
        try {
            await api.patch(`/api/applications/${id}`, { notes });
        } catch (err) {
            setError(err.message);
        }
    };

    const deleteApplication = async (id) => {
        if (!confirm('Delete this application record?')) return;
        setBusyId(id);
        try {
            await api.del(`/api/applications/${id}`);
            setApplications(prev => prev.filter(a => a.id !== id));
        } catch (err) { setError(err.message); }
        finally { setBusyId(null); }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-indigo-300/70">
                <Loader2 className="w-8 h-8 animate-spin mb-3" />
                <p>Loading your jobs…</p>
            </div>
        );
    }

    const tabBtn = (key, label, icon, count) => {
        const active = tab === key;
        const Icon = icon;
        return (
            <button
                onClick={() => setTab(key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    active
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                        : 'text-indigo-200/70 hover:text-white hover:bg-white/5'
                }`}
            >
                <Icon className="w-4 h-4" />
                {label}
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${active ? 'bg-white/20' : 'bg-white/10'}`}>
                    {count}
                </span>
            </button>
        );
    };

    return (
        <div className="max-w-5xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white">Your jobs</h1>
                <p className="text-indigo-300/70 mt-1">Saved bookmarks and applications you're tracking.</p>
            </div>

            <div className="flex gap-2 mb-6 bg-indigo-950/40 border border-indigo-900/40 rounded-2xl p-1.5 w-fit">
                {tabBtn('saved', 'Saved', Bookmark, savedJobs.length)}
                {tabBtn('applications', 'Applications', Briefcase, applications.length)}
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm">
                    {error}
                </div>
            )}

            {tab === 'saved' && (
                savedJobs.length === 0 ? (
                    <div className="bg-indigo-950/60 border border-indigo-900/50 rounded-2xl p-12 text-center backdrop-blur-md">
                        <Bookmark className="w-12 h-12 text-indigo-400/50 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-white mb-2">No saved jobs yet</h2>
                        <p className="text-indigo-300/70 mb-6">Click the heart on any job in your matches to save it for later.</p>
                        <Link
                            to="/analyze"
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-500/20 transition"
                        >
                            <Search className="w-4 h-4" />
                            Find jobs
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {savedJobs.map((j) => {
                            const badge = matchBadge(j.matchScore);
                            const salary = fmtSalary(j.salaryMin, j.salaryMax);
                            const alreadyApplied = appliedAdzunaIds.has(j.adzunaId);
                            const isBusy = busyId === j.id;
                            return (
                                <div key={j.id} className="bg-indigo-950/60 border border-indigo-900/50 hover:border-indigo-800/70 rounded-2xl p-5 backdrop-blur-md transition">
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <h3 className="text-lg font-semibold text-white flex-1">{j.title}</h3>
                                        {badge && (
                                            <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-bold shrink-0 ${badge.cls}`}>
                                                <Sparkles className="w-3 h-3" />
                                                {badge.pct}%
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-indigo-300/70 mb-4">
                                        {j.company  && <span className="flex items-center gap-1.5"><Building className="w-4 h-4" />{j.company}</span>}
                                        {j.location && <span className="flex items-center gap-1.5"><MapPin   className="w-4 h-4" />{j.location}</span>}
                                        {salary     && <span className="flex items-center gap-1.5 text-emerald-400/80 font-semibold"><DollarSign className="w-4 h-4" />{salary}</span>}
                                    </div>
                                    {j.description && (
                                        <p className="text-indigo-200/50 text-xs mb-4 line-clamp-2">{j.description}</p>
                                    )}
                                    <div className="flex flex-wrap gap-2">
                                        <a
                                            href={j.applyUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-indigo-500/10 hover:bg-indigo-500 text-indigo-300 hover:text-white border border-indigo-500/20 hover:border-indigo-500 transition"
                                        >
                                            View Job
                                            <ExternalLink className="w-3.5 h-3.5" />
                                        </a>
                                        {alreadyApplied ? (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/40">
                                                <Check className="w-3.5 h-3.5" />
                                                Applied
                                            </span>
                                        ) : (
                                            <button
                                                onClick={() => markAppliedFromSaved(j)}
                                                disabled={isBusy}
                                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-white/5 hover:bg-emerald-500/15 text-indigo-200/80 hover:text-emerald-300 border border-white/10 hover:border-emerald-500/40 transition disabled:opacity-50"
                                            >
                                                Mark applied
                                            </button>
                                        )}
                                        <button
                                            onClick={() => unsave(j.id)}
                                            disabled={isBusy}
                                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-white/5 hover:bg-pink-500/15 text-indigo-200/80 hover:text-pink-300 border border-white/10 hover:border-pink-500/30 transition disabled:opacity-50 ml-auto"
                                            title="Unsave"
                                        >
                                            <Heart className="w-3.5 h-3.5 fill-current" />
                                            Unsave
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )
            )}

            {tab === 'applications' && (
                applications.length === 0 ? (
                    <div className="bg-indigo-950/60 border border-indigo-900/50 rounded-2xl p-12 text-center backdrop-blur-md">
                        <Briefcase className="w-12 h-12 text-indigo-400/50 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-white mb-2">No applications tracked yet</h2>
                        <p className="text-indigo-300/70 mb-6">When you apply to a job, click "Mark applied" to track its status here.</p>
                        <Link
                            to="/analyze"
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-500/20 transition"
                        >
                            <Search className="w-4 h-4" />
                            Find jobs
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {applications.map((a) => {
                            const opt = statusOpt(a.status);
                            const isBusy = busyId === a.id;
                            return (
                                <div key={a.id} className="bg-indigo-950/60 border border-indigo-900/50 hover:border-indigo-800/70 rounded-2xl p-5 backdrop-blur-md transition">
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-lg font-semibold text-white">{a.title}</h3>
                                            {a.company && (
                                                <p className="text-sm text-indigo-300/70 flex items-center gap-1.5 mt-1">
                                                    <Building className="w-3.5 h-3.5" />
                                                    {a.company}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <select
                                                value={a.status}
                                                onChange={(e) => updateStatus(a.id, e.target.value)}
                                                disabled={isBusy}
                                                className={`appearance-none cursor-pointer text-xs font-bold px-3 py-1.5 rounded-full border ${opt.cls} focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                                            >
                                                {STATUS_OPTIONS.map(s => (
                                                    <option key={s.value} value={s.value} className="bg-indigo-950 text-white">{s.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Notes — edit-on-blur. No save button needed. */}
                                    <div className="mt-3">
                                        <label className="flex items-center gap-1.5 text-xs font-medium text-indigo-300/70 mb-1">
                                            <StickyNote className="w-3.5 h-3.5" />
                                            Notes
                                        </label>
                                        <textarea
                                            defaultValue={a.notes || ''}
                                            onBlur={(e) => {
                                                if (e.target.value !== (a.notes || '')) updateNotes(a.id, e.target.value);
                                            }}
                                            placeholder="Interview Tuesday, contacted recruiter, etc."
                                            rows={2}
                                            className="w-full bg-indigo-900/30 border border-indigo-800/40 rounded-xl px-3 py-2 text-sm text-white placeholder-indigo-400/40 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
                                        />
                                    </div>

                                    <div className="flex flex-wrap gap-2 mt-3 text-xs text-indigo-400/70">
                                        <span>Applied {new Date(a.appliedAt).toLocaleDateString()}</span>
                                    </div>

                                    <div className="flex flex-wrap gap-2 mt-3">
                                        <a
                                            href={a.applyUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-indigo-500/10 hover:bg-indigo-500 text-indigo-300 hover:text-white border border-indigo-500/20 hover:border-indigo-500 transition"
                                        >
                                            View Job
                                            <ExternalLink className="w-3.5 h-3.5" />
                                        </a>
                                        <button
                                            onClick={() => deleteApplication(a.id)}
                                            disabled={isBusy}
                                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-white/5 hover:bg-red-500/15 text-indigo-200/80 hover:text-red-300 border border-white/10 hover:border-red-500/30 transition disabled:opacity-50 ml-auto"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )
            )}
        </div>
    );
}
