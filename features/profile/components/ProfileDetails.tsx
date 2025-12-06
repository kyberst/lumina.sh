
import React, { useState } from 'react';
import { User } from '../../../types';
import { toast } from '../../../services/toastService';

interface Props { user: User; onUpdate: (u: User) => void; }

export const ProfileDetails: React.FC<Props> = ({ user, onUpdate }) => {
    const [name, setName] = useState(user.name);
    const [email, setEmail] = useState(user.email);

    const save = () => {
        onUpdate({ ...user, name, email });
        toast.success("Profile Updated");
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-bold uppercase">Name</label><input value={name} onChange={e => setName(e.target.value)} className="shadcn-input" /></div>
                <div><label className="text-xs font-bold uppercase">Email</label><input value={email} onChange={e => setEmail(e.target.value)} className="shadcn-input" /></div>
            </div>
            <button onClick={save} className="shadcn-btn shadcn-btn-primary w-full">Save Changes</button>
        </div>
    );
};
