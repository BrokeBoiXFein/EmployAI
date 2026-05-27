import React from 'react';
import {
    Search, Loader2, Building, MapPin, DollarSign, ExternalLink,
    Sparkles, Heart, Check
} from 'lucide-react';

// Cosine similarity → UI bits. Light + dark color variants.
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

const JobMatches = ({ jobs, loading, t, formatSalary, stripHtml, savedIds, appliedIds, onToggleSave, onMarkApplied }) => {
    return (
        <div className="rounded-2xl p-6 sm:p-8 h-fit sticky top-24
                        bg-white border border-slate-200
                        dark:bg-slate-900 dark:border-slate-800">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl
                                    bg-sky-100 text-sky-700
                                    dark:bg-sky-500/15 dark:text-sky-400">
                        <Search className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t.matchingJobs}</h2>
                </div>
                {loading && <Loader2 className="w-5 h-5 animate-spin text-sky-600 dark:text-sky-400" />}
            </div>

            {loading && (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <div className="relative">
                        <div className="w-14 h-14 border-4 rounded-full border-sky-200 dark:border-sky-500/20" />
                        <div className="w-14 h-14 border-4 border-t-transparent rounded-full animate-spin absolute top-0 left-0
                                        border-sky-600 dark:border-sky-400" />
                    </div>
                    <span className="font-medium text-sm animate-pulse text-slate-500 dark:text-slate-400">{t.searchingJobs}</span>
                </div>
            )}

            {!loading && jobs.length === 0 && (
                <div className="text-center py-16 rounded-2xl border border-dashed
                                bg-slate-50 border-slate-300
                                dark:bg-slate-800/40 dark:border-slate-700">
                    <p className="italic text-slate-500 dark:text-slate-400">{t.noJobsFound}</p>
                </div>
            )}

            <div className="max-h-[700px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                {jobs.map((job, idx) => {
                    const badge = matchBadge(job.matchScore);
                    const jobId = String(job.id);
                    const isSaved = savedIds?.has(jobId);
                    const isApplied = appliedIds?.has(jobId);
                    return (
                        <div key={idx}
                             className="group rounded-xl p-5 transition-colors
                                        bg-slate-50 border border-slate-200 hover:border-sky-400
                                        dark:bg-slate-800/40 dark:border-slate-700 dark:hover:border-sky-500/50">
                            <div className="flex items-start justify-between gap-3 mb-3">
                                <h3 className="font-bold text-lg line-clamp-2 flex-1 text-slate-900 dark:text-white group-hover:text-sky-700 dark:group-hover:text-sky-300 transition-colors">
                                    {job.title}
                                </h3>
                                <div className="flex items-center gap-2 shrink-0">
                                    {badge && (
                                        <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-bold ${badge.cls}`}
                                              title="Semantic similarity between your resume and this job">
                                            <Sparkles className="w-3 h-3" />
                                            {badge.pct}% match
                                        </span>
                                    )}
                                    {onToggleSave && (
                                        <button onClick={() => onToggleSave(job)}
                                                className={`p-2 rounded-full border transition-colors cursor-pointer ${
                                                    isSaved
                                                        ? 'bg-pink-100 border-pink-300 text-pink-600 hover:bg-pink-200 dark:bg-pink-500/15 dark:border-pink-500/40 dark:text-pink-300 dark:hover:bg-pink-500/25'
                                                        : 'bg-white border-slate-200 text-slate-500 hover:text-pink-600 hover:bg-pink-50 hover:border-pink-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:text-pink-300 dark:hover:bg-pink-500/10 dark:hover:border-pink-500/40'
                                                }`}
                                                title={isSaved ? 'Unsave' : 'Save for later'}>
                                            <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-1.5 mb-4 text-sm text-slate-600 dark:text-slate-400">
                                <div className="flex items-center gap-2">
                                    <Building className="w-4 h-4 shrink-0" />
                                    <span className="truncate">{job.company?.display_name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 shrink-0" />
                                    <span className="truncate">{job.location?.display_name}</span>
                                </div>
                                {job.salary_min && (
                                    <div className="flex items-center gap-2 font-semibold text-emerald-700 dark:text-emerald-400">
                                        <DollarSign className="w-4 h-4 shrink-0" />
                                        <span>{formatSalary({ min: job.salary_min, max: job.salary_max })}</span>
                                    </div>
                                )}
                            </div>

                            <p className="text-xs mb-5 line-clamp-3 leading-relaxed text-slate-500 dark:text-slate-400">
                                {stripHtml(job.description)}
                            </p>

                            <div className="flex gap-2">
                                <a href={job.redirect_url} target="_blank" rel="noopener noreferrer"
                                   className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-colors
                                              bg-sky-600 hover:bg-sky-700 text-white
                                              dark:bg-sky-600 dark:hover:bg-sky-500">
                                    {t.viewJob}
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                                {onMarkApplied && (
                                    isApplied ? (
                                        <span className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold border
                                                         bg-emerald-100 text-emerald-700 border-emerald-300
                                                         dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/40"
                                              title="You've marked this as applied">
                                            <Check className="w-4 h-4" />
                                            Applied
                                        </span>
                                    ) : (
                                        <button onClick={() => onMarkApplied(job)}
                                                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-colors cursor-pointer
                                                           bg-white border-slate-200 text-slate-700 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700
                                                           dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-emerald-500/15 dark:hover:border-emerald-500/40 dark:hover:text-emerald-300"
                                                title="Record that you applied to this job">
                                            Mark applied
                                        </button>
                                    )
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default JobMatches;
