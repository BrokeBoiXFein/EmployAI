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
import { ArrowRight, Check, ExternalLink } from 'lucide-react';
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

    const handlePopularClick = (value) => {
        setIntent(value);
        try { localStorage.setItem(INTENT_KEY, value); } catch { /* private mode */ }
        navigate(ctaHref);
    };

    // Popular role chips — translated
    const popular = [t.homePop1, t.homePop2, t.homePop3, t.homePop4];

    return (
        <div className="text-slate-800 dark:text-slate-200">

            {/* ============================== HERO ============================== */}
            <section className="relative overflow-hidden bg-white dark:bg-slate-950">
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
                        <label htmlFor="home-intent" className="sr-only">{t.homeHeroPlaceholder}</label>
                        <input id="home-intent"
                               type="text"
                               value={intent}
                               onChange={(e) => setIntent(e.target.value)}
                               placeholder={t.homeHeroPlaceholder}
                               autoComplete="off"
                               className="flex-1 bg-transparent outline-none text-base px-4 py-3 min-w-0
                                          placeholder:text-slate-400 dark:placeholder:text-slate-500
                                          text-slate-900 dark:text-white" />
                        <button type="submit"
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md font-bold transition-colors cursor-pointer
                                           bg-green-600 hover:bg-green-700 text-white
                                           dark:bg-green-600 dark:hover:bg-green-500">
                            {ctaLabel}
                            <ArrowRight className="w-4 h-4" aria-hidden="true" />
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
                                <button type="button" onClick={() => handlePopularClick(p)}
                                        className="text-sky-700 dark:text-sky-400 hover:underline cursor-pointer bg-transparent border-none p-0 font-[inherit]">{p}</button>
                            </React.Fragment>
                        ))}
                    </div>

                    <div className="mt-14 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-sm text-slate-600 dark:text-slate-400">
                        <span className="flex items-center gap-2"><Check className="w-5 h-5 text-green-600 dark:text-green-500" aria-hidden="true" />{t.homeTrustNoFee}</span>
                        <span className="flex items-center gap-2"><Check className="w-5 h-5 text-green-600 dark:text-green-500" aria-hidden="true" />{t.homeTrustPrivate}</span>
                        <span className="flex items-center gap-2"><Check className="w-5 h-5 text-green-600 dark:text-green-500" aria-hidden="true" />{t.homeTrustAnyLang}</span>
                    </div>
                </div>
            </section>

            {/* ============================== HOW IT WORKS ============================== */}
            <section id="how" className="border-y py-24 bg-sky-50 border-slate-200 dark:bg-slate-900 dark:border-slate-800">
                <div className="mx-auto max-w-6xl px-6">
                    <div className="mb-12">
                        <p className="text-sm font-bold tracking-widest uppercase text-sky-700 dark:text-sky-400">{t.homeHowLabel}</p>
                        <h2 className="h-serif text-4xl md:text-5xl font-medium mt-3 max-w-3xl text-slate-900 dark:text-white">{t.homeHowTitle}</h2>
                    </div>
                    <ol className="max-w-5xl mx-auto">
                        {[
                            { n: '01', title: t.homeStep1Title, desc: t.homeStep1Desc },
                            { n: '02', title: t.homeStep2Title, desc: t.homeStep2Desc },
                            { n: '03', title: t.homeStep3Title, desc: t.homeStep3Desc }
                        ].map((step, i) => (
                            <li key={step.n}
                                className={`flex flex-col gap-5 py-10 md:flex-row md:items-baseline md:gap-12
                                            ${i % 2 === 1 ? 'md:flex-row-reverse' : ''}
                                            ${i > 0 ? 'border-t border-slate-200 dark:border-slate-800' : ''}`}>
                                <span aria-hidden="true"
                                      className="h-serif text-7xl md:text-8xl font-medium leading-none text-sky-700 dark:text-sky-400 shrink-0 tabular-nums w-24 md:w-32">
                                    {step.n}
                                </span>
                                <div className="flex-1 max-w-2xl">
                                    <h3 className="h-serif text-2xl md:text-3xl font-medium mb-3 text-slate-900 dark:text-white">{step.title}</h3>
                                    <p className="leading-relaxed text-lg text-slate-600 dark:text-slate-400">{step.desc}</p>
                                </div>
                            </li>
                        ))}
                    </ol>
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
                                <span><b>{t.homeFeatBullet1Bold}</b>: {t.homeFeatBullet1}</span></li>
                            <li className="flex gap-3"><Check className="w-5 h-5 text-green-600 dark:text-green-500 mt-0.5 shrink-0" />
                                <span><b>{t.homeFeatBullet2Bold}</b> {t.homeFeatBullet2}</span></li>
                            <li className="flex gap-3"><Check className="w-5 h-5 text-green-600 dark:text-green-500 mt-0.5 shrink-0" />
                                <span><b>{t.homeFeatBullet3Bold}</b> {t.homeFeatBullet3}</span></li>
                        </ul>
                    </div>

                    <div className="border rounded-lg bg-sky-50 border-slate-200 dark:bg-slate-900 dark:border-slate-800">
                        <p className="text-xs uppercase tracking-widest font-bold px-6 pt-6 pb-4 text-slate-500">{t.homeFeatTopMatches}</p>
                        <ul className="divide-y divide-slate-200 dark:divide-slate-800 px-6">
                            <JobPreview title="Backend Engineer (Payments)" company="Stripe · Remote, US" salary="$140k–$190k" score={82} variant="green" />
                            <JobPreview title="Software Engineer, Platform" company="Plaid · New York, NY" salary="$130k–$170k" score={71} variant="green" />
                            <JobPreview title="Senior Software Developer" company="Block (Square) · San Francisco" salary="$155k–$210k" score={68} variant="sky" />
                            <JobPreview title="Full-Stack Developer" company="Acme Health · Boston, MA" salary="$110k–$135k" score={52} variant="amber" dim />
                        </ul>
                        <p className="px-6 pt-4 pb-6 text-xs text-center text-slate-500">{t.homeFeatPreviewNote}</p>
                    </div>
                </div>
            </section>

            {/* ============================== LANGUAGES ============================== */}
            <section id="languages" className="border-y py-20 bg-sky-50 border-slate-200 dark:bg-slate-900 dark:border-slate-800">
                <div className="mx-auto max-w-4xl px-6 text-center">
                    <p className="text-sm font-bold tracking-widest uppercase text-sky-700 dark:text-sky-400">{t.homeLangsLabel}</p>
                    <h2 className="h-serif text-4xl md:text-5xl font-medium mt-3 text-slate-900 dark:text-white">{t.homeLangsTitle}</h2>
                    <p className="mt-5 text-lg max-w-2xl mx-auto text-slate-600 dark:text-slate-400">{t.homeLangsSub}</p>
                    <ul className="mt-14 grid grid-cols-2 sm:grid-cols-3 gap-y-8 gap-x-6 max-w-3xl mx-auto">
                        {[
                            { name: 'English',  dir: 'ltr' },
                            { name: 'Español',  dir: 'ltr' },
                            { name: 'Français', dir: 'ltr' },
                            { name: 'العربية',  dir: 'rtl' },
                            { name: '中文',     dir: 'ltr' },
                            { name: 'हिन्दी',    dir: 'ltr' }
                        ].map((lang) => (
                            <li key={lang.name}
                                dir={lang.dir}
                                className="h-serif text-3xl md:text-4xl font-medium leading-snug text-slate-900 dark:text-white">
                                {lang.name}
                            </li>
                        ))}
                    </ul>
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
                <div className="mx-auto max-w-7xl px-6 py-14 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
                    <div className="md:col-span-2">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-sky-600 text-white font-bold text-lg">E</span>
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
        <li className={`flex items-start justify-between gap-3 py-4 ${dim ? 'opacity-80' : ''}`}>
            <div className="min-w-0">
                <p className="font-bold text-slate-900 dark:text-white">{title}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">{company}</p>
                <p className="text-xs mt-1 text-slate-500">{salary}</p>
            </div>
            <span className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full ${SCORE_VARIANTS[variant] || SCORE_VARIANTS.green}`}>
                {score}%
            </span>
        </li>
    );
}

export default Home;
