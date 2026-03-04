import React from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, Cell
} from 'recharts';
import { Target, Users, TrendingUp, ShieldCheck } from 'lucide-react';

const immigrationData = [
    { year: '2013', arrivals: 990553 },
    { year: '2014', arrivals: 1016518 },
    { year: '2015', arrivals: 1051031 },
    { year: '2016', arrivals: 1183505 },
    { year: '2017', arrivals: 1127167 },
    { year: '2018', arrivals: 1096611 },
    { year: '2019', arrivals: 1031765 },
    { year: '2020', arrivals: 707362 },
    { year: '2021', arrivals: 740002 },
    { year: '2022', arrivals: 1018303 },
    { year: '2023', arrivals: 1100000 },
];

const impactData = [
    { name: 'Low Employment Rates', value: 80, color: '#f87171' },
    { name: 'Persistent Vacancies', value: 65, color: '#f87171' },
    { name: 'With EmployAI - Suitable Jobs', value: 92, color: '#4ade80' },
    { name: 'With EmployAI - Inclusive Market', value: 88, color: '#4ade80' },
];

const Home = ({ t }) => {
    return (
        <div className="space-y-16 pb-20">
            {/* Hero Section */}
            <section className="relative pt-8 pb-12 overflow-hidden text-center">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none">
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[128px]" />
                    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[128px]" />
                </div>
                <div className="max-w-4xl mx-auto px-4">
                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                        EmployAI
                    </h1>
                    <p className="text-2xl md:text-3xl font-medium text-indigo-200/90 mb-8 italic">
                        Connecting Global Talent with Local Opportunity
                    </p>
                    <div className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-3xl shadow-2xl">
                        <h2 className="text-xl font-semibold text-indigo-300 mb-4 uppercase tracking-wider">Our Objective</h2>
                        <p className="text-lg md:text-xl text-gray-200 leading-relaxed">
                            To develop a conceptual AI tool that uses multilingual NLP and ethical safeguards to connect
                            qualified immigrant job seekers with jobs and reduce structural labor market inefficiencies.
                        </p>
                    </div>
                </div>
            </section>

            {/* The Problem & Stats */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="space-y-6">
                    <h2 className="text-3xl font-bold text-white">The Challenge</h2>
                    <div className="space-y-4 text-gray-300">
                        <p className="flex items-start gap-3">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                            High immigration levels without effective integration mechanisms detrimentally affect the U.S.'s wellbeing.
                        </p>
                        <p className="flex items-start gap-3">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                            Many qualified immigrants remain excluded from formal employment pathways, leading to significant neglect of human capital.
                        </p>
                        <p className="flex items-start gap-3">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                            Persistent labor shortages leave millions of positions unfilled, reducing employer productivity.
                        </p>
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 p-6 rounded-3xl h-[400px]">
                    <h3 className="text-lg font-medium text-indigo-300 mb-4">Annual Authorized Immigrant Arrivals to the U.S.</h3>
                    <ResponsiveContainer width="100%" height="90%">
                        <LineChart data={immigrationData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                            <XAxis dataKey="year" stroke="#94a3b8" fontSize={12} />
                            <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(value) => `${value / 1000}k`} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }}
                                itemStyle={{ color: '#818cf8' }}
                            />
                            <Line type="monotone" dataKey="arrivals" stroke="#6366f1" strokeWidth={3} dot={{ fill: '#6366f1' }} activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </section>

            {/* Engineering Design / Methodology */}
            <section>
                <h2 className="text-3xl font-bold text-white mb-8 text-center">Our Methodology</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { icon: Users, title: "Structured Profile", desc: "Create a system profile mapping native-language skills to US standards." },
                        { icon: TrendingUp, title: "NLP Translation", desc: "Advanced NLP translates and extracts key experience from multi-lingual resumes." },
                        { icon: Target, title: "ML Matching", desc: "ML compares profiles with public labor databases to find the perfect fit." },
                        { icon: ShieldCheck, title: "Built-in Safeguards", desc: "Bias auditing, anonymized data, and human oversight as core principles." }
                    ].map((item, i) => (
                        <div key={i} className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors">
                            <item.icon className="w-10 h-10 text-indigo-400 mb-4" />
                            <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                            <p className="text-gray-400 text-sm">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Future Impacts */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="bg-white/5 border border-white/10 p-6 rounded-3xl h-[400px] order-2 lg:order-1">
                    <h3 className="text-lg font-medium text-indigo-300 mb-4">Projected Labor Market Integration Efficiency</h3>
                    <ResponsiveContainer width="100%" height="90%">
                        <BarChart data={impactData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={150} />
                            <Tooltip
                                cursor={{ fill: 'transparent' }}
                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }}
                            />
                            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                {impactData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="space-y-6 order-1 lg:order-2">
                    <h2 className="text-3xl font-bold text-white">Future Impacts</h2>
                    <div className="space-y-4 text-gray-300">
                        <p className="flex items-center gap-3">
                            <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                            Reduce "brain waste" by connecting workers to matching qualifications.
                        </p>
                        <p className="flex items-center gap-3">
                            <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                            Address persistent labor shortages across critical sectors.
                        </p>
                        <p className="flex items-center gap-3">
                            <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                            Minimize linguistic and structural barriers to employment access.
                        </p>
                        <p className="flex items-center gap-3">
                            <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                            Potential to serve refugees, asylum seekers, and marginalized groups.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
