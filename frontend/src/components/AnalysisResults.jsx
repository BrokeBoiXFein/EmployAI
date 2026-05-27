import React from 'react';
import { CheckCircle, Lightbulb, Briefcase, GraduationCap, Award } from 'lucide-react';
import { useLang } from '../store/lang';

// Shared classes
const SECTION_TITLE = "text-lg font-semibold text-slate-900 dark:text-white";
const SECTION_ICON  = "w-5 h-5 text-sky-700 dark:text-sky-400";
const SUBTITLE      = "text-xs uppercase tracking-wider font-bold text-sky-700 dark:text-sky-400";

const AnalysisResults = ({ analysis }) => {
    const t = useLang(s => s.t);
    if (!analysis) return null;

    return (
        <div className="space-y-6">
            <div className="rounded-lg p-6 sm:p-8
                            bg-white border border-slate-200
                            dark:bg-slate-900 dark:border-slate-800">

                {/* Status header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-full
                                    bg-emerald-100 text-emerald-700
                                    dark:bg-emerald-500/15 dark:text-emerald-400">
                        <CheckCircle className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{t.analysisComplete}</h2>
                </div>

                {/* Name + summary */}
                <div className="border-b pb-6 mb-6 border-slate-200 dark:border-slate-800">
                    <h3 className="text-3xl font-bold mb-3 text-slate-900 dark:text-white">{analysis.name}</h3>
                    <p className="text-base leading-relaxed text-slate-700 dark:text-slate-300">{analysis.summary}</p>
                    {analysis.originalLanguage && analysis.originalLanguage !== 'English' && (
                        <div className="inline-flex items-center gap-2 mt-4 px-3 py-1 rounded-full text-sm
                                        bg-sky-50 border border-sky-200 text-sky-700
                                        dark:bg-sky-500/10 dark:border-sky-500/30 dark:text-sky-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
                            {t.originalLanguage}: {analysis.originalLanguage}
                        </div>
                    )}
                </div>

                {/* Skills + Education side-by-side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <section>
                        <div className="flex items-center gap-2 mb-3">
                            <Award className={SECTION_ICON} />
                            <h3 className={SECTION_TITLE}>{t.skills}</h3>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {analysis.skills?.map((skill, idx) => (
                                <span key={idx}
                                      className="px-2.5 py-1 rounded-md text-sm border
                                                 bg-sky-50 border-sky-200 text-sky-800
                                                 dark:bg-sky-500/10 dark:border-sky-500/30 dark:text-sky-200">
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </section>

                    <section>
                        <div className="flex items-center gap-2 mb-3">
                            <GraduationCap className={SECTION_ICON} />
                            <h3 className={SECTION_TITLE}>{t.education}</h3>
                        </div>
                        <div className="space-y-2">
                            {analysis.education?.map((edu, idx) => (
                                <div key={idx} className="p-3 rounded-md
                                                          bg-slate-50 border border-slate-200
                                                          dark:bg-slate-800/50 dark:border-slate-700">
                                    <p className="font-semibold text-slate-900 dark:text-white">{edu.degree}</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{edu.institution} · {edu.year}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Experience timeline */}
                <section className="border-t pt-6 mb-8 border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2 mb-5">
                        <Briefcase className={SECTION_ICON} />
                        <h3 className={SECTION_TITLE}>{t.experience}</h3>
                    </div>
                    <div className="space-y-4">
                        {analysis.experience?.map((exp, idx) => (
                            <div key={idx} className="relative pl-6 py-1
                                                      border-l-2 border-sky-300 dark:border-sky-500/40">
                                <div className="absolute top-2 -left-[7px] w-3 h-3 rounded-full
                                                bg-sky-500 dark:bg-sky-400
                                                ring-4 ring-white dark:ring-slate-900" />
                                <p className="font-bold text-lg text-slate-900 dark:text-white">{exp.title}</p>
                                <p className="text-sm font-medium mb-2 text-sky-700 dark:text-sky-400">{exp.company} · {exp.duration}</p>
                                <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">{exp.responsibilities}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Recommendations grid: US equivalents + Suggestions */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
                    {analysis.usEquivalents && (
                        <div className="p-5 rounded-lg
                                        bg-sky-50 border border-sky-200
                                        dark:bg-sky-500/5 dark:border-sky-500/20">
                            <h3 className="text-base font-semibold mb-3 text-sky-700 dark:text-sky-400">{t.usEquivalents}</h3>
                            <div className="space-y-3">
                                {analysis.usEquivalents.degreeEquivalent && (
                                    <div>
                                        <span className="text-xs uppercase tracking-wider font-bold block mb-0.5
                                                         text-sky-600 dark:text-sky-500">{t.degreeEquivalent}</span>
                                        <p className="font-medium text-slate-900 dark:text-white">{analysis.usEquivalents.degreeEquivalent}</p>
                                    </div>
                                )}
                                {analysis.usEquivalents.certifications && (
                                    <div>
                                        <span className="text-xs uppercase tracking-wider font-bold block mb-0.5
                                                         text-sky-600 dark:text-sky-500">{t.recommendedCerts}</span>
                                        <p className="font-medium text-slate-900 dark:text-white">{analysis.usEquivalents.certifications}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {analysis.suggestionsForUS && (
                        <div className="p-5 rounded-lg
                                        bg-amber-50 border border-amber-200
                                        dark:bg-amber-500/5 dark:border-amber-500/20">
                            <div className="flex items-center gap-2 mb-3">
                                <Lightbulb className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                <h3 className="text-base font-semibold text-amber-700 dark:text-amber-400">{t.suggestions}</h3>
                            </div>
                            <div className="space-y-3">
                                {analysis.suggestionsForUS.map((suggestion, idx) => (
                                    <div key={idx}>
                                        <p className="text-xs font-bold uppercase tracking-wider mb-0.5
                                                      text-amber-600 dark:text-amber-500">{suggestion.category}</p>
                                        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">{suggestion.suggestion}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Recommended job titles */}
                <div className="border-t pt-6 border-slate-200 dark:border-slate-800">
                    <h3 className="text-base font-semibold mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
                        <span className="px-1.5 py-0.5 text-[10px] rounded uppercase font-bold
                                         bg-sky-600 text-white
                                         dark:bg-sky-500 dark:text-slate-950">Hot</span>
                        {t.recommendedJobs}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {analysis.recommendedJobTitles?.map((title, idx) => (
                            <div key={idx}
                                 className="p-3 rounded-md text-center font-bold text-sm
                                            bg-sky-600 hover:bg-sky-700 text-white
                                            dark:bg-sky-600 dark:hover:bg-sky-500
                                            transition-colors cursor-default">
                                {title}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalysisResults;
