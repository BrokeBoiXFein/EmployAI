import React from 'react';
import { Upload, FileText, Loader2 } from 'lucide-react';

const ResumeUpload = ({ file, handleFileUpload, analyzeResume, loading, t }) => {
    return (
        <div className="max-w-3xl mx-auto mb-16">
            <div className="bg-indigo-900/30 backdrop-blur-xl border border-indigo-700/50 p-8 rounded-3xl shadow-2xl shadow-indigo-950/50 transition-all hover:border-indigo-600/50 group">
                <div
                    className="relative border-2 border-dashed border-indigo-800/80 rounded-2xl p-10 text-center transition-all group-hover:border-indigo-500/50 group-hover:bg-indigo-900/20"
                >
                    <input
                        type="file"
                        id="resume-upload"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={handleFileUpload}
                        className="hidden"
                    />
                    <label htmlFor="resume-upload" className="cursor-pointer">
                        <div className="flex flex-col items-center">
                            <div className="bg-indigo-800/40 p-4 rounded-2xl mb-4 transition-transform group-hover:scale-110 group-hover:rotate-3">
                                <Upload className="w-10 h-10 text-indigo-400" />
                            </div>
                            <p className="text-xl font-semibold text-white mb-2">
                                {file ? file.name : t.uploadResume}
                            </p>
                            <p className="text-indigo-300/70 text-sm">
                                {t.uploadHint}
                            </p>
                        </div>
                    </label>
                </div>

                {file && (
                    <button
                        onClick={analyzeResume}
                        disabled={loading}
                        className={`w-full mt-6 py-4 px-6 rounded-2xl font-bold text-white shadow-xl shadow-indigo-900/20 flex items-center justify-center gap-3 transition-all active:scale-95 ${loading
                                ? 'bg-indigo-800/50 cursor-not-allowed'
                                : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500'
                            }`}
                    >
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
