// ============================================================
// Resumes — library of all the user's uploaded resumes
// ============================================================
// Cards: label, candidate name, language, date, active badge.
// Actions: set active, rename, delete.
// "Upload new" sends user to /analyze (where upload UI lives).
// Light + dark mode supported.
// ============================================================

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Star, Trash2, Pencil, Check, X, Upload, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { useLang } from '../store/lang';

export default function Resumes() {
  const t = useLang(s => s.t);
  const [resumes, setResumes] = useState([]);
  const [activeResumeId, setActiveResumeId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [renamingId, setRenamingId] = useState(null);
  const [renameDraft, setRenameDraft] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    try {
      const { resumes, activeResumeId } = await api.get('/api/resumes');
      setResumes(resumes);
      setActiveResumeId(activeResumeId);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const activate = async (id) => {
    setBusyId(id);
    try {
      await api.post(`/api/resumes/${id}/activate`);
      setActiveResumeId(id);
    } catch (err) { setError(err.message); }
    finally { setBusyId(null); }
  };

  const remove = async (id, label) => {
    if (!confirm(t.resConfirmDelete(label))) return;
    setBusyId(id);
    try {
      const { activeResumeId: newActive } = await api.del(`/api/resumes/${id}`);
      setResumes(prev => prev.filter(r => r.id !== id));
      setActiveResumeId(newActive);
    } catch (err) { setError(err.message); }
    finally { setBusyId(null); }
  };

  const startRename = (r) => { setRenamingId(r.id); setRenameDraft(r.label); };

  const saveRename = async (id) => {
    if (!renameDraft.trim()) { setRenamingId(null); return; }
    setBusyId(id);
    try {
      const { resume } = await api.patch(`/api/resumes/${id}`, { label: renameDraft.trim() });
      setResumes(prev => prev.map(r => r.id === id ? resume : r));
      setRenamingId(null);
    } catch (err) { setError(err.message); }
    finally { setBusyId(null); }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24
                      text-slate-500 dark:text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mb-3" />
        <p>{t.resLoading}</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-20">
      <div className="flex items-center justify-between mb-8 gap-3 flex-wrap">
        <div>
          <h1 className="h-serif text-4xl font-medium text-slate-900 dark:text-white">{t.resTitle}</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            {resumes.length === 0 ? t.resEmpty : t.resCount(resumes.length)}
          </p>
        </div>
        <Link to="/analyze"
              className="flex items-center gap-2 px-4 py-2 rounded-md font-semibold transition-colors
                         bg-sky-600 hover:bg-sky-700 text-white
                         dark:bg-sky-600 dark:hover:bg-sky-500">
          <Upload className="w-4 h-4" />
          {t.resUploadNew}
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-md text-sm
                        bg-red-50 border border-red-200 text-red-700
                        dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-300">
          {error}
        </div>
      )}

      {resumes.length === 0 ? (
        <div className="rounded-lg p-12 text-center
                        bg-white border border-slate-200
                        dark:bg-slate-900 dark:border-slate-800">
          <FileText className="w-12 h-12 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
          <h2 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">{t.resEmptyTitle}</h2>
          <p className="mb-6 text-slate-500 dark:text-slate-400">{t.resEmptyDesc}</p>
          <Link to="/analyze"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md font-semibold transition-colors
                           bg-sky-600 hover:bg-sky-700 text-white
                           dark:bg-sky-600 dark:hover:bg-sky-500">
            <Upload className="w-4 h-4" />
            {t.resEmptyCta}
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {resumes.map((r) => {
            const isActive = r.id === activeResumeId;
            const isRenaming = renamingId === r.id;
            const isBusy = busyId === r.id;

            return (
              <div key={r.id}
                   className={`group rounded-lg p-5 border transition-colors
                               bg-white dark:bg-slate-900
                               ${isActive
                                 ? 'border-sky-400 dark:border-sky-500/60'
                                 : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700'}`}>
                <div className="flex items-start gap-4">
                  <div className={`p-2.5 rounded-md shrink-0
                                  ${isActive
                                    ? 'bg-sky-600 dark:bg-sky-600'
                                    : 'bg-slate-100 dark:bg-slate-800'}`}>
                    <FileText className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {isRenaming ? (
                        <input autoFocus value={renameDraft}
                               onChange={(e) => setRenameDraft(e.target.value)}
                               onKeyDown={(e) => {
                                 if (e.key === 'Enter') saveRename(r.id);
                                 if (e.key === 'Escape') setRenamingId(null);
                               }}
                               className="flex-1 rounded-lg px-2 py-1
                                          bg-slate-50 border border-slate-300 text-slate-900
                                          dark:bg-slate-800 dark:border-slate-700 dark:text-white
                                          focus:outline-none focus:ring-2 focus:ring-sky-500" />
                      ) : (
                        <h3 className="text-lg font-semibold truncate text-slate-900 dark:text-white">{r.label}</h3>
                      )}
                      {isActive && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-bold
                                         bg-sky-50 border-sky-300 text-sky-700
                                         dark:bg-sky-500/15 dark:border-sky-500/40 dark:text-sky-300">
                          <Star className="w-3 h-3 fill-current" />
                          {t.resActiveBadge}
                        </span>
                      )}
                    </div>
                    <div className="text-sm flex flex-wrap gap-x-4 gap-y-1 text-slate-500 dark:text-slate-400">
                      {r.candidateName && <span>{r.candidateName}</span>}
                      {r.detectedLanguage && <span>· {r.detectedLanguage}</span>}
                      <span>· {t.resUploadedOn} {new Date(r.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    {isRenaming ? (
                      <>
                        <button onClick={() => saveRename(r.id)} disabled={isBusy}
                                className="p-2 rounded-lg transition-colors cursor-pointer
                                           text-green-600 hover:bg-green-50
                                           dark:text-green-400 dark:hover:bg-green-500/10"
                                title={t.resSaveTip}>
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => setRenamingId(null)}
                                className="p-2 rounded-lg transition-colors cursor-pointer
                                           text-slate-500 hover:bg-slate-100
                                           dark:text-slate-400 dark:hover:bg-slate-800"
                                title={t.resCancelTip}>
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        {!isActive && (
                          <button onClick={() => activate(r.id)} disabled={isBusy}
                                  className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer
                                             text-slate-700 hover:bg-slate-100
                                             dark:text-slate-300 dark:hover:bg-slate-800
                                             disabled:opacity-50"
                                  title={t.resSetActive}>
                            {t.resSetActive}
                          </button>
                        )}
                        <button onClick={() => startRename(r)} disabled={isBusy}
                                className="p-2 rounded-lg transition-colors cursor-pointer
                                           text-slate-500 hover:bg-slate-100 hover:text-slate-700
                                           dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white
                                           disabled:opacity-50"
                                title={t.resRename}>
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => remove(r.id, r.label)} disabled={isBusy}
                                className="p-2 rounded-lg transition-colors cursor-pointer
                                           text-red-500 hover:bg-red-50
                                           dark:text-red-400 dark:hover:bg-red-500/10
                                           disabled:opacity-50"
                                title={t.resDelete}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
