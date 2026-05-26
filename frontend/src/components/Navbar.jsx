import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Globe, Languages, Home, Search, LogIn, UserPlus, LogOut, User, FileText, Briefcase } from 'lucide-react';
import { useAuth } from '../store/auth';

const Navbar = ({ language, setLanguage, translations }) => {
    const user = useAuth(s => s.user);
    const loading = useAuth(s => s.loading);
    const logout = useAuth(s => s.logout);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-indigo-950/80 backdrop-blur-md border-b border-indigo-900/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-8">
                        <NavLink to="/" className="flex items-center gap-2">
                            <div className="bg-indigo-600 p-1.5 rounded-lg shadow-lg shadow-indigo-500/20">
                                <Globe className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-indigo-200">
                                EmployAI
                            </span>
                        </NavLink>

                        <div className="hidden md:flex items-center gap-1">
                            <NavLink
                                to="/"
                                className={({ isActive }) =>
                                    `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-white/10 text-white' : 'text-indigo-200/60 hover:text-white hover:bg-white/5'
                                    }`
                                }
                            >
                                <Home className="w-4 h-4" />
                                Home
                            </NavLink>
                            <NavLink
                                to="/analyze"
                                className={({ isActive }) =>
                                    `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-white/10 text-white' : 'text-indigo-200/60 hover:text-white hover:bg-white/5'
                                    }`
                                }
                            >
                                <Search className="w-4 h-4" />
                                Analyze
                            </NavLink>
                            <NavLink
                                to="/resumes"
                                className={({ isActive }) =>
                                    `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-white/10 text-white' : 'text-indigo-200/60 hover:text-white hover:bg-white/5'
                                    }`
                                }
                            >
                                <FileText className="w-4 h-4" />
                                Resumes
                            </NavLink>
                            <NavLink
                                to="/jobs"
                                className={({ isActive }) =>
                                    `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-white/10 text-white' : 'text-indigo-200/60 hover:text-white hover:bg-white/5'
                                    }`
                                }
                            >
                                <Briefcase className="w-4 h-4" />
                                Jobs
                            </NavLink>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-indigo-900/40 border border-indigo-800/50 rounded-full px-3 py-1.5 transition-all hover:bg-indigo-900/60">
                            <Languages className="w-4 h-4 text-indigo-300" />
                            <select
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                className="bg-transparent border-none outline-none cursor-pointer text-sm font-medium text-white appearance-none pr-1 focus:ring-0"
                            >
                                <option value="en" className="bg-indigo-950">English</option>
                                <option value="es" className="bg-indigo-950">Español</option>
                                <option value="fr" className="bg-indigo-950">Français</option>
                                <option value="ar" className="bg-indigo-950">العربية</option>
                                <option value="zh" className="bg-indigo-950">中文</option>
                                <option value="hi" className="bg-indigo-950">हिन्दी</option>
                            </select>
                        </div>

                        {/* Auth controls. While the store is hydrating (first ~200ms after
                            page load), render nothing to avoid a "Login → Logout" flash. */}
                        {!loading && (user ? (
                            <div className="flex items-center gap-2">
                                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-900/40 border border-indigo-800/50">
                                    <User className="w-4 h-4 text-indigo-300" />
                                    <span className="text-sm text-white truncate max-w-[120px]">{user.name || user.email}</span>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm text-indigo-200/80 hover:text-white hover:bg-white/5 transition"
                                    title="Log out"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span className="hidden sm:inline">Log out</span>
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1">
                                <Link
                                    to="/login"
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm text-indigo-200/80 hover:text-white hover:bg-white/5 transition"
                                >
                                    <LogIn className="w-4 h-4" />
                                    <span className="hidden sm:inline">Log in</span>
                                </Link>
                                <Link
                                    to="/signup"
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-lg shadow-indigo-500/20"
                                >
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
