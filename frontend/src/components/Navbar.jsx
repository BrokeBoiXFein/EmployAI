import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
    Languages, Home as HomeIcon, Search, LogIn, UserPlus, LogOut, User,
    FileText, Briefcase, Wand2, Sun, Moon
} from 'lucide-react';
import { useAuth } from '../store/auth';
import { useTheme } from '../store/theme';

// Single source of truth for nav link classes — light + dark variants.
// `isActive` is the React Router pseudo-state.
function navLinkCls({ isActive }) {
    if (isActive) {
        return 'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ' +
               'bg-sky-600 text-white ' +
               'dark:bg-sky-500 dark:text-slate-950';
    }
    return 'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ' +
           'text-slate-700 hover:text-slate-900 hover:bg-slate-100 ' +
           'dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800';
}

const Navbar = ({ language, setLanguage }) => {
    const user = useAuth(s => s.user);
    const loading = useAuth(s => s.loading);
    const logout = useAuth(s => s.logout);
    const theme = useTheme(s => s.theme);
    const toggleTheme = useTheme(s => s.toggle);
    const navigate = useNavigate();

    const handleLogout = () => { logout(); navigate('/'); };

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 border-b
                        bg-white border-slate-200
                        dark:bg-slate-900/95 dark:border-slate-800 dark:backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16 gap-4">

                    {/* Logo + nav links */}
                    <div className="flex items-center gap-6 min-w-0">
                        <NavLink to="/" className="flex items-center gap-2 shrink-0">
                            <span className="inline-flex h-9 w-9 items-center justify-center rounded-md
                                             bg-sky-600 text-white
                                             dark:bg-sky-500 dark:text-slate-950
                                             font-bold text-lg">E</span>
                            <span className="text-xl font-bold tracking-tight
                                             text-slate-900 dark:text-white">EmployAI</span>
                        </NavLink>

                        <div className="hidden md:flex items-center gap-1">
                            <NavLink to="/" end className={navLinkCls}>
                                <HomeIcon className="w-4 h-4" />
                                Home
                            </NavLink>
                            <NavLink to="/analyze" className={navLinkCls}>
                                <Search className="w-4 h-4" />
                                Analyze
                            </NavLink>
                            <NavLink to="/editor" className={navLinkCls}>
                                <Wand2 className="w-4 h-4" />
                                Studio
                            </NavLink>
                            <NavLink to="/resumes" className={navLinkCls}>
                                <FileText className="w-4 h-4" />
                                Resumes
                            </NavLink>
                            <NavLink to="/jobs" className={navLinkCls}>
                                <Briefcase className="w-4 h-4" />
                                Jobs
                            </NavLink>
                        </div>
                    </div>

                    {/* Right side: language, theme toggle, auth */}
                    <div className="flex items-center gap-2 shrink-0">
                        {/* Language picker */}
                        <div className="hidden sm:flex items-center gap-1.5 rounded-md px-2 py-1.5
                                        text-slate-700 hover:bg-slate-100
                                        dark:text-slate-300 dark:hover:bg-slate-800
                                        transition-colors">
                            <Languages className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                            <select
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                className="bg-transparent border-none outline-none cursor-pointer text-sm font-medium appearance-none pr-1 focus:ring-0"
                            >
                                <option value="en" className="bg-white dark:bg-slate-900">English</option>
                                <option value="es" className="bg-white dark:bg-slate-900">Español</option>
                                <option value="fr" className="bg-white dark:bg-slate-900">Français</option>
                                <option value="ar" className="bg-white dark:bg-slate-900">العربية</option>
                                <option value="zh" className="bg-white dark:bg-slate-900">中文</option>
                                <option value="hi" className="bg-white dark:bg-slate-900">हिन्दी</option>
                            </select>
                        </div>

                        {/* Theme toggle */}
                        <button
                            onClick={toggleTheme}
                            className="inline-flex items-center justify-center h-9 w-9 rounded-md
                                       text-slate-600 hover:text-slate-900 hover:bg-slate-100
                                       dark:text-slate-400 dark:hover:text-amber-300 dark:hover:bg-slate-800
                                       transition-colors cursor-pointer"
                            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                            aria-label="Toggle theme"
                        >
                            {theme === 'dark'
                                ? <Sun className="w-5 h-5" />
                                : <Moon className="w-5 h-5" />}
                        </button>

                        {/* Auth controls */}
                        {!loading && (user ? (
                            <div className="flex items-center gap-2 pl-1 border-l border-slate-200 dark:border-slate-800 ml-1">
                                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md
                                                text-slate-700 dark:text-slate-200">
                                    <User className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                                    <span className="text-sm font-medium truncate max-w-[120px]">{user.name || user.email}</span>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium
                                               text-slate-600 hover:text-slate-900 hover:bg-slate-100
                                               dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800
                                               transition-colors cursor-pointer"
                                    title="Log out"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span className="hidden sm:inline">Log out</span>
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1 pl-1 border-l border-slate-200 dark:border-slate-800 ml-1">
                                <Link to="/login"
                                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold
                                                 text-slate-700 hover:text-slate-900 hover:bg-slate-100
                                                 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800
                                                 transition-colors">
                                    <LogIn className="w-4 h-4" />
                                    <span className="hidden sm:inline">Log in</span>
                                </Link>
                                <Link to="/signup"
                                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-bold
                                                 bg-green-600 hover:bg-green-500 text-white
                                                 dark:bg-green-500 dark:hover:bg-green-400 dark:text-slate-950
                                                 transition-colors">
                                    <UserPlus className="w-4 h-4" />
                                    <span className="hidden sm:inline">Sign up</span>
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
