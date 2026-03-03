import React from 'react';
import { CheckCircle, Lightbulb, Briefcase, GraduationCap, Award } from 'lucide-react';

const AnalysisResults = ({ analysis, t }) => {
    if (!analysis) return null;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl">
                <div className="flex items-center gap-4 text-emerald-400 mb-6">
                    <div className="bg-emerald-500/20 p-2 rounded-full">
                        <CheckCircle className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-bold">{t.analysisComplete}</h2>
                </div>

                <div className="border-b border-white/5 pb-6 mb-8">
                    <h3 className="text-3xl font-bold text-white mb-3">{analysis.name}</h3>
                    <p className="text-indigo-200/70 text-lg leading-relaxed">{analysis.summary}</p>
                    {analysis.originalLanguage && analysis.originalLanguage !== 'English' && (
                        <div className="inline-flex items-center gap-2 mt-4 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-sm text-blue-400">
                            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                            {t.originalLanguage}: {analysis.originalLanguage}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Skills */}
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <Award className="w-5 h-5 text-indigo-400" />
                            <h3 className="text-lg font-semibold text-white">{t.skills}</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {analysis.skills?.map((skill, idx) => (
                                <span key={idx} className="bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-300 px-3 py-1 rounded-lg text-sm transition-colors">
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </section>

                    {/* Education */}
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <GraduationCap className="w-5 h-5 text-indigo-400" />
                            <h3 className="text-lg font-semibold text-white">{t.education}</h3>
                        </div>
                        <div className="space-y-4">
                            {analysis.education?.map((edu, idx) => (
                                <div key={idx} className="bg-white/5 border border-white/5 p-4 rounded-2xl">
                                    <p className="font-semibold text-white">{edu.degree}</p>
                                    <p className="text-sm text-indigo-200/60">{edu.institution} • {edu.year}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Experience */}
                <section className="mt-8 pt-8 border-t border-white/5">
                    <div className="flex items-center gap-2 mb-6">
                        <Briefcase className="w-5 h-5 text-indigo-400" />
                        <h3 className="text-lg font-semibold text-white">{t.experience}</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                        {analysis.experience?.map((exp, idx) => (
                            <div key={idx} className="relative pl-6 border-l-2 border-indigo-500/30 py-1">
                                <div className="absolute top-2 -left-[9px] w-4 h-4 rounded-full bg-indigo-500 border-4 border-indigo-950/50" />
                                <p className="font-bold text-white text-lg">{exp.title}</p>
                                <p className="text-sm text-indigo-400 font-medium mb-2">{exp.company} • {exp.duration}</p>
                                <p className="text-indigo-200/70 text-sm leading-relaxed">{exp.responsibilities}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Recommendations Grid */}
                <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {analysis.usEquivalents && (
                        <div className="bg-blue-500/5 border border-blue-500/10 p-6 rounded-3xl">
                            <h3 className="text-lg font-semibold text-blue-400 mb-4">{t.usEquivalents}</h3>
                            <div className="space-y-4">
                                {analysis.usEquivalents.degreeEquivalent && (
                                    <div>
                                        <span className="text-xs uppercase tracking-wider text-blue-500/50 font-bold block mb-1">{t.degreeEquivalent}</span>
                                        <p className="text-white font-medium">{analysis.usEquivalents.degreeEquivalent}</p>
                                    </div>
                                )}
                                {analysis.usEquivalents.certifications && (
                                    <div>
                                        <span className="text-xs uppercase tracking-wider text-blue-500/50 font-bold block mb-1">{t.recommendedCerts}</span>
                                        <p className="text-white font-medium">{analysis.usEquivalents.certifications}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {analysis.suggestionsForUS && (
                        <div className="bg-amber-500/5 border border-amber-500/10 p-6 rounded-3xl">
                            <div className="flex items-center gap-2 mb-4">
                                <Lightbulb className="w-5 h-5 text-amber-400" />
                                <h3 className="text-lg font-semibold text-amber-400">{t.suggestions}</h3>
                            </div>
                            <div className="space-y-4">
                                {analysis.suggestionsForUS.map((suggestion, idx) => (
                                    <div key={idx}>
                                        <p className="text-xs font-bold text-amber-500/50 uppercase tracking-wider mb-1">{suggestion.category}</p>
                                        <p className="text-white/90 text-sm leading-relaxed">{suggestion.suggestion}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Recommended Jobs */}
                <div className="mt-8 pt-8 border-t border-white/5">
                    <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                        <span className="p-1 px-2 bg-indigo-500 text-[10px] rounded uppercase font-bold">Hot</span>
                        {t.recommendedJobs}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {analysis.recommendedJobTitles?.map((title, idx) => (
                            <div key={idx} className="bg-indigo-600 hover:bg-indigo-500 text-white p-4 rounded-2xl text-center font-bold text-sm transition-all shadow-lg shadow-indigo-900/40 cursor-default">
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
