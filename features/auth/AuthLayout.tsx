import React from 'react';

interface AuthLayoutProps {
    children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
    return (
        <div className="min-h-screen flex w-full bg-white font-sans">
            {/* Left Side: Professional */}
            <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 relative overflow-hidden items-center justify-center p-12">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>
                
                {/* Content */}
                <div className="relative z-10 text-white max-w-lg text-center">
                    <div className="w-20 h-20 bg-white/10 backdrop-blur-xl rounded-2xl mx-auto mb-8 flex items-center justify-center border border-white/20 shadow-2xl">
                        <span className="text-4xl">🚀</span>
                    </div>
                    <h1 className="text-5xl font-bold mb-6 tracking-tight drop-shadow-sm font-['Plus_Jakarta_Sans'] leading-tight">
                        Build Apps<br/><span className="text-indigo-400">At Speed</span>
                    </h1>
                    <p className="text-lg font-medium leading-relaxed opacity-80 mb-10 text-slate-300">
                        The AI-powered workspace where ideas become functional applications in seconds. Secure, scalable, and intuitive.
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 text-left">
                            <div className="text-2xl mb-1">⚡</div>
                            <div className="font-bold text-sm">Instant Code</div>
                            <div className="text-[10px] opacity-60">From prompt to preview</div>
                        </div>
                        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 text-left">
                            <div className="text-2xl mb-1">🔐</div>
                            <div className="font-bold text-sm">Secure 2FA</div>
                            <div className="text-[10px] opacity-60">Your data is safe</div>
                        </div>
                    </div>
                </div>
                
                {/* Decorative Circles */}
                <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-indigo-500 rounded-full blur-[120px] opacity-20 animate-pulse"></div>
                <div className="absolute top-20 right-20 w-32 h-32 bg-white rounded-full blur-[80px] opacity-10"></div>
            </div>

            {/* Right Side: Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-white relative">
                <div className="max-w-md w-full relative z-10">
                    {children}
                </div>
            </div>
        </div>
    );
};