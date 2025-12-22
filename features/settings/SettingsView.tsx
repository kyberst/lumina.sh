
import React from 'react';
import { AppSettings } from '../../types';
import { SettingsCard } from './components/SettingsCard';
import { SegmentedControl } from './components/SegmentedControl';
import { ToggleSwitch } from './components/ToggleSwitch';
import { LlmProviderManager } from './components/LlmProviderManager';
import { MCPSettings } from './components/MCPSettings';
import { EnvVarManager } from './components/EnvVarManager';
import { DangerZone } from './components/DangerZone';
import { t, SUPPORTED_LANGUAGES } from '../../services/i18n';

interface SettingsViewProps { 
    settings: AppSettings; 
    onSave: (s: AppSettings) => void; 
    onReset: () => void;
    onClearProjects: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onSave, onReset, onClearProjects }) => {
  
  const handleChange = (field: keyof AppSettings, value: any) => {
    onSave({ ...settings, [field]: value });
  };

  const handleExperimentChange = (key: keyof AppSettings['experiments'], value: boolean) => {
    onSave({ ...settings, experiments: { ...settings.experiments, [key]: value } });
  };

  return (
    <div className="max-w-4xl mx-auto pb-20 space-y-8 animate-in fade-in slide-in-from-bottom-8">
      <header className="mb-8">
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground">{t('title', 'settings')}</h2>
          <p className="text-muted-foreground mt-2">Manage your preferences, AI models, and integrations.</p>
      </header>
      
      <SettingsCard title={t('general', 'settings')}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">{t('language', 'settings')}</label>
            <select className="shadcn-input" value={settings.language} onChange={e => handleChange('language', e.target.value)}>
                {SUPPORTED_LANGUAGES.map(lang => (
                    <option key={lang.code} value={lang.code}>{lang.label}</option>
                ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-foreground flex justify-between">
                <span>{t('zoom', 'settings')}</span>
                <span className="text-muted-foreground">{Math.round(settings.zoomLevel * 100)}%</span>
            </label>
            <input type="range" min="0.8" max="1.2" step="0.05" value={settings.zoomLevel} onChange={e => handleChange('zoomLevel', parseFloat(e.target.value))} className="w-full accent-primary mt-3 cursor-pointer" />
            <p className="text-xs text-muted-foreground mt-1">{t('zoomDesc', 'settings')}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">{t('channel', 'settings')}</label>
            <SegmentedControl options={['Stable', 'Beta']} selected={settings.releaseChannel} onSelect={val => handleChange('releaseChannel', val as any)} />
            <p className="text-xs text-muted-foreground mt-2">{t('channelDesc', 'settings')}</p>
          </div>
           <div>
            <label className="text-sm font-medium text-foreground block mb-2">{t('execution', 'settings')}</label>
            <SegmentedControl options={['Local', 'Docker']} selected={settings.executionEnvironment} onSelect={val => handleChange('executionEnvironment', val as any)} />
            <p className="text-xs text-muted-foreground mt-2">{t('executionDesc', 'settings')}</p>
          </div>
          <div className="md:col-span-2 p-4 border border-border rounded-xl bg-muted/30">
             <label className="text-sm font-medium text-foreground mb-2 block">{t('nodeConfig', 'settings')}</label>
             <div className="flex items-center gap-2">
                <input className="shadcn-input font-mono text-xs" value={settings.nodePath || 'System PATH'} readOnly />
                <button className="shadcn-btn shadcn-btn-outline whitespace-nowrap text-xs h-9">Browse...</button>
             </div>
             <p className="text-xs text-emerald-600 mt-2 font-medium flex items-center gap-1">
                 <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                 {t('nodeReady', 'settings')}
             </p>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block">{t('version', 'settings')}</label>
            <p className="text-lg font-mono font-semibold text-foreground/80 mt-1">0.30.0</p>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard title={t('workflow', 'settings')}>
        <div className="space-y-6">
            <ToggleSwitch label={t('autoRun', 'settings')} description={t('autoRunDesc', 'settings')} isChecked={settings.autoApprove} onToggle={val => handleChange('autoApprove', val)} />
            <div className="h-px bg-border/50"></div>
            <ToggleSwitch label={t('autoFix', 'settings')} description={t('autoFixDesc', 'settings')} isChecked={settings.autoFix} onToggle={val => handleChange('autoFix', val)} />
        </div>
      </SettingsCard>

      <SettingsCard title={t('ai', 'settings')}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div>
              <label className="text-sm font-medium text-foreground mb-1 block">{t('thinkingBudget', 'settings')}</label>
              <select className="shadcn-input" value={settings.thinkingBudget} onChange={e => handleChange('thinkingBudget', e.target.value)}>
                <option value="low">Low</option><option value="medium">Medium (default)</option><option value="high">High</option>
              </select>
              <p className="text-xs text-muted-foreground mt-1">{t('attentionNormalDesc', 'settings')}</p>
           </div>
           <div>
              <label className="text-sm font-medium text-foreground mb-1 block">{t('contextSize', 'settings')}</label>
              <select className="shadcn-input" value={settings.contextSize} onChange={e => handleChange('contextSize', e.target.value)}>
                <option value="economy">Economy (3 turns)</option><option value="default">Default (5 turns)</option><option value="max">Maximum (10 turns)</option>
              </select>
              <p className="text-xs text-muted-foreground mt-1">{t('attentionNormalDesc', 'settings')}</p>
           </div>
        </div>
      </SettingsCard>

      <LlmProviderManager settings={settings} onSave={onSave} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <SettingsCard title={t('integrations', 'settings')}>
            <h4 className="text-sm font-medium text-foreground mb-3">{t('github', 'settings')}</h4>
            {settings.githubToken && settings.githubUsername ? (
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border">
                <p className="text-sm text-muted-foreground">{t('connected', 'settings')} <span className="font-bold text-foreground">{settings.githubUsername}</span>.</p>
                <button className="shadcn-btn shadcn-btn-outline text-xs h-8" onClick={() => onSave({...settings, githubToken: undefined, githubUsername: undefined})}>{t('disconnect', 'settings')}</button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">Not connected.</p>
            )}
        </SettingsCard>
        <MCPSettings settings={settings} onChange={handleChange} />
      </div>
      
      <EnvVarManager globalEnvVars={settings.globalEnvVars} onSave={vars => handleChange('globalEnvVars', vars)} />

      <SettingsCard title={t('experiments', 'settings')}>
        <ToggleSwitch label={t('nativeGit', 'settings')} description={t('nativeGitDesc', 'settings')} isChecked={settings.experiments.nativeGit} onToggle={val => handleExperimentChange('nativeGit', val)} />
      </SettingsCard>

      <SettingsCard title={t('telemetry', 'settings')}>
        <ToggleSwitch label={t('telemetry', 'settings')} description={t('telemetryDesc', 'settings')} isChecked={settings.telemetryEnabled} onToggle={val => handleChange('telemetryEnabled', val)} />
        {settings.telemetryEnabled && (
          <div className="mt-4 p-3 bg-muted/20 rounded-lg">
            <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">{t('telemetry', 'settings')} ID</label>
            <p className="font-mono text-xs text-foreground/70 break-all">{settings.telemetryId || 'N/A'}</p>
          </div>
        )}
      </SettingsCard>
      
      <DangerZone onReset={onReset} onClearProjects={onClearProjects} />
    </div>
  );
};
