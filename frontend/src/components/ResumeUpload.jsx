import React from 'react';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { useLang } from '../store/lang';

const ResumeUpload = ({ file, handleFileUpload, analyzeResume, loading }) => {
    const t = useLang(s => s.t);
    return (
        <div className="max-w-3xl mx-auto mb-10">
            <div className="rounded-lg p-6 sm:p-8 transition-colors group
                            bg-white border border-slate-200 hover:border-slate-300
                            dark:bg-slate-900 dark:border-slate-800 dark:hover:border-slate-700">
                <label htmlFor="resume-upload"
                       className="relative block rounded-md p-8 sm:p-10 text-center cursor-pointer transition-colors
                                  border-2 border-dashed
                                  bg-slate-50 border-slate-300 hover:bg-sky-50 hover:border-sky-400
                                  dark:bg-slate-800/40 dark:border-slate-700 dark:hover:bg-sky-500/5 dark:hover:border-sky-500/50">
                    <input type="file" id="resume-upload"
                           accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                           onChange={handleFileUpload}
                           className="hidden" />
                    <div className="flex flex-col items-center">
                        <div className="p-4 rounded-lg mb-4 transition-transform group-hover:scale-105
                                        bg-sky-100 text-sky-700
                                        dark:bg-sky-500/15 dark:text-sky-300">
                            <Upload className="w-10 h-10" />
                        </div>
                        <p className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">
                            {file ? file.name : t.uploadResume}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            {t.uploadHint}
                        </p>
                    </div>
                </label>

                {file && (
                    <button onClick={analyzeResume} disabled={loading}
                            className={`w-full mt-6 py-3.5 px-6 rounded-md font-bold text-base flex items-center justify-center gap-3 transition-colors cursor-pointer
                                        ${loading
                                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500'
                                          : 'bg-sky-600 hover:bg-sky-700 text-white dark:bg-sky-600 dark:hover:bg-sky-500'}`}>
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>{t.analyzing}</span>
                            </>
                        ) : (
                            <>
                                <FileText className="w-5 h-5" />
                                <span>{t.analyzeButton}</span>
                            </>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
};

export default ResumeUpload;
