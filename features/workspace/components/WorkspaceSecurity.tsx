
import React from 'react';
import { SecurityReport } from '../../../types';
import { t } from '../../../services/i18n';

interface WorkspaceSecurityProps {
  report: SecurityReport | null;
  isScanning: boolean;
  onRunScan: () => void;
  onFixIssue: (prompt: string) => void;
  onCancelScan?: () => void;
}

export const WorkspaceSecurity: React.FC<WorkspaceSecurityProps> = ({ report, isScanning, onRunScan, onFixIssue, onCancelScan }) => {
  
  if (isScanning) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50">
        <div className="relative mb-8">
          {/* Abstract Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-primary/20 blur-[60px] rounded-full"></div>
          
          <div className="relative w-32 h-32">
             <div className="absolute inset-0 rounded-full border-4 border-slate-200"></div>
             <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
             <div className="absolute inset-0 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary animate-pulse"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
             </div>
          </div>
        </div>
        <h3 className="text-2xl font-extrabold text-slate-800 mb-2 tracking-tight">Running Deep Scan...</h3>
        <p className="text-slate-500 text-sm mb-8 font-medium">Analyzing code patterns and vulnerabilities.</p>
        
        {onCancelScan && (
            <button onClick={onCancelScan} className="px-6 py-2 rounded-full border border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300 font-bold text-xs uppercase tracking-wider transition-all">
                Cancel Audit
            </button>
        )}
      </div>
    );
  }

  if (!report) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 p-8">
        <div className="bg-white p-10 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 text-center max-w-md animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-indigo-500 border border-indigo-100 shadow-inner">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 mb-3">Security Audit</h2>
          <p className="text-slate-500 mb-8 leading-relaxed text-sm">Perform a comprehensive AI analysis of your codebase to detect vulnerabilities, performance bottlenecks, and best practice violations.</p>
          <button 
            onClick={onRunScan}
            className="shadcn-btn shadcn-btn-primary w-full h-14 text-base font-bold shadow-lg shadow-indigo-500/30 hover:scale-[1.02] transition-transform rounded-xl"
          >
            Start Security Scan
          </button>
        </div>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-500 stroke-emerald-500';
    if (score >= 70) return 'text-amber-500 stroke-amber-500';
    return 'text-red-500 stroke-red-500';
  };

  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case 'critical': return 'bg-red-600 text-white shadow-red-200';
      case 'high': return 'bg-red-500 text-white shadow-red-100';
      case 'medium': return 'bg-amber-500 text-white shadow-amber-100';
      case 'low': return 'bg-blue-500 text-white shadow-blue-100';
      default: return 'bg-slate-500 text-white';
    }
  };

  const getSeverityBarColor = (sev: string) => {
    switch (sev) {
      case 'critical': return 'bg-red-600';
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-amber-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-slate-300';
    }
  };

  // SVG Circle Calc
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (report.healthScore / 100) * circumference;

  return (
    <div className="w-full h-full bg-slate-50 overflow-y-auto custom-scrollbar">
      <div className="max-w-5xl mx-auto p-6 sm:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Health Score Card */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col items-center justify-center relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-20"></div>
            
            <div className="relative w-40 h-40 mb-4">
                <svg className="w-full h-full transform -rotate-90">
                    <circle cx="80" cy="80" r="50" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-slate-100" />
                    <circle 
                        cx="80" cy="80" r="50" stroke="currentColor" strokeWidth="10" fill="transparent" 
                        strokeDasharray={circumference} 
                        strokeDashoffset={strokeDashoffset} 
                        strokeLinecap="round"
                        className={`transition-all duration-1000 ease-out ${getScoreColor(report.healthScore)}`}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-4xl font-black ${getScoreColor(report.healthScore).split(' ')[0]}`}>{report.healthScore}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Score</span>
                </div>
            </div>
            
            <h3 className="text-sm font-bold text-slate-800">System Health</h3>
          </div>

          {/* Summary & Stats */}
          <div className="md:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-slate-200 flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Audit Report</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{report.summary}</p>
            </div>
            
            <div className="mt-8">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Vulnerability Distribution</h4>
              
              {/* Stacked Bar Graph */}
              <div className="flex h-6 rounded-full overflow-hidden bg-slate-100 w-full mb-4 ring-2 ring-white shadow-inner">
                {(['critical', 'high', 'medium', 'low'] as const).map(sev => {
                  const count = report.severityDistribution[sev];
                  const total = Object.values(report.severityDistribution).reduce((a,b) => a+b, 0);
                  if (count === 0) return null;
                  return (
                    <div 
                      key={sev} 
                      className={`h-full ${getSeverityBarColor(sev)} transition-all duration-1000`} 
                      style={{ width: `${(count / total) * 100}%` }}
                      title={`${sev}: ${count}`}
                    ></div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4">
                {(['critical', 'high', 'medium', 'low'] as const).map(sev => (
                   report.severityDistribution[sev] > 0 && (
                       <div key={sev} className="flex items-center gap-2">
                          <div className={`w-2.5 h-2.5 rounded-full ${getSeverityBarColor(sev)} shadow-sm`}></div>
                          <span className="text-xs font-bold text-slate-600 capitalize">{sev}: <span className="font-mono">{report.severityDistribution[sev]}</span></span>
                       </div>
                   )
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Issues List */}
        <div>
          <div className="flex justify-between items-end mb-6">
            <div>
                <h2 className="text-2xl font-bold text-slate-800">Detected Issues</h2>
                <p className="text-sm text-slate-500 mt-1">Actionable recommendations sorted by severity.</p>
            </div>
            <button onClick={onRunScan} className="text-xs font-bold text-primary hover:text-primary/80 flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M23 4v6h-6"></path><path d="M1 20v-6h6"></path><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
              Re-scan System
            </button>
          </div>
          
          <div className="space-y-4">
            {report.issues.length === 0 && (
                <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 border-dashed">
                    <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6 9 17l-5-5"/></svg>
                    </div>
                    <p className="text-slate-800 font-bold text-lg">No issues found.</p>
                    <p className="text-slate-500 text-sm">Your system is clean and secure.</p>
                </div>
            )}
            
            {report.issues.map(issue => (
              <div key={issue.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-lg transition-all duration-300 group relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-1 h-full ${getSeverityBarColor(issue.severity)}`}></div>
                
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-4">
                  <div className="flex items-start gap-4">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm mt-1 ${getSeverityColor(issue.severity)}`}>
                      {issue.severity}
                    </span>
                    <div>
                        <h4 className="font-bold text-slate-800 text-lg leading-tight">{issue.title}</h4>
                        <span className="text-xs font-mono text-slate-400 mt-1 block flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/></svg>
                            {issue.location}
                        </span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => onFixIssue(issue.fixPrompt)}
                    className="shrink-0 shadcn-btn bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white border border-indigo-100 h-9 text-xs font-bold gap-2 transition-all shadow-sm group-hover:translate-x-0 translate-x-2 opacity-0 group-hover:opacity-100"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/></svg>
                    Auto-Fix with AI
                  </button>
                </div>
                
                <p className="text-sm text-slate-600 mb-6 leading-relaxed pl-1">{issue.description}</p>
                
                <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 flex gap-3">
                  <div className="mt-0.5 text-indigo-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  </div>
                  <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Recommendation</span>
                      <p className="text-xs text-slate-700 font-medium">{issue.recommendation}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
