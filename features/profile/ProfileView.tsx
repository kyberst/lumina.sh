
import React, { useState } from 'react';
import { User } from '../../types';
import { ProfileDetails } from './components/ProfileDetails';

interface ProfileViewProps { user: User; onUpdateUser: (u: User) => void; }

export const ProfileView: React.FC<ProfileViewProps> = ({ user, onUpdateUser }) => {
    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <h2 className="text-3xl font-bold mb-8">My Profile</h2>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                <div className="md:col-span-4">
                    <div className="bg-white rounded-2xl p-6 shadow border text-center">
                        <img src={user.avatar} className="w-32 h-32 mx-auto rounded-full mb-4" />
                        <h3 className="text-xl font-bold">{user.name}</h3>
                        <p className="text-slate-500">{user.email}</p>
                        <div className="mt-4 bg-slate-900 text-white rounded p-4">
                            <div className="text-xs uppercase opacity-70">Credits</div>
                            <div className="text-3xl font-black">{user.credits}</div>
                        </div>
                    </div>
                </div>
                <div className="md:col-span-8 bg-white rounded-3xl p-8 shadow border">
                    <ProfileDetails user={user} onUpdate={onUpdateUser} />
                </div>
            </div>
        </div>
    );
};
