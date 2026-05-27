// ============================================================
// Jobs — pipeline page with two tabs: Saved | Applications
// ============================================================
// Loads both lists in parallel on mount, lets the user manage them.
// Light + dark mode supported.
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

// Light + dark variants per status. Cls applied to the dropdown pill.
const STATUS_OPTIONS = [
    { value: 'APPLIED',      label: 'Applied',
      cls: 'bg-sky-100 text-sky-700 border-sky-300 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/40' },
    { value: 'INTERVIEWING', label: 'Interviewing',
      cls: 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-500/15 dark:text-purple-300 dark:border-purple-500/40' },
    { value: 'OFFERED',      label: 'Offered',
      cls: 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/40' },
    { value: 'REJECTED',     label: 'Rejected',
      cls: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/40' },
    { value: 'WITHDRAWN',    label: 'Withdrawn',
      cls: 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-700/40 dark:text-slate-400 dark:border-slate-600' }
];
const statusOpt = (v) => STATUS_OPTIONS.find(s => s.value === v) || STATUS_OPTIONS[0];

const matchBadge = (score) => {
    if (typeof score !== 'number') return null;
    const pct = Math.max(0, Math.round(score * 100));
    let cls;
    if      (score >= 0.70) cls = 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/40';
    else if (score >= 0.55) cls = 'bg-sky-100 text-sky-700 border-sky-300 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/40';
    else if (score >= 0.40) cls = 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/40';
    else                    cls = 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-700/40 dark:text-slate-400 dark:border-slate-600';
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

    const appliedAdzunaIds = new Set(applications.map(a => a.adzunaId));

    const load = async () => {
        try {
            const [savedRes, appsRes] = await Promise.all([
                api.get('/api/saved'),
                api.get('/api/applications')
            ]);
            setSavedJobs(savedRes.savedJobs);
            setApplications(appsRes.applications);
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    };
    useEffect(() => { load(); }, []);

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
                adzunaId: savedJob.adzunaId, title: savedJob.title,
                company: savedJob.company, applyUrl: savedJob.applyUrl
            });
            setApplications(prev => {
                const without = prev.filter(a => a.id !== application.id);
                return [application, ...without];
            });
        } catch (err) { setError(err.message); }
        finally { setBusyId(null); }
    };

    const updateStatus = async (id, status) => {
        setBusyId(id);
        setApplications(prev => prev.map(a => a.id === id ? { ...a, status } : a));
        try {
            await api.patch(`/api/applications/${id}`, { status });
        } catch (err) {
            setError(err.message);
            load();
        } finally { setBusyId(null); }
    };

    const updateNotes = async (id, notes) => {
        try { await api.patch(`/api/applications/${id}`, { notes }); }
        catch (err) { setError(err.message); }
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
            <div className="flex flex-col items-center justify-center py-24
                            text-slate-500 dark:text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mb-3" />
                <p>Loading your jobs…</p>
            </div>
        );
    }

    const tabBtn = (key, label, Icon, count) => {
        const active = tab === key;
        return (
            <button onClick={() => setTab(key)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                        active
                            ? 'bg-sky-600 text-white dark:bg-sky-600'
                            : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}>
                <Icon className="w-4 h-4" />
                {label}
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                    active
                        ? 'bg-white/25 text-white'
                        : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}>
                    {count}
                </span>
            </button>
        );
    };

    // Reusable card wrapper class
    const cardCls = "rounded-2xl p-5 transition-colors " +
                    "bg-white border border-slate-200 hover:border-slate-300 " +
                    "dark:bg-slate-900 dark:border-slate-800 dark:hover:border-slate-700";

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-20">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Your jobs</h1>
                <p className="mt-1 text-slate-500 dark:text-slate-400">Saved bookmarks and applications you're tracking.</p>
            </div>

            <div className="flex gap-2 mb-6 p-1.5 w-fit rounded-2xl
                            bg-slate-100 border border-slate-200
                            dark:bg-slate-900 dark:border-slate-800">
                {tabBtn('saved', 'Saved', Bookmark, savedJobs.length)}
                {tabBtn('applications', 'Applications', Briefcase, applications.length)}
            </div>

            {error && (
                <div className="mb-4 p-3 rounded-xl text-sm
                                bg-red-50 border border-red-200 text-red-700
                                dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-300">
                    {error}
                </div>
            )}

            {tab === 'saved' && (
                savedJobs.length === 0 ? (
                    <div className="rounded-2xl p-12 text-center
                                    bg-white border border-slate-200
                                    dark:bg-slate-900 dark:border-slate-800">
                        <Bookmark className="w-12 h-12 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                        <h2 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">No saved jobs yet</h2>
                        <p className="mb-6 text-slate-500 dark:text-slate-400">Click the heart on any job in your matches to save it for later.</p>
                        <Link to="/analyze"
                              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-colors
                                         bg-sky-600 hover:bg-sky-700 text-white
                                         dark:bg-sky-600 dark:hover:bg-sky-500">
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
                                <div key={j.id} className={cardCls}>
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <h3 className="text-lg font-semibold flex-1 text-slate-900 dark:text-white">{j.title}</h3>
                                        {badge && (
                                            <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-bold shrink-0 ${badge.cls}`}>
                                                <Sparkles className="w-3 h-3" />
                                                {badge.pct}%
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm mb-4 text-slate-600 dark:text-slate-400">
                                        {j.company  && <span className="flex items-center gap-1.5"><Building className="w-4 h-4" />{j.company}</span>}
                                        {j.location && <span className="flex items-center gap-1.5"><MapPin   className="w-4 h-4" />{j.location}</span>}
                                        {salary     && <span className="flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-400"><DollarSign className="w-4 h-4" />{salary}</span>}
                                    </div>
                                    {j.description && (
                                        <p className="text-xs mb-4 line-clamp-2 text-slate-500 dark:text-slate-500">{j.description}</p>
                                    )}
                                    <div className="flex flex-wrap gap-2">
                                        <a href={j.applyUrl} target="_blank" rel="noopener noreferrer"
                                           className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors
                                                      bg-sky-600 hover:bg-sky-700 text-white
                                                      dark:bg-sky-600 dark:hover:bg-sky-500">
                                            View Job
                                            <ExternalLink className="w-3.5 h-3.5" />
                                        </a>
                                        {alreadyApplied ? (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border
                                                             bg-emerald-100 text-emerald-700 border-emerald-300
                                                             dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/40">
                                                <Check className="w-3.5 h-3.5" />
                                                Applied
                                            </span>
                                        ) : (
                                            <button onClick={() => markAppliedFromSaved(j)} disabled={isBusy}
                                                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-colors cursor-pointer disabled:opacity-50
                                                               bg-white border-slate-300 text-slate-700 hover:bg-emerald-50 hover:border-emerald-400 hover:text-emerald-700
                                                               dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-emerald-500/15 dark:hover:border-emerald-500/40 dark:hover:text-emerald-300">
                                                Mark applied
                                            </button>
                                        )}
                                        <button onClick={() => unsave(j.id)} disabled={isBusy}
                                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-colors cursor-pointer disabled:opacity-50 ml-auto
                                                           bg-white border-slate-300 text-slate-700 hover:bg-pink-50 hover:border-pink-400 hover:text-pink-700
                                                           dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-pink-500/15 dark:hover:border-pink-500/40 dark:hover:text-pink-300"
                                                title="Unsave">
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
                    <div className="rounded-2xl p-12 text-center
                                    bg-white border border-slate-200
                                    dark:bg-slate-900 dark:border-slate-800">
                        <Briefcase className="w-12 h-12 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                        <h2 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">No applications tracked yet</h2>
                        <p className="mb-6 text-slate-500 dark:text-slate-400">When you apply to a job, click "Mark applied" to track its status here.</p>
                        <Link to="/analyze"
                              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-colors
                                         bg-sky-600 hover:bg-sky-700 text-white
                                         dark:bg-sky-600 dark:hover:bg-sky-500">
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
                                <div key={a.id} className={cardCls}>
                                    <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{a.title}</h3>
                                            {a.company && (
                                                <p className="text-sm flex items-center gap-1.5 mt-1 text-slate-600 dark:text-slate-400">
                                                    <Building className="w-3.5 h-3.5" />
                                                    {a.company}
                                                </p>
                                            )}
                                        </div>
                                        <select value={a.status} onChange={(e) => updateStatus(a.id, e.target.value)} disabled={isBusy}
                                                className={`appearance-none cursor-pointer text-xs font-bold px-3 py-1.5 rounded-full border focus:outline-none focus:ring-2 focus:ring-sky-500 ${opt.cls}`}>
                                            {STATUS_OPTIONS.map(s => (
                                                <option key={s.value} value={s.value} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">{s.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="mt-3">
                                        <label className="flex items-center gap-1.5 text-xs font-medium mb-1 text-slate-500 dark:text-slate-400">
                                            <StickyNote className="w-3.5 h-3.5" />
                                            Notes
                                        </label>
                                        <textarea defaultValue={a.notes || ''}
                                                  onBlur={(e) => {
                                                      if (e.target.value !== (a.notes || '')) updateNotes(a.id, e.target.value);
                                                  }}
                                                  placeholder="Interview Tuesday, contacted recruiter, etc."
                                                  rows={2}
                                                  className="w-full rounded-xl px-3 py-2 text-sm resize-y
                                                             bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400
                                                             dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder-slate-500
                                                             focus:outline-none focus:ring-2 focus:ring-sky-500" />
                                    </div>

                                    <div className="flex flex-wrap gap-2 mt-3 text-xs text-slate-500 dark:text-slate-500">
                                        <span>Applied {new Date(a.appliedAt).toLocaleDateString()}</span>
                                    </div>

                                    <div className="flex flex-wrap gap-2 mt-3">
                                        <a href={a.applyUrl} target="_blank" rel="noopener noreferrer"
                                           className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors
                                                      bg-sky-600 hover:bg-sky-700 text-white
                                                      dark:bg-sky-600 dark:hover:bg-sky-500">
                                            View Job
                                            <ExternalLink className="w-3.5 h-3.5" />
                                        </a>
                                        <button onClick={() => deleteApplication(a.id)} disabled={isBusy}
                                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-colors cursor-pointer disabled:opacity-50 ml-auto
                                                           bg-white border-slate-300 text-slate-700 hover:bg-red-50 hover:border-red-400 hover:text-red-700
                                                           dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-red-500/15 dark:hover:border-red-500/40 dark:hover:text-red-300">
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
