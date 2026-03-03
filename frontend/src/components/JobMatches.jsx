import React from 'react';
import { Search, Loader2, Building, MapPin, DollarSign, ExternalLink } from 'lucide-react';

const JobMatches = ({ jobs, loading, t, formatSalary, stripHtml }) => {
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
                {jobs.map((job, idx) => (
                    <div
                        key={idx}
                        className="group bg-white/5 hover:bg-white/10 border border-white/5 hover:border-blue-500/30 p-6 rounded-2xl transition-all duration-300"
                    >
                        <h3 className="font-bold text-white text-lg group-hover:text-blue-400 transition-colors mb-3 line-clamp-2">
                            {job.title}
                        </h3>

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

                        <a
                            href={job.redirect_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full inline-flex items-center justify-center gap-2 bg-indigo-500/10 hover:bg-indigo-500 text-indigo-300 hover:text-white py-3 rounded-xl text-sm font-bold transition-all border border-indigo-500/20 hover:border-indigo-500"
                        >
                            {t.viewJob}
                            <ExternalLink className="w-4 h-4" />
                        </a>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default JobMatches;
