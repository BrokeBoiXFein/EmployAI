// ============================================================
// Home — public marketing page
// ============================================================
// Layout: full-width sections (App.jsx no longer wraps in a max-w
// container). Each section sets its own background + container.
// Both light and dark mode variants. Typography: EB Garamond serif
// headings + Lato body — pulled from index.css's @import.
// ============================================================

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Check, ExternalLink, Sparkles } from 'lucide-react';
import { useAuth } from '../store/auth';
import { useLang } from '../store/lang';

const INTENT_KEY = 'employai_intent';

const Home = () => {
    const user = useAuth(s => s.user);
    const navigate = useNavigate();
    const t = useLang(s => s.t);
    const ctaHref = user ? '/analyze' : '/signup';
    const ctaLabel = user ? t.homeCtaContinue : t.homeCtaUpload;

    const [intent, setIntent] = useState(() => {
        try { return localStorage.getItem(INTENT_KEY) || ''; } catch { return ''; }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        const trimmed = intent.trim();
        try {
            if (trimmed) localStorage.setItem(INTENT_KEY, trimmed);
            else localStorage.removeItem(INTENT_KEY);
        } catch { /* private mode */ }
        navigate(ctaHref);
    };

    // Popular role chips — translated
    const popular = [t.homePop1, t.homePop2, t.homePop3, t.homePop4];

    return (
        <div className="text-slate-800 dark:text-slate-200">

            {/* ============================== HERO ============================== */}
            <section className="relative overflow-hidden bg-white dark:bg-slate-950">
                <div className="absolute inset-0 pointer-events-none"
                     style={{ backgroundImage: 'radial-gradient(rgba(15, 23, 42, 0.08) 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
                <div className="absolute inset-0 pointer-events-none hidden dark:block"
                     style={{ backgroundImage: 'radial-gradient(rgba(125, 211, 252, 0.06) 1px, transparent 1px)', backgroundSize: '22px 22px' }} />

                <div className="relative mx-auto max-w-6xl px-6 pt-16 pb-20 text-center">
                    <span className="inline-block text-xs font-bold tracking-widest uppercase text-sky-700 dark:text-sky-400 mb-5">
                        {t.homeBadge}
                    </span>

                    <h1 className="h-serif text-5xl md:text-6xl lg:text-7xl font-medium leading-[1.05] text-slate-900 dark:text-white max-w-4xl mx-auto">
                        {t.homeHeroTitle}
                    </h1>

                    <p className="mt-7 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto text-slate-600 dark:text-slate-400">
                        {t.homeHeroSub}
                    </p>

                    <form onSubmit={handleSubmit}
                          className="mt-10 max-w-2xl mx-auto rounded-lg flex flex-col sm:flex-row items-stretch gap-2
                                     bg-white dark:bg-slate-900
                                     border border-slate-200 dark:border-slate-800 p-2">
                        <div className="flex-1 flex items-center gap-3 px-4 py-3 min-w-0">
                            <Sparkles className="w-5 h-5 shrink-0 text-slate-400 dark:text-slate-500" />
                            <input type="text"
                                   value={intent}
                                   onChange={(e) => setIntent(e.target.value)}
                                   placeholder={t.homeHeroPlaceholder}
                                   className="flex-1 bg-transparent outline-none text-base
                                              placeholder:text-slate-400 dark:placeholder:text-slate-500
                                              text-slate-900 dark:text-white min-w-0" />
                        </div>
                        <button type="submit"
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md font-bold transition-colors cursor-pointer
                                           bg-green-600 hover:bg-green-700 text-white
                                           dark:bg-green-600 dark:hover:bg-green-500">
                            {ctaLabel}
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </form>
                    {intent.trim() && (
                        <p className="mt-3 text-xs text-slate-500 dark:text-slate-500">{t.homeIntentHint}</p>
                    )}

                    <div className="mt-5 text-sm flex items-center justify-center flex-wrap gap-x-3 gap-y-1 text-slate-500 dark:text-slate-500">
                        <span>{t.homePopular}</span>
                        {popular.map((p, i) => (
                            <React.Fragment key={i}>
                                {i > 0 && <span className="text-slate-300 dark:text-slate-700">·</span>}
                                <a href="#" className="text-sky-700 dark:text-sky-400 hover:underline">{p}</a>
                            </React.Fragment>
                        ))}
                    </div>

                    <div className="mt-14 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-sm text-slate-600 dark:text-slate-400">
                        <span className="flex items-center gap-2"><Check className="w-5 h-5 text-green-600 dark:text-green-500" />{t.homeTrustNoFee}</span>
                        <span className="flex items-center gap-2"><Check className="w-5 h-5 text-green-600 dark:text-green-500" />{t.homeTrustPrivate}</span>
                        <span className="flex items-center gap-2"><Check className="w-5 h-5 text-green-600 dark:text-green-500" />{t.homeTrustAnyLang}</span>
                    </div>
                </div>
            </section>

            {/* ============================== HOW IT WORKS ============================== */}
            <section id="how" className="border-y py-24 bg-sky-50 border-slate-200 dark:bg-slate-900 dark:border-slate-800">
                <div className="mx-auto max-w-6xl px-6">
                    <div className="text-center mb-14">
                        <p className="text-sm font-bold tracking-widest uppercase text-sky-700 dark:text-sky-400">{t.homeHowLabel}</p>
                        <h2 className="h-serif text-4xl md:text-5xl font-medium mt-3 text-slate-900 dark:text-white">{t.homeHowTitle}</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { n: '01', title: t.homeStep1Title, desc: t.homeStep1Desc },
                            { n: '02', title: t.homeStep2Title, desc: t.homeStep2Desc },
                            { n: '03', title: t.homeStep3Title, desc: t.homeStep3Desc }
                        ].map((step) => (
                            <div key={step.n} className="border rounded-lg p-7 bg-white border-slate-200 dark:bg-slate-950/60 dark:border-slate-800">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="h-serif text-3xl font-medium text-sky-700 dark:text-sky-400">{step.n}</span>
                                    <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800"></div>
                                </div>
                                <h3 className="h-serif text-2xl font-medium mb-3 text-slate-900 dark:text-white">{step.title}</h3>
                                <p className="leading-relaxed text-slate-600 dark:text-slate-400">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ============================== FEATURE SPOTLIGHT ============================== */}
            <section id="features" className="py-24 bg-white dark:bg-slate-950">
                <div className="mx-auto max-w-6xl px-6 grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
                    <div>
                        <p className="text-sm font-bold tracking-widest uppercase text-sky-700 dark:text-sky-400">{t.homeFeaturesLabel}</p>
                        <h2 className="h-serif text-4xl md:text-5xl font-medium mt-3 leading-tight text-slate-900 dark:text-white">{t.homeFeaturesTitle}</h2>
                        <p className="mt-5 text-lg leading-relaxed text-slate-600 dark:text-slate-400">{t.homeFeaturesIntro}</p>
                        <ul className="mt-6 space-y-3 text-slate-700 dark:text-slate-300">
                            <li className="flex gap-3"><Check className="w-5 h-5 text-green-600 dark:text-green-500 mt-0.5 shrink-0" />
                                <span><b>{t.homeFeatBullet1Bold}</b> — {t.homeFeatBullet1}</span></li>
                            <li className="flex gap-3"><Check className="w-5 h-5 text-green-600 dark:text-green-500 mt-0.5 shrink-0" />
                                <span><b>{t.homeFeatBullet2Bold}</b> {t.homeFeatBullet2}</span></li>
                            <li className="flex gap-3"><Check className="w-5 h-5 text-green-600 dark:text-green-500 mt-0.5 shrink-0" />
                                <span><b>{t.homeFeatBullet3Bold}</b> {t.homeFeatBullet3}</span></li>
                        </ul>
                    </div>

                    <div className="border rounded-lg p-6 bg-sky-50 border-slate-200 dark:bg-slate-900 dark:border-slate-800">
                        <p className="text-xs uppercase tracking-widest font-bold mb-4 text-slate-500">{t.homeFeatTopMatches}</p>
                        <div className="space-y-3">
                            <JobPreview title="Backend Engineer (Payments)" company="Stripe · Remote, US" salary="$140k–$190k" score={82} variant="green" />
                            <JobPreview title="Software Engineer, Platform" company="Plaid · New York, NY" salary="$130k–$170k" score={71} variant="green" />
                            <JobPreview title="Senior Software Developer" company="Block (Square) · San Francisco" salary="$155k–$210k" score={68} variant="sky" />
                            <JobPreview title="Full-Stack Developer" company="Acme Health · Boston, MA" salary="$110k–$135k" score={52} variant="amber" dim />
                        </div>
                        <p className="mt-4 text-xs text-center text-slate-500">{t.homeFeatPreviewNote}</p>
                    </div>
                </div>
            </section>

            {/* ============================== LANGUAGES ============================== */}
            <section id="languages" className="border-y py-20 bg-sky-50 border-slate-200 dark:bg-slate-900 dark:border-slate-800">
                <div className="mx-auto max-w-6xl px-6 text-center">
                    <p className="text-sm font-bold tracking-widest uppercase text-sky-700 dark:text-sky-400">{t.homeLangsLabel}</p>
                    <h2 className="h-serif text-4xl md:text-5xl font-medium mt-3 text-slate-900 dark:text-white">{t.homeLangsTitle}</h2>
                    <p className="mt-5 text-lg max-w-2xl mx-auto text-slate-600 dark:text-slate-400">{t.homeLangsSub}</p>
                    <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 max-w-4xl mx-auto">
                        {[
                            { native: 'English', en: 'English' },
                            { native: 'Español', en: 'Spanish' },
                            { native: 'Français', en: 'French' },
                            { native: 'العربية', en: 'Arabic' },
                            { native: '中文', en: 'Chinese' },
                            { native: 'हिन्दी', en: 'Hindi' }
                        ].map(l => (
                            <div key={l.en} className="border rounded-lg py-5 px-3 bg-white border-slate-200 dark:bg-slate-950/60 dark:border-slate-800">
                                <p className="h-serif text-xl font-medium text-slate-900 dark:text-white">{l.native}</p>
                                <p className="text-xs mt-1 text-slate-500">{l.en}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ============================== STORIES (placeholder portraits) ============================== */}
            <section id="stories" className="py-24 bg-white dark:bg-slate-950">
                <div className="mx-auto max-w-6xl px-6">
                    <div className="text-center mb-14">
                        <p className="text-sm font-bold tracking-widest uppercase text-sky-700 dark:text-sky-400">{t.homeStoriesLabel}</p>
                        <h2 className="h-serif text-4xl md:text-5xl font-medium mt-3 text-slate-900 dark:text-white">{t.homeStoriesTitle}</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Story initials="MR" bg="bg-sky-700" name="Maria R." role="Registered Nurse · Houston, TX"
                               quote="My nursing license was from Mexico. EmployAI mapped it to its US equivalent and matched me with a clinic that wanted exactly my experience." />
                        <Story initials="AK" bg="bg-slate-800" name="Ahmad K." role="Civil Engineer · Detroit, MI"
                               quote="I uploaded my CV in Arabic and got my first three interviews within a week. Nobody else was matching me on what I could actually do." />
                        <Story initials="LZ" bg="bg-green-700" name="Linh Z." role="Data Analyst · Seattle, WA"
                               quote="The resume coach told me which bullets to rewrite and why. My top match jumped from 51% to 78% in an afternoon." />
                    </div>
                    <p className="text-center text-xs text-slate-500 dark:text-slate-600 mt-8 italic">{t.homeStoriesFootnote}</p>
                </div>
            </section>

            {/* ============================== FINAL CTA ============================== */}
            <section className="bg-sky-700 dark:bg-sky-800 text-white">
                <div className="mx-auto max-w-4xl px-6 py-20 text-center">
                    <h2 className="h-serif text-4xl md:text-5xl font-medium leading-tight">{t.homeFinalTitle}</h2>
                    <p className="mt-5 text-lg max-w-2xl mx-auto text-sky-100">{t.homeFinalSub}</p>
                    <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                        <Link to={ctaHref}
                              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-md font-bold transition-colors
                                         bg-green-500 hover:bg-green-400 text-slate-950">
                            {ctaLabel}
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                        <a href="#how"
                           className="inline-flex items-center justify-center px-7 py-3.5 rounded-md font-semibold border border-white/30 hover:border-white text-white/90 hover:text-white transition-colors">
                            {t.homeFinalSeeHow}
                        </a>
                    </div>
                </div>
            </section>

            {/* ============================== FOOTER ============================== */}
            <footer className="bg-slate-900 dark:bg-slate-950 text-slate-300 border-t border-slate-800">
                <div className="mx-auto max-w-7xl px-6 py-14 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
                    <div className="col-span-2">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-white text-slate-900 font-bold">E</span>
                            <span className="text-lg font-bold text-white">EmployAI</span>
                        </div>
                        <p className="leading-relaxed max-w-sm">{t.homeFooterDesc}</p>
                    </div>
                    <div>
                        <p className="text-white font-bold mb-3">{t.homeFooterProduct}</p>
                        <ul className="space-y-2">
                            <li><a href="#how" className="hover:text-white transition-colors">{t.homeFooterHowItWorks}</a></li>
                            <li><Link to="/editor" className="hover:text-white transition-colors">{t.homeFooterStudio}</Link></li>
                            <li><Link to="/analyze" className="hover:text-white transition-colors">{t.homeFooterMatching}</Link></li>
                            <li><Link to="/jobs" className="hover:text-white transition-colors">{t.homeFooterTracking}</Link></li>
                        </ul>
                    </div>
                    <div>
                        <p className="text-white font-bold mb-3">{t.homeFooterAbout}</p>
                        <ul className="space-y-2">
                            <li><a href="#" className="hover:text-white transition-colors">{t.homeFooterTeam}</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">{t.homeFooterMission}</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">{t.homeFooterPrivacy}</a></li>
                            <li><a href="https://github.com/BrokeBoiXFein/EmployAI" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors inline-flex items-center gap-1">{t.homeFooterGithub} <ExternalLink className="w-3 h-3" /></a></li>
                        </ul>
                    </div>
                </div>
                <div className="border-t border-slate-800">
                    <p className="mx-auto max-w-7xl px-6 py-5 text-xs text-slate-500">
                        © {new Date().getFullYear()} {t.homeFooterDisclaimer}
                    </p>
                </div>
            </footer>
        </div>
    );
};

// ------------------------------------------------------------
// Sub-components
// ------------------------------------------------------------

const SCORE_VARIANTS = {
    green: 'bg-green-600 text-white',
    sky:   'bg-sky-600 text-white',
    amber: 'bg-amber-500 text-white'
};

function JobPreview({ title, company, salary, score, variant, dim }) {
    return (
        <div className={`flex items-start justify-between gap-3 p-4 rounded-md border
                         bg-white border-slate-200
                         dark:bg-slate-950/60 dark:border-slate-800
                         ${dim ? 'opacity-80' : ''}`}>
            <div className="min-w-0">
                <p className="font-bold text-slate-900 dark:text-white">{title}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">{company}</p>
                <p className="text-xs mt-1 text-slate-500">{salary}</p>
            </div>
            <span className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full ${SCORE_VARIANTS[variant] || SCORE_VARIANTS.green}`}>
                {score}%
            </span>
        </div>
    );
}

function Story({ initials, bg, name, role, quote }) {
    return (
        <article className="border rounded-lg overflow-hidden flex flex-col bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800">
            <div className="aspect-[4/3] flex items-center justify-center bg-sky-100 dark:bg-slate-800">
                <span className="h-serif h-24 w-24 rounded-full inline-flex items-center justify-center text-2xl font-bold text-white" style={{}}>
                    <span className={`h-24 w-24 rounded-full ${bg} inline-flex items-center justify-center`}>{initials}</span>
                </span>
            </div>
            <div className="p-6">
                <p className="text-base leading-relaxed text-slate-900 dark:text-slate-100">"{quote}"</p>
                <p className="mt-4 text-sm font-bold text-slate-900 dark:text-white">{name}</p>
                <p className="text-xs text-slate-500">{role}</p>
            </div>
        </article>
    );
}

export default Home;
