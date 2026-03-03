import React from 'react';
import { Globe, Languages } from 'lucide-react';

const Navbar = ({ language, setLanguage, translations }) => {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-indigo-950/80 backdrop-blur-md border-b border-indigo-900/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-2">
                        <div className="bg-indigo-600 p-1.5 rounded-lg shadow-lg shadow-indigo-500/20">
                            <Globe className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-indigo-200">
                            EmployAI
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
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
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
