
import React from 'react';

interface AuthLayoutProps {
    children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
    return (
        <div className="min-h-screen flex w-full bg-white font-sans">
            {/* Left Side: Artistic */}
            <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-[#ff2935] via-[#ff7e15] to-[#ffc93a] relative overflow-hidden items-center justify-center p-12">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
                
                {/* Content */}
                <div className="relative z-10 text-white max-w-lg text-center">
                    <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-3xl mx-auto mb-8 flex items-center justify-center border border-white/40 shadow-2xl">
                        <span className="text-4xl">🚀</span>
                    </div>
                    <h1 className="text-6xl font-black mb-6 tracking-tighter drop-shadow-sm font-['Plus_Jakarta_Sans'] leading-tight">
                        Build Apps<br/><span className="text-[#ffff7e]">At Speed</span>
                    </h1>
                    <p className="text-xl font-medium leading-relaxed opacity-90 mb-10">
                        The AI-powered workspace where ideas become functional applications in seconds. Secure, scalable, and intuitive.
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-left">
                            <div className="text-2xl mb-1">⚡</div>
                            <div className="font-bold text-sm">Instant Code</div>
                            <div className="text-[10px] opacity-75">From prompt to preview</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-left">
                            <div className="text-2xl mb-1">🔐</div>
                            <div className="font-bold text-sm">Secure 2FA</div>
                            <div className="text-[10px] opacity-75">Your data is safe</div>
                        </div>
                    </div>
                </div>
                
                {/* Decorative Circles */}
                <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-[#ffff7e] rounded-full blur-[100px] opacity-30 animate-pulse"></div>
                <div className="absolute top-20 right-20 w-32 h-32 bg-white rounded-full blur-[60px] opacity-40"></div>
            </div>

            {/* Right Side: Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-[#fffdf0] relative">
                <div className="max-w-md w-full relative z-10">
                    {children}
                </div>
            </div>
        </div>
    );
};
