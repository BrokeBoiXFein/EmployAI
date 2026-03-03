import React from 'react';

const Hero = ({ t }) => {
    return (
        <div className="relative pt-32 pb-16 overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[128px]" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[128px]" />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    {t.title}
                </h1>
                <p className="max-w-2xl mx-auto text-lg md:text-xl text-indigo-200/80 leading-relaxed mb-10 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-200">
                    {t.subtitle}
                </p>
            </div>
        </div>
    );
};

export default Hero;
