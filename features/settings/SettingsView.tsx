import React from 'react';
import { AppSettings } from '../../types';
import { SettingsCard } from './components/SettingsCard';
import { SegmentedControl } from './components/SegmentedControl';
import { ToggleSwitch } from './components/ToggleSwitch';
import { LlmProviderManager } from './components/LlmProviderManager';
import { MCPSettings } from './components/MCPSettings';
import { EnvVarManager } from './components/EnvVarManager';
import { DangerZone } from './components/DangerZone';

interface SettingsViewProps { 
    settings: AppSettings; 
    onSave: (s: AppSettings) => void; 
    onReset: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onSave, onReset }) => {
  
  const handleChange = (field: keyof AppSettings, value: any) => {
    onSave({ ...settings, [field]: value });
  };

  const handleExperimentChange = (key: keyof AppSettings['experiments'], value: boolean) => {
    onSave({ ...settings, experiments: { ...settings.experiments, [key]: value } });
  };

  return (
    <div className="max-w-4xl mx-auto pb-20 space-y-8">
      <header className="mb-8"><h2 className="text-2xl font-bold">Settings</h2></header>
      
      <SettingsCard title="General Settings">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-slate-700">Language</label>
            <select className="shadcn-input mt-1" value={settings.language} onChange={e => handleChange('language', e.target.value)}>
                <option value="en">English</option><option value="es">Español</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-slate-700">Zoom: {Math.round(settings.zoomLevel * 100)}%</label>
            <input type="range" min="0.8" max="1.2" step="0.05" value={settings.zoomLevel} onChange={e => handleChange('zoomLevel', parseFloat(e.target.value))} className="w-full accent-indigo-600 mt-2" />
            <p className="text-xs text-slate-500">Adjusts the zoom level to make content easier to read.</p>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Release Channel</label>
            <SegmentedControl options={['Stable', 'Beta']} selected={settings.releaseChannel} onSelect={val => handleChange('releaseChannel', val as any)} />
            <p className="text-xs text-slate-500 mt-2">Stable is recommended for most users.</p>
          </div>
           <div>
            <label className="text-sm font-medium text-slate-700">Execution Environment</label>
            <SegmentedControl options={['Local', 'Docker']} selected={settings.executionEnvironment} onSelect={val => handleChange('executionEnvironment', val as any)} />
            <p className="text-xs text-slate-500 mt-2">Choose whether to run apps on local machine or Docker.</p>
          </div>
          <div className="md:col-span-2 p-4 border rounded-lg bg-slate-50">
             <label className="text-sm font-medium text-slate-700 mb-2 block">Node.js Configuration</label>
             <div className="flex items-center gap-2">
                <input className="shadcn-input font-mono text-xs" value={settings.nodePath || 'System PATH'} readOnly />
                <button className="shadcn-btn shadcn-btn-outline whitespace-nowrap text-xs h-9">Browse...</button>
             </div>
             <p className="text-xs text-emerald-600 mt-2 font-medium">✓ Node.js is properly configured and ready to use (v22.20.0)</p>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">App Version</label>
            <p className="text-lg font-mono font-semibold text-slate-800">0.30.0</p>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard title="Workflow Settings">
        <ToggleSwitch label="Auto-run Code" description="This will automatically approve code changes and run them." isChecked={settings.autoApprove} onToggle={val => handleChange('autoApprove', val)} />
        <ToggleSwitch label="Auto-fix TS Errors" description="This will automatically fix TypeScript errors." isChecked={settings.autoFix} onToggle={val => handleChange('autoFix', val)} />
      </SettingsCard>

      <SettingsCard title="AI Settings">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div>
              <label className="text-sm font-medium text-slate-700">Thinking Budget</label>
              <select className="shadcn-input mt-1" value={settings.thinkingBudget} onChange={e => handleChange('thinkingBudget', e.target.value)}>
                <option value="low">Low</option><option value="medium">Medium (default)</option><option value="high">High</option>
              </select>
              <p className="text-xs text-slate-500 mt-1">Balanced thinking for most conversations.</p>
           </div>
           <div>
              <label className="text-sm font-medium text-slate-700">Context Size</label>
              <select className="shadcn-input mt-1" value={settings.contextSize} onChange={e => handleChange('contextSize', e.target.value)}>
                <option value="economy">Economy (3 turns)</option><option value="default">Default (5 turns)</option><option value="max">Maximum (10 turns)</option>
              </select>
              <p className="text-xs text-slate-500 mt-1">Balanced context size for most conversations.</p>
           </div>
        </div>
      </SettingsCard>

      <LlmProviderManager settings={settings} onSave={onSave} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <SettingsCard title="Integrations">
            <h4 className="text-sm font-medium text-slate-700">GitHub Integration</h4>
            {settings.githubToken && settings.githubUsername ? (
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">Connected as <span className="font-bold text-slate-700">{settings.githubUsername}</span>.</p>
                <button className="shadcn-btn shadcn-btn-outline text-xs h-8" onClick={() => onSave({...settings, githubToken: undefined, githubUsername: undefined})}>Disconnect</button>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Not connected.</p>
            )}
        </SettingsCard>
        <MCPSettings settings={settings} onChange={handleChange} />
      </div>
      
      <EnvVarManager globalEnvVars={settings.globalEnvVars} onSave={vars => handleChange('globalEnvVars', vars)} />

      <SettingsCard title="Experiments">
        <ToggleSwitch label="Native Git Experience" description="This doesn't require any external Git installation and offers a faster, native-Git performance experience." isChecked={settings.experiments.nativeGit} onToggle={val => handleExperimentChange('nativeGit', val)} />
      </SettingsCard>

      <SettingsCard title="Telemetry">
        <ToggleSwitch label="Enable Telemetry" description="This records anonymous usage data to improve the product." isChecked={settings.telemetryEnabled} onToggle={val => handleChange('telemetryEnabled', val)} />
        {settings.telemetryEnabled && (
          <div className="mt-4">
            <label className="text-xs font-bold uppercase text-slate-400">Telemetry ID</label>
            <p className="font-mono text-sm text-slate-500 break-all">{settings.telemetryId || 'N/A'}</p>
          </div>
        )}
      </SettingsCard>
      
      <DangerZone onReset={onReset} />
    </div>
  );
};