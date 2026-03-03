import React, { useRef, useEffect } from 'react';
import { MessageCircle, Bot, X, Loader2, Send } from 'lucide-react';

const ChatWidget = ({ chatOpen, setChatOpen, messages, inputMessage, setInputMessage, handleKeyPress, sendMessage, chatLoading, t }) => {
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <>
            {!chatOpen && (
                <button
                    onClick={() => setChatOpen(true)}
                    className="fixed bottom-8 right-8 bg-indigo-600 hover:bg-indigo-500 text-white p-4 rounded-full shadow-2xl shadow-indigo-900/40 transition-all hover:scale-110 active:scale-95 z-50 group"
                >
                    <div className="absolute -top-12 right-0 bg-white text-indigo-900 text-xs font-bold px-3 py-2 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap after:content-[''] after:absolute after:top-full after:right-5 after:border-8 after:border-transparent after:border-t-white">
                        Need help? Chat with me!
                    </div>
                    <MessageCircle className="w-6 h-6" />
                </button>
            )}

            {chatOpen && (
                <div className="fixed bottom-8 right-8 w-[400px] h-[600px] max-w-[calc(100vw-4rem)] max-h-[calc(100vh-4rem)] bg-indigo-950 border border-white/10 rounded-3xl shadow-2xl shadow-black/50 flex flex-col overflow-hidden z-50 animate-in zoom-in-95 duration-200 origin-bottom-right">
                    <header className="bg-indigo-600 p-5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-2 rounded-xl">
                                <Bot className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white leading-none mb-1">{t.chatTitle}</h3>
                                <p className="text-indigo-200/60 text-xs">{t.chatSubtitle}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setChatOpen(false)}
                            className="text-white/50 hover:text-white transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </header>

                    <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                                        ? 'bg-indigo-600 text-white rounded-tr-none shadow-lg shadow-indigo-900/20'
                                        : 'bg-white/5 text-indigo-100 rounded-tl-none border border-white/5'
                                    }`}>
                                    <p className="whitespace-pre-wrap">{msg.content}</p>
                                </div>
                            </div>
                        ))}
                        {chatLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white/5 p-4 rounded-2xl rounded-tl-none border border-white/5">
                                    <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <footer className="p-5 border-t border-white/5 bg-indigo-950/50 backdrop-blur-xl">
                        <div className="relative flex items-center gap-2">
                            <input
                                type="text"
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                onKeyDown={handleKeyPress}
                                placeholder={t.chatPlaceholder}
                                disabled={chatLoading}
                                className="flex-1 bg-white/5 border border-white/10 text-white rounded-2xl px-5 py-3 outline-none focus:border-indigo-500/50 transition-colors text-sm placeholder:text-indigo-200/20"
                            />
                            <button
                                onClick={sendMessage}
                                disabled={!inputMessage.trim() || chatLoading}
                                className={`p-3 rounded-xl transition-all ${!inputMessage.trim() || chatLoading
                                        ? 'bg-white/5 text-white/10 cursor-not-allowed'
                                        : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-900/20'
                                    }`}
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </div>
                    </footer>
                </div>
            )}
        </>
    );
};

export default ChatWidget;
