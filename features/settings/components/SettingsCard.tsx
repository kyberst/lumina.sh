
import React from 'react';

interface SettingsCardProps {
  title: string;
  children: React.ReactNode;
}

export const SettingsCard: React.FC<SettingsCardProps> = ({ title, children }) => {
  return (
    <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h3 className="text-lg font-bold mb-4 text-foreground tracking-tight px-1 flex items-center gap-2">
        {title}
        <div className="h-px bg-border flex-1 ml-4 opacity-50"></div>
      </h3>
      <div className="p-6 rounded-2xl border border-border bg-card/50 backdrop-blur-sm shadow-sm space-y-6 transition-all hover:shadow-md hover:border-primary/20 hover:bg-card/80">
        {children}
      </div>
    </section>
  );
};
