import React, { useRef, useEffect } from 'react';
import { MessageCircle, Bot, X, Loader2, Send } from 'lucide-react';
import { useLang } from '../store/lang';

const ChatWidget = ({ chatOpen, setChatOpen, messages, inputMessage, setInputMessage, handleKeyPress, sendMessage, chatLoading }) => {
    const t = useLang(s => s.t);
    const messagesEndRef = useRef(null);
    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    return (
        <>
            {!chatOpen && (
                <button onClick={() => setChatOpen(true)}
                        className="fixed bottom-8 right-8 z-50 inline-flex items-center gap-2 px-5 py-3.5 rounded-full font-bold transition-colors cursor-pointer
                                   bg-slate-900 hover:bg-slate-700 text-white
                                   dark:bg-sky-600 dark:hover:bg-sky-500 dark:text-white
                                   shadow-lg dark:shadow-sky-500/20">
                    <MessageCircle className="w-5 h-5" />
                    {t.chatAskCoach}
                </button>
            )}

            {chatOpen && (
                <div className="fixed bottom-8 right-8 w-[400px] h-[600px] max-w-[calc(100vw-4rem)] max-h-[calc(100vh-4rem)] z-50
                                rounded-lg shadow-2xl flex flex-col overflow-hidden
                                bg-white border border-slate-200
                                dark:bg-slate-900 dark:border-slate-800">
                    {/* Header */}
                    <header className="p-4 flex items-center justify-between
                                       bg-sky-600 text-white
                                       dark:bg-sky-700">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-white/20">
                                <Bot className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white leading-none mb-1">{t.chatTitle}</h3>
                                <p className="text-xs text-sky-100/80">{t.chatSubtitle}</p>
                            </div>
                        </div>
                        <button onClick={() => setChatOpen(false)}
                                className="text-white/70 hover:text-white transition-colors cursor-pointer">
                            <X className="w-5 h-5" />
                        </button>
                    </header>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3
                                    bg-slate-50 dark:bg-slate-950">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-3 rounded-lg text-sm leading-relaxed
                                                ${msg.role === 'user'
                                                  ? 'bg-sky-600 text-white rounded-tr-none dark:bg-sky-600'
                                                  : 'bg-white text-slate-800 rounded-tl-none border border-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700'}`}>
                                    <p className="whitespace-pre-wrap">{msg.content}</p>
                                </div>
                            </div>
                        ))}
                        {chatLoading && (
                            <div className="flex justify-start">
                                <div className="p-3 rounded-lg rounded-tl-none
                                                bg-white border border-slate-200
                                                dark:bg-slate-800 dark:border-slate-700">
                                    <Loader2 className="w-4 h-4 animate-spin text-sky-600 dark:text-sky-400" />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <footer className="p-3 border-t
                                       bg-white border-slate-200
                                       dark:bg-slate-900 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                            <input type="text" value={inputMessage}
                                   onChange={(e) => setInputMessage(e.target.value)}
                                   onKeyDown={handleKeyPress}
                                   placeholder={t.chatPlaceholder}
                                   disabled={chatLoading}
                                   className="flex-1 rounded-md px-4 py-2.5 text-sm outline-none transition-colors
                                              bg-slate-100 border border-slate-200 text-slate-900 placeholder:text-slate-400
                                              dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-500
                                              focus:ring-2 focus:ring-sky-500 focus:border-transparent" />
                            <button onClick={sendMessage} disabled={!inputMessage.trim() || chatLoading}
                                    className={`p-2.5 rounded-md transition-colors cursor-pointer
                                                ${!inputMessage.trim() || chatLoading
                                                  ? 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed'
                                                  : 'bg-sky-600 hover:bg-sky-700 text-white dark:bg-sky-600 dark:hover:bg-sky-500'}`}>
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
