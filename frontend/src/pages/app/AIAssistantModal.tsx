import React, { useState, FormEvent, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { AppView } from '@/types';
import Button from '@/components/common/Button';
import type { ChatMessage } from '@/types';
import { AssistantIcon } from '@/constants';

interface AIAssistantModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentView: AppView;
}

const getSystemInstruction = (view: AppView): string => {
    let context = `The user is currently on the "${view}" page. `;
    switch (view) {
        case AppView.DASHBOARD:
            context += "This page shows a high-level overview of their portfolio value, allocation, active bots, and recent backtests.";
            break;
        case AppView.BACKTESTER:
            context += "This page is for configuring and running backtests of trading strategies. They can set parameters, choose assets, and see performance metrics like profit, drawdown, and Sharpe ratio.";
            break;
        case AppView.BOT_LAB:
            context += "This page is for creating, managing, and monitoring live trading bots.";
            break;
        case AppView.AI_FOUNDRY:
            context += "This page allows users to generate trading strategy code using natural language prompts powered by AI.";
            break;
        case AppView.PORTFOLIO:
             context += "This page is for tracking their portfolio, connecting exchanges, and analyzing risk.";
             break;
        case AppView.SENTIMENT_ENGINE:
            context += "This page analyzes market sentiment from sources like Twitter, Reddit, and news.";
            break;
        default:
            context += "Analyze the user's question and provide a helpful response related to quantitative trading and using a platform like CosmoQuantAI.";
    }

    return `You are "Cosmo", a specialized AI assistant for the CosmoQuantAI trading platform. Your expertise is in quantitative finance, trading algorithms, and helping users navigate this platform. ${context} Answer concisely and provide actionable advice when possible. Format your answers with markdown for readability (e.g., using **bold** and *italics*, and lists).`;
};

const AIAssistantModal: React.FC<AIAssistantModalProps> = ({ isOpen, onClose, currentView }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);
    
    useEffect(() => {
        if(isOpen) {
            setMessages([{ role: 'model', content: `Hello! I'm Cosmo, your AI assistant. You're on the **${currentView}** page. How can I help you today?`}]);
            setInput('');
        }
    }, [isOpen, currentView]);

    const handleSendMessage = async (e: FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: ChatMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const systemInstruction = getSystemInstruction(currentView);
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: input,
                config: {
                    systemInstruction,
                }
            });
            
            const modelMessage: ChatMessage = { role: 'model', content: response.text };
            setMessages(prev => [...prev, modelMessage]);

        } catch (error) {
            console.error("Error communicating with Gemini:", error);
            const errorMessage: ChatMessage = { role: 'model', content: "Sorry, I encountered an error and couldn't process your request. Please try again. If the problem persists, please check the browser console." };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };
    
    // A simple markdown renderer
    const renderMarkdown = (text: string) => {
        const html = text
            .replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-900 dark:text-white">$1</strong>') // Bold
            .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italics
            .replace(/^- (.*$)/gm, '<li class="ml-4 list-disc">$1</li>'); // List items
        return <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-li:my-1" dangerouslySetInnerHTML={{ __html: html }} />;
    };


    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="ai-assistant-title">
            <div className="bg-white dark:bg-brand-dark w-full max-w-2xl h-[80vh] rounded-lg shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex justify-between items-center p-4 border-b border-brand-border-light dark:border-brand-border-dark flex-shrink-0">
                    <h2 id="ai-assistant-title" className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-3">
                        <AssistantIcon className="h-6 w-6 text-brand-primary" />
                        Cosmo AI Assistant
                    </h2>
                    <button onClick={onClose} className="text-2xl text-gray-400 hover:text-white">&times;</button>
                </header>
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                             {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-brand-primary/20 flex items-center justify-center flex-shrink-0"><AssistantIcon className="h-5 w-5 text-brand-primary"/></div>}
                            <div className={`max-w-xl p-3 rounded-lg ${msg.role === 'user' ? 'bg-brand-primary text-white' : 'bg-gray-100 dark:bg-brand-dark'}`}>
                                {renderMarkdown(msg.content)}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-brand-primary/20 flex items-center justify-center flex-shrink-0"><AssistantIcon className="h-5 w-5 text-brand-primary"/></div>
                            <div className="max-w-md p-3 rounded-lg bg-gray-100 dark:bg-brand-dark flex items-center space-x-2">
                                <span className="block w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="block w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="block w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                            </div>
                        </div>
                    )}
                     <div ref={messagesEndRef} />
                </div>
                <form onSubmit={handleSendMessage} className="p-4 border-t border-brand-border-light dark:border-brand-border-dark flex items-center gap-2 flex-shrink-0">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={`Ask about ${currentView}...`}
                        className="flex-1 w-full bg-gray-100 dark:bg-slate-700 border-transparent focus:border-brand-primary focus:ring-brand-primary rounded-md p-2 text-sm"
                        disabled={isLoading}
                    />
                    <Button type="submit" disabled={isLoading || !input.trim()}>Send</Button>
                </form>
            </div>
        </div>
    );
};

export default AIAssistantModal;
