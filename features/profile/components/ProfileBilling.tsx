
import React, { useEffect, useState } from 'react';
import { Transaction } from '../../../types';
import { dbFacade } from '../../../services/dbFacade';

export const ProfileBilling: React.FC<{ userId: string }> = ({ userId }) => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);

    useEffect(() => {
        dbFacade.getUserTransactions(userId).then(setTransactions);
    }, [userId]);

    return (
        <div className="space-y-4">
             <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 mb-6 flex items-start gap-3">
                 <div className="text-indigo-600 mt-0.5"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg></div>
                 <p className="text-xs text-indigo-900 leading-relaxed">
                     Credits are used to generate code and run advanced AI models. 
                     Refills are processed securely via Stripe (Simulated).
                 </p>
             </div>

             <div className="border rounded-xl overflow-hidden border-slate-200">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                        <tr>
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3">Description</th>
                            <th className="px-4 py-3 text-right">Amount</th>
                            <th className="px-4 py-3 text-right">Credits</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {transactions.map(t => (
                            <tr key={t.id} className="hover:bg-slate-50/50">
                                <td className="px-4 py-3 text-slate-500 font-mono text-xs">
                                    {new Date(t.timestamp).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-3 font-medium text-slate-700">
                                    <div className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${t.type==='purchase' || t.type==='bonus' ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                                        {t.description}
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-right text-slate-600">
                                    {t.amount > 0 ? `$${t.amount.toFixed(2)}` : '-'}
                                </td>
                                <td className={`px-4 py-3 text-right font-bold ${t.credits > 0 ? 'text-emerald-600' : 'text-slate-600'}`}>
                                    {t.credits > 0 ? '+' : ''}{t.credits}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {transactions.length === 0 && (
                    <div className="p-8 text-center text-slate-400 italic">No transactions found.</div>
                )}
             </div>
        </div>
    );
};