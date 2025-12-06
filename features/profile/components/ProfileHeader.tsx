
import React from 'react';
import { User } from '../../../types';

interface Props { user: User; }

export const ProfileHeader: React.FC<Props> = ({ user }) => {
    return (
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-indigo-500 to-purple-600 opacity-10"></div>
            <div className="relative z-10">
                <img src={user.avatar} className="w-32 h-32 mx-auto rounded-full mb-4 border-4 border-white shadow-lg object-cover bg-white" alt="Avatar" />
                <h3 className="text-xl font-bold text-slate-800">{user.name}</h3>
                <p className="text-slate-500 text-sm mb-6">{user.email}</p>
                
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Available Credits</div>
                    <div className="text-3xl font-black text-indigo-600">{user.credits}</div>
                </div>
            </div>
        </div>
    );
};
