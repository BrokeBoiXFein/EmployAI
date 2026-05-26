// ============================================================
// Resumes — library of all the user's uploaded resumes
// ============================================================
// Shows cards: label, candidate name, language, date, active badge.
// Actions: set active, rename, delete.
// "Upload new" sends user to /analyze (which is where the upload UI lives).
// ============================================================

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Star, Trash2, Pencil, Check, X, Upload, Loader2 } from 'lucide-react';
import { api } from '../services/api';

export default function Resumes() {
  const [resumes, setResumes] = useState([]);
  const [activeResumeId, setActiveResumeId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Per-row UI state — tracks which row is in "renaming" mode and the draft text
  const [renamingId, setRenamingId] = useState(null);
  const [renameDraft, setRenameDraft] = useState('');
  const [busyId, setBusyId] = useState(null); // disables a row's buttons while a request is in flight

  const load = async () => {
    try {
      const { resumes, activeResumeId } = await api.get('/api/resumes');
      setResumes(resumes);
      setActiveResumeId(activeResumeId);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const activate = async (id) => {
    setBusyId(id);
    try {
      await api.post(`/api/resumes/${id}/activate`);
      setActiveResumeId(id);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id, label) => {
    if (!confirm(`Delete "${label}"? This can't be undone.`)) return;
    setBusyId(id);
    try {
      const { activeResumeId: newActive } = await api.del(`/api/resumes/${id}`);
      setResumes(prev => prev.filter(r => r.id !== id));
      setActiveResumeId(newActive);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const startRename = (r) => {
    setRenamingId(r.id);
    setRenameDraft(r.label);
  };

  const saveRename = async (id) => {
    if (!renameDraft.trim()) { setRenamingId(null); return; }
    setBusyId(id);
    try {
      const { resume } = await api.patch(`/api/resumes/${id}`, { label: renameDraft.trim() });
      setResumes(prev => prev.map(r => r.id === id ? resume : r));
      setRenamingId(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-indigo-300/70">
        <Loader2 className="w-8 h-8 animate-spin mb-3" />
        <p>Loading your resumes…</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Your resumes</h1>
          <p className="text-indigo-300/70 mt-1">
            {resumes.length === 0
              ? 'Upload your first resume to get started.'
              : `${resumes.length} saved. The active one drives job matches and chat.`}
          </p>
        </div>
        <Link
          to="/analyze"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-500/20 transition"
        >
          <Upload className="w-4 h-4" />
          Upload new
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm">
          {error}
        </div>
      )}

      {resumes.length === 0 ? (
        <div className="bg-indigo-950/60 border border-indigo-900/50 rounded-2xl p-12 text-center backdrop-blur-md">
          <FileText className="w-12 h-12 text-indigo-400/50 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">No resumes yet</h2>
          <p className="text-indigo-300/70 mb-6">
            Upload your first resume on the Analyze page. The AI will translate, parse, and find matching jobs.
          </p>
          <Link
            to="/analyze"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-500/20 transition"
          >
            <Upload className="w-4 h-4" />
            Upload your first resume
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {resumes.map((r) => {
            const isActive = r.id === activeResumeId;
            const isRenaming = renamingId === r.id;
            const isBusy = busyId === r.id;

            return (
              <div
                key={r.id}
                className={`group relative bg-indigo-950/60 border rounded-2xl p-5 backdrop-blur-md transition ${
                  isActive ? 'border-indigo-400/60 shadow-lg shadow-indigo-500/10' : 'border-indigo-900/50 hover:border-indigo-800/70'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2.5 rounded-xl ${isActive ? 'bg-indigo-600' : 'bg-indigo-900/60'}`}>
                    <FileText className="w-5 h-5 text-white" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {isRenaming ? (
                        <input
                          autoFocus
                          value={renameDraft}
                          onChange={(e) => setRenameDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveRename(r.id);
                            if (e.key === 'Escape') setRenamingId(null);
                          }}
                          className="flex-1 bg-indigo-900/60 border border-indigo-700 rounded-lg px-2 py-1 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      ) : (
                        <h3 className="text-lg font-semibold text-white truncate">{r.label}</h3>
                      )}
                      {isActive && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-600/30 text-indigo-200 text-xs font-medium border border-indigo-500/40">
                          <Star className="w-3 h-3 fill-current" />
                          Active
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-indigo-300/70 flex flex-wrap gap-x-4 gap-y-1">
                      {r.candidateName && <span>{r.candidateName}</span>}
                      {r.detectedLanguage && <span>· {r.detectedLanguage}</span>}
                      <span>· Uploaded {new Date(r.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    {isRenaming ? (
                      <>
                        <button
                          onClick={() => saveRename(r.id)}
                          disabled={isBusy}
                          className="p-2 rounded-lg text-green-400 hover:bg-green-500/10 transition"
                          title="Save"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setRenamingId(null)}
                          className="p-2 rounded-lg text-indigo-300 hover:bg-white/5 transition"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        {!isActive && (
                          <button
                            onClick={() => activate(r.id)}
                            disabled={isBusy}
                            className="px-3 py-1.5 rounded-lg text-sm text-indigo-200 hover:bg-white/5 transition disabled:opacity-50"
                            title="Use this resume for job matching"
                          >
                            Set active
                          </button>
                        )}
                        <button
                          onClick={() => startRename(r)}
                          disabled={isBusy}
                          className="p-2 rounded-lg text-indigo-300 hover:bg-white/5 transition disabled:opacity-50"
                          title="Rename"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => remove(r.id, r.label)}
                          disabled={isBusy}
                          className="p-2 rounded-lg text-red-400/80 hover:bg-red-500/10 transition disabled:opacity-50"
                          title="Delete"
                        >
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

