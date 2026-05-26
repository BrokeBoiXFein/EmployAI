import React from 'react';
import { Search, Loader2, Building, MapPin, DollarSign, ExternalLink, Sparkles, Heart, Check } from 'lucide-react';

// Turn a cosine-similarity score in roughly [0, 1] into UI bits.
// Bands are tuned for sentence-transformer outputs: typical job-to-resume
// similarities cluster around 0.4–0.75, with anything above ~0.7 being
// genuinely strong matches.
const matchBadge = (score) => {
    if (typeof score !== 'number') return null;
    const pct = Math.max(0, Math.round(score * 100));
    let cls;
    if      (score >= 0.70) cls = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40';
    else if (score >= 0.55) cls = 'bg-blue-500/15    text-blue-300    border-blue-500/40';
    else if (score >= 0.40) cls = 'bg-amber-500/15   text-amber-300   border-amber-500/40';
    else                    cls = 'bg-gray-500/15    text-gray-400    border-gray-500/30';
    return { pct, cls };
};

const JobMatches = ({ jobs, loading, t, formatSalary, stripHtml, savedIds, appliedIds, onToggleSave, onMarkApplied }) => {
    return (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl h-fit sticky top-24 animate-in fade-in slide-in-from-right-8 duration-700 delay-500">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-500/20 p-2 rounded-xl">
                        <Search className="w-6 h-6 text-blue-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">{t.matchingJobs}</h2>
                </div>
                {loading && <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />}
            </div>

            {loading && (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-blue-500/20 rounded-full" />
                        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0" />
                    </div>
                    <span className="text-indigo-200/60 font-medium animate-pulse">{t.searchingJobs}</span>
                </div>
            )}

            {!loading && jobs.length === 0 && (
                <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
                    <p className="text-indigo-200/50 italic">{t.noJobsFound}</p>
                </div>
            )}

            <div className="max-h-[700px] overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                {jobs.map((job, idx) => {
                    const badge = matchBadge(job.matchScore);
                    const jobId = String(job.id);
                    const isSaved = savedIds?.has(jobId);
                    const isApplied = appliedIds?.has(jobId);
                    return (
                    <div
                        key={idx}
                        className="group bg-white/5 hover:bg-white/10 border border-white/5 hover:border-blue-500/30 p-6 rounded-2xl transition-all duration-300"
                    >
                        <div className="flex items-start justify-between gap-3 mb-3">
                            <h3 className="font-bold text-white text-lg group-hover:text-blue-400 transition-colors line-clamp-2 flex-1">
                                {job.title}
                            </h3>
                            <div className="flex items-center gap-2 shrink-0">
                                {badge && (
                                    <span
                                        className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-bold ${badge.cls}`}
                                        title="Semantic similarity between your resume and this job (Sentence-BERT)"
                                    >
                                        <Sparkles className="w-3 h-3" />
                                        {badge.pct}% match
                                    </span>
                                )}
                                {onToggleSave && (
                                    <button
                                        onClick={() => onToggleSave(job)}
                                        className={`p-2 rounded-full border transition ${
                                            isSaved
                                                ? 'bg-pink-500/15 border-pink-500/40 text-pink-300 hover:bg-pink-500/25'
                                                : 'bg-white/5 border-white/10 text-indigo-300/70 hover:text-pink-300 hover:bg-pink-500/10 hover:border-pink-500/30'
                                        }`}
                                        title={isSaved ? 'Unsave' : 'Save for later'}
                                    >
                                        <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2 mb-5">
                            <div className="flex items-center gap-2 text-indigo-200/60 text-sm">
                                <Building className="w-4 h-4 shrink-0" />
                                <span className="truncate">{job.company.display_name}</span>
                            </div>
                            <div className="flex items-center gap-2 text-indigo-200/60 text-sm">
                                <MapPin className="w-4 h-4 shrink-0" />
                                <span className="truncate">{job.location.display_name}</span>
                            </div>
                            {job.salary_min && (
                                <div className="flex items-center gap-2 text-emerald-400/80 text-sm font-semibold">
                                    <DollarSign className="w-4 h-4 shrink-0" />
                                    <span>{formatSalary({ min: job.salary_min, max: job.salary_max })}</span>
                                </div>
                            )}
                        </div>

                        <p className="text-indigo-200/50 text-xs mb-6 line-clamp-3 leading-relaxed">
                            {stripHtml(job.description)}
                        </p>

                        <div className="flex gap-2">
                            <a
                                href={job.redirect_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 inline-flex items-center justify-center gap-2 bg-indigo-500/10 hover:bg-indigo-500 text-indigo-300 hover:text-white py-3 rounded-xl text-sm font-bold transition-all border border-indigo-500/20 hover:border-indigo-500"
                            >
                                {t.viewJob}
                                <ExternalLink className="w-4 h-4" />
                            </a>
                            {onMarkApplied && (
                                isApplied ? (
                                    <span
                                        className="inline-flex items-center gap-1.5 px-4 py-3 rounded-xl text-sm font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/40"
                                        title="You've marked this as applied"
                                    >
                                        <Check className="w-4 h-4" />
                                        Applied
                                    </span>
                                ) : (
                                    <button
                                        onClick={() => onMarkApplied(job)}
                                        className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold bg-white/5 hover:bg-emerald-500/15 text-indigo-200/80 hover:text-emerald-300 border border-white/10 hover:border-emerald-500/40 transition"
                                        title="Record that you applied to this job"
                                    >
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
