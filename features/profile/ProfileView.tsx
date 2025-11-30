
import React, { useState, useEffect } from 'react';
import { User, Transaction } from '../../types';
import { sqliteService } from '../../services/sqliteService';
import { authService } from '../../services/authService';
import { toast } from '../../services/toastService';
import { t } from '../../services/i18n';

interface ProfileViewProps {
    user: User;
    onUpdateUser: (u: User) => void;
}

const AVATAR_SEEDS = [
    'Felix', 'Aneka', 'Bella', 'Callie', 'Data', 'Elias', 'Fabian', 'Gigi', 
    'Halo', 'Ivan', 'Jack', 'Kiki', 'Leo', 'Mia', 'Nora', 'Omar', 
    'Pip', 'Quinn', 'River', 'Sam', 'Tess', 'Una', 'Viv', 'Will', 'Xena', 'Yara', 'Zane'
];

export const ProfileView: React.FC<ProfileViewProps> = ({ user, onUpdateUser }) => {
    const [activeTab, setActiveTab] = useState<'details' | 'billing'>('details');
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    
    // Split Name Logic
    const [firstName, setFirstName] = useState(user.name.split(' ')[0] || '');
    const [lastName, setLastName] = useState(user.name.split(' ').slice(1).join(' ') || '');
    const [email, setEmail] = useState(user.email);
    const [selectedAvatar, setSelectedAvatar] = useState(user.avatar || '');
    const [is2FA, setIs2FA] = useState(user.twoFactorEnabled);
    
    // Verification & 2FA Setup
    const [newPass, setNewPass] = useState('');
    const [code, setCode] = useState('');
    const [verifyingAction, setVerifyingAction] = useState<'save_profile' | 'toggle_2fa' | null>(null);
    const [qrSecret, setQrSecret] = useState<string | null>(null); // For 2FA Setup

    useEffect(() => {
        const loadTx = async () => {
            const txs = await sqliteService.getUserTransactions(user.id);
            setTransactions(txs);
        };
        loadTx();
    }, [user.id]);

    const getAvatarUrl = (seed: string) => `https://api.dicebear.com/7.x/notionists/svg?seed=${seed}&backgroundColor=ffdfbf,c0aede,b6e3f4`;

    const handleAvatarSelect = (seed: string) => {
        setSelectedAvatar(getAvatarUrl(seed));
    };

    const handleToggle2FA = async () => {
        if (is2FA) {
            // Disabling 2FA: Requires code verification (Email or App)
            setVerifyingAction('toggle_2fa');
            const method = 'App Code'; 
            toast.info(`Please enter your ${method} to disable 2FA.`);
        } else {
            // Enabling 2FA: Show QR Code Setup
            const secret = await authService.generate2FASecret();
            setQrSecret(secret); // Show QR modal
        }
    };

    const confirmEnable2FA = async () => {
        if (!code) return toast.error("Enter code from app");
        try {
            // Verify code against secret
            // In real app, verify against secret. Here simulated.
            if(code.length !== 6) throw new Error("Invalid code length");
            
            const updated = { ...user, twoFactorEnabled: true };
            await sqliteService.updateUser(updated);
            onUpdateUser(updated);
            setIs2FA(true);
            setQrSecret(null);
            setCode('');
            toast.success("2FA Enabled Successfully");
        } catch(e) {
            toast.error("Invalid Code");
        }
    };

    const handleSaveProfile = async () => {
        // Check if sensitive data changed
        const nameChanged = `${firstName} ${lastName}`.trim() !== user.name;
        const emailChanged = email !== user.email;
        const passChanged = !!newPass;

        if (emailChanged || passChanged || (verifyingAction === 'toggle_2fa')) {
            if (!verifyingAction) {
                // Determine verification method
                if (user.twoFactorEnabled) {
                    toast.info("Security Check: Enter 2FA Code from App");
                } else {
                    const c = await authService.sendRecoveryCode(user.email); // Send to old email
                    sessionStorage.setItem('profile_verify', c);
                }
                setVerifyingAction('save_profile');
                return;
            }
            
            // Verify Logic
            if (user.twoFactorEnabled) {
               // Verify 2FA (simulated by length for now in client logic, really handled by backend)
               if(code.length !== 6) { toast.error("Invalid 2FA Code"); return; }
            } else {
               const expected = sessionStorage.getItem('profile_verify');
               if (code !== expected) { toast.error("Invalid Email Code"); return; }
            }
        }

        // Apply Updates
        const updatedUser = { 
            ...user, 
            name: `${firstName} ${lastName}`.trim(), 
            email, 
            avatar: selectedAvatar,
            twoFactorEnabled: verifyingAction === 'toggle_2fa' ? false : user.twoFactorEnabled
        };
        
        if (newPass) updatedUser.passwordHash = btoa(newPass);

        try {
            await sqliteService.updateUser(updatedUser);
            onUpdateUser(updatedUser);
            toast.success("Profile Updated");
            setVerifyingAction(null);
            setCode('');
            setNewPass('');
            sessionStorage.removeItem('profile_verify');
            if(verifyingAction === 'toggle_2fa') setIs2FA(false);
        } catch(e: any) {
            toast.error("Update failed");
        }
    };

    const buyCredits = async () => {
        if(confirm("Buy 100 Credits for $5?")) {
            const tx: Transaction = {
                id: crypto.randomUUID(),
                userId: user.id,
                amount: 5.00,
                credits: 100,
                type: 'purchase',
                description: 'Credit Pack (100)',
                timestamp: Date.now()
            };
            const updatedUser = { ...user, credits: user.credits + 100 };
            
            await sqliteService.addTransaction(tx);
            await sqliteService.updateUser(updatedUser);
            onUpdateUser(updatedUser);
            setTransactions(prev => [tx, ...prev]);
            toast.success("Credits Added!");
        }
    };

    return (
        <div className="max-w-5xl mx-auto py-8 animate-in fade-in slide-in-from-bottom-4 duration-500 px-4">
            <h2 className="text-3xl font-black text-slate-800 mb-8 font-['Plus_Jakarta_Sans'] ml-2">{t('myProfile', 'auth')}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                {/* Sidebar */}
                <div className="md:col-span-4 lg:col-span-3">
                    <div className="bg-white rounded-[2rem] p-6 shadow-xl shadow-[#ffc93a]/10 border border-[#ffc93a]/30 text-center sticky top-24">
                        <div className="w-32 h-32 mx-auto mb-4 relative group">
                            <img src={selectedAvatar} className="w-full h-full rounded-full border-4 border-[#ffff7e] object-cover shadow-sm bg-[#ff7e15]/10" />
                            <div className="absolute bottom-0 right-0 bg-[#ff7e15] text-white p-1.5 rounded-full border-2 border-white">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">{firstName} {lastName}</h3>
                        <p className="text-slate-400 text-xs mb-6 font-bold">{email}</p>
                        
                        <div className="bg-gradient-to-r from-[#ff7e15] to-[#ff2935] rounded-2xl p-4 text-white mb-6 shadow-lg shadow-[#ff7e15]/20">
                            <div className="text-[10px] font-extrabold uppercase tracking-widest opacity-80 mb-1">Credits</div>
                            <div className="text-3xl font-black">{user.credits}</div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <button onClick={() => setActiveTab('details')} className={`py-3 rounded-xl text-xs uppercase font-extrabold tracking-wider transition-all ${activeTab === 'details' ? 'bg-[#ffff7e] text-[#ff7e15] shadow-sm' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>Edit Profile</button>
                            <button onClick={() => setActiveTab('billing')} className={`py-3 rounded-xl text-xs uppercase font-extrabold tracking-wider transition-all ${activeTab === 'billing' ? 'bg-[#ffff7e] text-[#ff7e15] shadow-sm' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>Billing & History</button>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="md:col-span-8 lg:col-span-9">
                    <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-[#ffc93a]/10 border border-[#ffc93a]/30 min-h-[600px]">
                        {activeTab === 'details' && (
                            <div className="space-y-8">
                                {/* Avatar Picker */}
                                <div>
                                    <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-4">Choose Avatar</h4>
                                    <div className="flex flex-wrap gap-3 max-h-32 overflow-y-auto custom-scrollbar p-1">
                                        {AVATAR_SEEDS.map(seed => {
                                            const url = getAvatarUrl(seed);
                                            return (
                                                <button 
                                                    key={seed} 
                                                    onClick={() => handleAvatarSelect(seed)}
                                                    className={`w-12 h-12 rounded-full border-2 transition-all hover:scale-110 ${selectedAvatar === url ? 'border-[#ff7e15] ring-2 ring-[#ff7e15]/30' : 'border-transparent hover:border-[#ffff7e]'}`}
                                                >
                                                    <img src={url} className="w-full h-full rounded-full" />
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{t('firstName', 'auth')}</label>
                                        <input value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 focus:border-[#ff7e15] rounded-xl px-4 py-3 outline-none text-sm font-bold text-slate-700 transition-colors" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{t('lastName', 'auth')}</label>
                                        <input value={lastName} onChange={e => setLastName(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 focus:border-[#ff7e15] rounded-xl px-4 py-3 outline-none text-sm font-bold text-slate-700 transition-colors" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{t('email', 'auth')}</label>
                                    <input value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 focus:border-[#ff7e15] rounded-xl px-4 py-3 outline-none text-sm font-bold text-slate-700 transition-colors" />
                                </div>

                                <div className="border-t-2 border-dashed border-slate-100 pt-6">
                                    <h4 className="text-sm font-bold text-slate-700 mb-6 flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#ff7e15]"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                        Security Settings
                                    </h4>
                                    
                                    {/* 2FA Toggle */}
                                    <div className="bg-[#ffffbb]/20 p-5 rounded-2xl border border-[#ffc93a]/30 mb-6 flex flex-col sm:flex-row justify-between items-center gap-4 hover:bg-[#ffffbb]/40 transition-colors">
                                        <div>
                                            <div className="font-bold text-slate-800 text-sm mb-1 text-center sm:text-left">Two-Factor Authentication (2FA)</div>
                                            <div className="text-xs text-slate-500 max-w-xs leading-relaxed text-center sm:text-left">Require a code from Google Authenticator when logging in or changing settings.</div>
                                        </div>
                                        <button 
                                            onClick={handleToggle2FA}
                                            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${is2FA ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500 hover:bg-slate-300'}`}
                                        >
                                            {is2FA ? 'Enabled' : 'Enable 2FA'}
                                        </button>
                                    </div>

                                    {/* QR Code Modal Area (Simulated) */}
                                    {qrSecret && (
                                        <div className="bg-white border-2 border-[#ffc93a] p-6 rounded-2xl mb-6 shadow-lg animate-in zoom-in-95">
                                            <h5 className="text-[#ff7e15] font-bold text-sm mb-4 uppercase tracking-wider text-center">Scan this QR Code</h5>
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="w-40 h-40 bg-white p-2 rounded-lg border border-slate-200">
                                                    {/* Placeholder for QR Code */}
                                                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`otpauth://totp/DyadBuild:${user.email}?secret=${qrSecret}&issuer=Dyad`)}`} alt="QR Code" className="w-full h-full" />
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-xs text-slate-500 mb-2">Or enter key manually:</p>
                                                    <code className="bg-slate-100 px-3 py-1 rounded text-xs font-mono select-all break-all">{qrSecret}</code>
                                                </div>
                                                <div className="w-full max-w-xs mt-2">
                                                    <input 
                                                        value={code} 
                                                        onChange={e => setCode(e.target.value)} 
                                                        placeholder="Enter 6-digit code" 
                                                        className="w-full text-center border-2 border-slate-200 focus:border-[#ff7e15] rounded-xl px-4 py-2 outline-none font-bold tracking-widest"
                                                        maxLength={6}
                                                    />
                                                    <button onClick={confirmEnable2FA} className="w-full mt-2 bg-[#ff7e15] text-white py-2 rounded-lg font-bold text-xs uppercase hover:bg-[#ff2935] transition-colors">Verify & Activate</button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Change Password</label>
                                        <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="New Password (leave empty to keep)" className="w-full bg-slate-50 border-2 border-slate-100 focus:border-[#ff7e15] rounded-xl px-4 py-3 outline-none text-sm font-bold text-slate-700 transition-colors" />
                                    </div>
                                </div>

                                {verifyingAction && !qrSecret && (
                                    <div className="bg-[#ffff7e]/20 p-6 rounded-2xl border border-[#ffc93a] animate-in zoom-in-95 flex flex-col items-center text-center">
                                        <div className="w-12 h-12 bg-[#ffff7e] rounded-full flex items-center justify-center text-[#ff7e15] mb-3">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                                        </div>
                                        <label className="block text-sm font-black text-[#ff7e15] uppercase mb-2">
                                            {verifyingAction === 'toggle_2fa' ? 'Disable 2FA Verification' : 'Security Verification Required'}
                                        </label>
                                        <p className="text-xs text-slate-500 mb-6 max-w-sm">
                                            {user.twoFactorEnabled 
                                                ? "Enter the code from your Authenticator App." 
                                                : "Enter the verification code sent to your email."}
                                        </p>
                                        <input 
                                            value={code} 
                                            onChange={e => setCode(e.target.value)} 
                                            className="w-full max-w-xs bg-white border-2 border-[#ffc93a] rounded-xl px-4 py-3 outline-none text-center font-black tracking-[0.5em] text-xl focus:ring-4 focus:ring-[#ffff7e]/50 transition-all" 
                                            placeholder="000000" 
                                            maxLength={6} 
                                        />
                                    </div>
                                )}

                                <button onClick={handleSaveProfile} className="w-full bg-gradient-to-r from-[#ff7e15] to-[#ff2935] hover:from-[#ff2935] hover:to-[#ff7e15] text-white py-4 rounded-xl font-extrabold shadow-lg shadow-[#ff7e15]/30 transition-all uppercase tracking-widest text-xs mt-4 transform hover:-translate-y-1">
                                    {verifyingAction ? 'Confirm & Save Changes' : 'Save Profile'}
                                </button>
                            </div>
                        )}

                        {activeTab === 'billing' && (
                            <div className="space-y-8">
                                <div className="bg-gradient-to-r from-[#ff7e15] to-[#ff2935] rounded-3xl p-8 text-white shadow-xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700"></div>
                                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
                                        <div>
                                            <div className="text-xs font-extrabold uppercase tracking-widest opacity-80 mb-2">Available Credits</div>
                                            <div className="text-5xl font-black tracking-tighter">{user.credits}</div>
                                            <div className="text-xs font-medium opacity-80 mt-2">1 Credit ≈ 1 AI Generation</div>
                                        </div>
                                        <button onClick={buyCredits} className="bg-white text-[#ff7e15] px-8 py-4 rounded-2xl font-extrabold hover:bg-[#ffff7e] transition-colors shadow-lg hover:scale-105 transform duration-200 text-xs uppercase tracking-widest whitespace-nowrap">
                                            Buy 100 Credits ($5)
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Transaction History</h4>
                                    <div className="space-y-3">
                                        {transactions.length === 0 && <div className="text-slate-400 italic text-sm text-center py-10 bg-slate-50 rounded-2xl">No transactions yet. Start building!</div>}
                                        {transactions.map(tx => (
                                            <div key={tx.id} className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 hover:border-[#ffc93a]/30 transition-colors shadow-sm">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${tx.type === 'purchase' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                                                        {tx.type === 'purchase' ? '+' : '-'}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-700 text-sm">{tx.description}</div>
                                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{new Date(tx.timestamp).toLocaleDateString()}</div>
                                                    </div>
                                                </div>
                                                <div className={`font-black text-lg whitespace-nowrap ${tx.type === 'purchase' ? 'text-emerald-500' : 'text-slate-700'}`}>
                                                    {tx.type === 'purchase' ? '+' : '-'}{tx.credits}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
