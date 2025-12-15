
import React, { useState } from 'react';
import { User } from '../../types';
import { t } from '../../services/i18n';
import { ProfileDetails } from './components/ProfileDetails';
import { ProfileSessions } from './components/ProfileSessions';
import { ProfileBilling } from './components/ProfileBilling';
import { ProfileHeader } from './components/ProfileHeader';
import { ChangePasswordForm } from './components/ChangePasswordForm';
import { MFASetup } from './components/MFASetup';

interface ProfileViewProps { user: User; onUpdateUser: (u: User) => void; }

/**
 * Main Profile Container.
 * Manages tab state and layout, delegates content to sub-components.
 */
export const ProfileView: React.FC<ProfileViewProps> = ({ user, onUpdateUser }) => {
    const [activeTab, setActiveTab] = useState<'details' | 'security' | 'billing'>('details');

    const tabClass = (id: string) => `px-4 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`;

    return (
        <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
            <h2 className="text-3xl font-bold mb-8 text-slate-900 tracking-tight">{t('myProfile', 'auth')}</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Sidebar */}
                <div className="lg:col-span-4 space-y-6">
                    <ProfileHeader user={user} />

                    {/* Navigation */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-2 flex flex-col gap-1">
                        <button onClick={() => setActiveTab('details')} className={tabClass('details')}>{t('personalDetails', 'profile')}</button>
                        <button onClick={() => setActiveTab('security')} className={tabClass('security')}>{t('sessionsAndSecurity', 'profile')}</button>
                        <button onClick={() => setActiveTab('billing')} className={tabClass('billing')}>{t('billingHistory', 'profile')}</button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-8">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 min-h-[500px] p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-2">
                        {activeTab === 'details' && (
                            <>
                                <h3 className="text-lg font-bold text-slate-800 mb-6 pb-4 border-b">{t('editProfile', 'profile')}</h3>
                                <ProfileDetails user={user} onUpdate={onUpdateUser} />
                            </>
                        )}
                        {activeTab === 'security' && (
                            <>
                                <h3 className="text-lg font-bold text-slate-800 mb-6 pb-4 border-b">{t('sessionsAndSecurity', 'profile')}</h3>
                                <MFASetup user={user} onUpdate={onUpdateUser} />
                                <ChangePasswordForm userId={user.id} />
                                <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 mt-8 pt-8 border-t border-slate-100">
                                    {t('activeSessions', 'profile')}
                                </h4>
                                <ProfileSessions userId={user.id} />
                            </>
                        )}
                        {activeTab === 'billing' && (
                            <>
                                <h3 className="text-lg font-bold text-slate-800 mb-6 pb-4 border-b">{t('creditHistory', 'profile')}</h3>
                                <ProfileBilling userId={user.id} />
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
