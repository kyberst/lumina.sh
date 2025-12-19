import React from 'react';

interface SettingsCardProps {
  title: string;
  children: React.ReactNode;
}

export const SettingsCard: React.FC<SettingsCardProps> = ({ title, children }) => {
  return (
    <section>
      <h3 className="text-lg font-semibold mb-4 text-slate-800">{title}</h3>
      <div className="p-6 border rounded-xl bg-white border-slate-200 shadow-sm space-y-4">
        {children}
      </div>
    </section>
  );
};