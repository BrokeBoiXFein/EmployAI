import React from 'react';
import {
    Loader2, Building, MapPin, DollarSign, ExternalLink, Heart, Check
} from 'lucide-react';
import { useLang } from '../store/lang';

// Cosine similarity → UI bits. Light + dark color variants.
// Toned down per design pass — no Sparkles icon, smaller dot, looks
// more like a real employment-site label than an AI-demo trophy.
const matchBadge = (score) => {
    if (typeof score !== 'number') return null;
    const pct = Math.max(0, Math.round(score * 100));
    let cls;
    if      (score >= 0.70) cls = 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30';
    else if (score >= 0.55) cls = 'bg-sky-100 text-sky-700 border-sky-300 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/30';
    else if (score >= 0.40) cls = 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30';
    else                    cls = 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-700/40 dark:text-slate-400 dark:border-slate-600';
    return { pct, cls };
};

const dotColor = (score) =>
    score >= 0.70 ? 'bg-emerald-500'
  : score >= 0.55 ? 'bg-sky-500'
  : score >= 0.40 ? 'bg-amber-500'
  :                 'bg-slate-400';

const JobMatches = ({ jobs, loading, formatSalary, stripHtml, savedIds, appliedIds, onToggleSave, onMarkApplied }) => {
    const t = useLang(s => s.t);
    // Loading state — small inline indicator instead of huge centered spinner
    if (loading && jobs.length === 0) {
        return (
            <div className="flex items-center justify-center gap-3 py-16 rounded-lg
                            bg-white border border-slate-200
                            dark:bg-slate-900 dark:border-slate-800">
                <Loader2 className="w-5 h-5 animate-spin text-sky-600 dark:text-sky-400" />
                <span className="text-sm text-slate-600 dark:text-slate-400">{t.searchingJobs}</span>
            </div>
        );
    }

    if (!loading && jobs.length === 0) {
        return (
            <div className="text-center py-12 rounded-lg border border-dashed
                            bg-white border-slate-300
                            dark:bg-slate-900 dark:border-slate-700">
                <p className="italic text-slate-500 dark:text-slate-400">{t.noJobsFound}</p>
            </div>
        );
    }

    return (
        <div className="space-y-2.5">
            {jobs.map((job, idx) => {
                const badge = matchBadge(job.matchScore);
                const dot = dotColor(job.matchScore);
                const jobId = String(job.id);
                const isSaved = savedIds?.has(jobId);
                const isApplied = appliedIds?.has(jobId);
                return (
                    <article key={idx}
                             className="group rounded-md p-4 transition-colors
                                        bg-white border border-slate-200 hover:border-sky-400
                                        dark:bg-slate-900 dark:border-slate-800 dark:hover:border-sky-500/50">
                        {/* Title row */}
                        <div className="flex items-start justify-between gap-3 mb-2">
                            <h3 className="font-semibold text-base leading-snug line-clamp-2 flex-1
                                           text-slate-900 dark:text-white
                                           group-hover:text-sky-700 dark:group-hover:text-sky-300 transition-colors">
                                {job.title}
                            </h3>
                            <div className="flex items-center gap-1.5 shrink-0">
                                {badge && (
                                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-xs font-semibold ${badge.cls}`}
                                          title="Semantic similarity between your resume and this job">
                                        <span className={`h-1.5 w-1.5 rounded-full ${dot}`}></span>
                                        {badge.pct}%
                                    </span>
                                )}
                                {onToggleSave && (
                                    <button onClick={() => onToggleSave(job)}
                                            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                                                isSaved
                                                    ? 'text-pink-600 hover:bg-pink-50 dark:text-pink-400 dark:hover:bg-pink-500/10'
                                                    : 'text-slate-400 hover:text-pink-600 hover:bg-pink-50 dark:text-slate-500 dark:hover:text-pink-300 dark:hover:bg-pink-500/10'
                                            }`}
                                            title={isSaved ? t.jobUnsave : t.jobSave}>
                                        <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Meta row — single line, compact */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 dark:text-slate-400 mb-2.5">
                            {job.company?.display_name && (
                                <span className="inline-flex items-center gap-1">
                                    <Building className="w-3.5 h-3.5" />
                                    {job.company.display_name}
                                </span>
                            )}
                            {job.location?.display_name && (
                                <>
                                    <span className="text-slate-300 dark:text-slate-700">·</span>
                                    <span className="inline-flex items-center gap-1">
                                        <MapPin className="w-3.5 h-3.5" />
                                        {job.location.display_name}
                                    </span>
                                </>
                            )}
                            {job.salary_min && (
                                <>
                                    <span className="text-slate-300 dark:text-slate-700">·</span>
                                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
                                        <DollarSign className="w-3.5 h-3.5" />
                                        {formatSalary({ min: job.salary_min, max: job.salary_max })}
                                    </span>
                                </>
                            )}
                        </div>

                        {/* Description — clamped */}
                        {job.description && (
                            <p className="text-[13px] leading-relaxed line-clamp-2 mb-3 text-slate-600 dark:text-slate-400">
                                {stripHtml(job.description)}
                            </p>
                        )}

                        {/* Actions row */}
                        <div className="flex items-center gap-2">
                            <a href={job.redirect_url} target="_blank" rel="noopener noreferrer"
                               className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors
                                          bg-sky-600 hover:bg-sky-700 text-white
                                          dark:bg-sky-600 dark:hover:bg-sky-500">
                                {t.viewJob}
                                <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                            {onMarkApplied && (
                                isApplied ? (
                                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold border
                                                     bg-emerald-50 text-emerald-700 border-emerald-300
                                                     dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30"
                                          title={t.jobApplied}>
                                        <Check className="w-3.5 h-3.5" />
                                        {t.jobApplied}
                                    </span>
                                ) : (
                                    <button onClick={() => onMarkApplied(job)}
                                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors cursor-pointer
                                                       border-slate-300 text-slate-700 hover:bg-emerald-50 hover:border-emerald-400 hover:text-emerald-700
                                                       dark:border-slate-700 dark:text-slate-300 dark:hover:bg-emerald-500/10 dark:hover:border-emerald-500/40 dark:hover:text-emerald-300"
                                            title={t.jobMarkApplied}>
                                        {t.jobMarkApplied}
                                    </button>
                                )
                            )}
                            <span className="text-xs text-slate-400 dark:text-slate-500 ml-auto">
                                {job.created && new Date(job.created).toLocaleDateString()}
                            </span>
                        </div>
                    </article>
                );
            })}
            {/* Inline loading row when refreshing search */}
            {loading && jobs.length > 0 && (
                <div className="flex items-center justify-center gap-2 py-3 text-xs text-slate-500">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Updating…
                </div>
            )}
        </div>
    );
};

export default JobMatches;
