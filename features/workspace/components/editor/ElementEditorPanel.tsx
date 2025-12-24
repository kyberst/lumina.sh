
import React, { useState, useEffect } from 'react';
import { t } from '../../../../services/i18n';

interface ElementEditorPanelProps {
  selector: string;
  initialValues?: any;
  onApplyAI: (prompt: string) => void;
  onApplyDirectly: (selector: string, styles: Record<string, string>) => void;
  onClose: () => void;
}

const UNITS = ['px', 'rem', 'em', '%', 'vh', 'vw'];

// Helper to convert browser RGB/RGBA to Hex for color input
const rgbToHex = (color: string) => {
  if (!color || color === 'transparent') return '';
  if (color.startsWith('#')) return color;
  
  const match = color.match(/(\d+(\.\d+)?)/g);
  if (!match || match.length < 3) return '';
  
  const r = parseInt(match[0]);
  const g = parseInt(match[1]);
  const b = parseInt(match[2]);
  
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-6">
        <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">{title}</h5>
        <div className="space-y-4">{children}</div>
    </div>
);

const ColorInput: React.FC<{ label: string; value: string; onChange: (v: string) => void }> = ({ label, value, onChange }) => {
    const hexValue = rgbToHex(value);
    return (
        <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-600">{label}</label>
            <div className="flex items-center gap-2 border border-slate-200 rounded-md px-2 h-10 bg-white">
                <input type="color" value={hexValue || '#000000'} onChange={e => onChange(e.target.value)} className="w-6 h-6 p-0 border-none rounded cursor-pointer bg-transparent" />
                <input type="text" placeholder="#334155" value={value} onChange={e => onChange(e.target.value)} className="font-mono text-sm w-20 h-full focus:outline-none bg-transparent text-right" />
            </div>
        </div>
    );
};

const DimensionInput: React.FC<{ label?: string; value: string; onChange: (v: string) => void; placeholder?: string }> = ({ label, value, onChange, placeholder }) => {
    const match = value ? value.match(/^([\d.-]+)([a-z%]+)?$/) : null;
    const numVal = match ? match[1] : value;
    const unitVal = match ? match[2] || 'px' : 'px';

    const handleNumChange = (v: string) => {
        onChange(v ? `${v}${unitVal}` : '');
    };

    const handleUnitChange = (u: string) => {
        if (numVal) onChange(`${numVal}${u}`);
        else onChange(``); 
    };

    return (
        <div className="flex flex-col gap-1">
            {label && <label className="text-sm font-medium text-slate-600">{label}</label>}
            <div className="flex rounded-md shadow-sm">
                <input 
                    type="number" 
                    value={numVal} 
                    onChange={e => handleNumChange(e.target.value)} 
                    placeholder={placeholder || "0"}
                    className="shadcn-input rounded-r-none border-r-0 flex-1 min-w-0 text-sm" 
                />
                <select 
                    value={unitVal} 
                    onChange={e => handleUnitChange(e.target.value)}
                    className="bg-slate-100 border border-slate-200 rounded-r-md px-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary/20 text-slate-600 hover:bg-slate-200 cursor-pointer w-16"
                >
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
            </div>
        </div>
    );
};

const BoxModelInput: React.FC<{ label: string; values: Record<string, string>; onChange: (side: string, value: string) => void; }> = ({ label, values, onChange }) => (
    <div>
        <label className="text-sm font-medium text-slate-600 mb-2 block">{label}</label>
        <div className="grid grid-cols-2 gap-2">
            {(['top', 'right', 'bottom', 'left'] as const).map(side => (
                <DimensionInput 
                    key={side}
                    placeholder={side[0].toUpperCase() + side.slice(1)} 
                    value={values[side] || ''} 
                    onChange={v => onChange(side, v)}
                />
            ))}
        </div>
    </div>
);

export const ElementEditorPanel: React.FC<ElementEditorPanelProps> = ({ selector, initialValues, onApplyAI, onApplyDirectly, onClose }) => {
  const [fields, setFields] = useState({
    color: '',
    backgroundColor: '',
    textContent: '',
    fontSize: '',
    margin: { top: '', right: '', bottom: '', left: '' },
    padding: { top: '', right: '', bottom: '', left: '' },
  });

  useEffect(() => {
      setFields({
        color: initialValues?.color || '',
        backgroundColor: initialValues?.backgroundColor || '',
        textContent: initialValues?.textContent || '',
        fontSize: initialValues?.fontSize || '',
        margin: initialValues?.margin || { top: '', right: '', bottom: '', left: '' },
        padding: initialValues?.padding || { top: '', right: '', bottom: '', left: '' },
      });
  }, [selector, initialValues]);

  const handleApply = () => {
    const styleChanges: Record<string, string> = {};
    const contentChangePrompts: string[] = [];

    // Diffing Logic: Only add to styleChanges if value exists
    if (fields.color) styleChanges['color'] = fields.color;
    if (fields.backgroundColor) styleChanges['background-color'] = fields.backgroundColor;
    if (fields.fontSize) styleChanges['font-size'] = fields.fontSize;

    if (Object.values(fields.margin).some(v => v)) {
        if(fields.margin.top) styleChanges['margin-top'] = fields.margin.top;
        if(fields.margin.right) styleChanges['margin-right'] = fields.margin.right;
        if(fields.margin.bottom) styleChanges['margin-bottom'] = fields.margin.bottom;
        if(fields.margin.left) styleChanges['margin-left'] = fields.margin.left;
    }
    if (Object.values(fields.padding).some(v => v)) {
        if(fields.padding.top) styleChanges['padding-top'] = fields.padding.top;
        if(fields.padding.right) styleChanges['padding-right'] = fields.padding.right;
        if(fields.padding.bottom) styleChanges['padding-bottom'] = fields.padding.bottom;
        if(fields.padding.left) styleChanges['padding-left'] = fields.padding.left;
    }

    // Determine if text content genuinely changed from initial
    const initialText = initialValues?.textContent || '';
    const currentText = fields.textContent || '';
    const hasTextChange = currentText.trim() !== initialText.trim();

    if (hasTextChange) {
        contentChangePrompts.push(`change its text content to "${fields.textContent}"`);
    }
    
    const hasStyleChanges = Object.keys(styleChanges).length > 0;

    if (!hasStyleChanges && !hasTextChange) return;
    
    // DECISION LOGIC:
    // 1. If Text Changed -> Must use AI (Modifying DOM text content safely requires source code context)
    // 2. If ONLY Styles Changed -> Use Direct Application (Save tokens, faster)
    
    if (hasTextChange) {
      const allChanges = [...contentChangePrompts];
      if (hasStyleChanges) allChanges.push(`apply the following styles: ${JSON.stringify(styleChanges)}`);
      onApplyAI(`For the element "${selector}", ${allChanges.join(' and ')}.`);
    } else {
      // Manual Mode: Apply styles directly via CSS injection without AI
      onApplyDirectly(selector, styleChanges);
    }
  };

  return (
    <div className="absolute inset-0 w-full bg-slate-50 border-r border-slate-200 z-50 shadow-2xl animate-in slide-in-from-left-full duration-300 flex flex-col font-sans">
      <div className="p-4 border-b border-slate-200 bg-white shrink-0">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-bold text-slate-800">{t('elementEditor.title', 'builder')}</h4>
            <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full h-8 w-8 flex items-center justify-center text-xl">&times;</button>
          </div>
          <div className="bg-indigo-50 border border-indigo-100 px-3 py-2 rounded-lg">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block mb-1">Target Selector</span>
              <p className="text-xs font-mono text-indigo-700 break-all leading-tight">{selector}</p>
          </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <Section title={t('elementEditor.typography', 'builder')}>
            <ColorInput label={t('elementEditor.color', 'builder')} value={fields.color} onChange={v => setFields(f=>({...f, color: v}))} />
            <div className="h-4"></div>
            <DimensionInput label={t('elementEditor.size', 'builder')} value={fields.fontSize} onChange={v => setFields(f=>({...f, fontSize: v}))} placeholder="16" />
        </Section>
        <Section title={t('elementEditor.appearance', 'builder')}>
            <ColorInput label={t('elementEditor.background', 'builder')} value={fields.backgroundColor} onChange={v => setFields(f=>({...f, backgroundColor: v}))} />
        </Section>
        <Section title={t('elementEditor.spacing', 'builder')}>
            <BoxModelInput label={t('elementEditor.margin', 'builder')} values={fields.margin} onChange={(s,v) => setFields(f=>({...f, margin: {...f.margin, [s]:v}}))} />
            <div className="h-4"></div>
            <BoxModelInput label={t('elementEditor.padding', 'builder')} values={fields.padding} onChange={(s,v) => setFields(f=>({...f, padding: {...f.padding, [s]:v}}))} />
        </Section>
         <Section title={t('elementEditor.contentAttr', 'builder')}>
            <div>
                <label className="text-sm font-medium text-slate-600 mb-1 block">{t('elementEditor.textContent', 'builder')}</label>
                <div className="text-[10px] text-orange-500 mb-2 font-medium bg-orange-50 p-2 rounded border border-orange-100">
                    ⚠ Changing text content requires AI regeneration (Uses tokens).
                </div>
                <textarea 
                    placeholder={t('elementEditor.placeholder.text', 'builder')} 
                    value={fields.textContent} 
                    onChange={e => setFields(f=>({...f, textContent: e.target.value}))} 
                    className="shadcn-input min-h-[80px] text-sm py-2 resize-none" 
                />
            </div>
        </Section>
      </div>

      <div className="p-4 border-t border-slate-200 bg-white mt-auto shrink-0 space-y-2">
        <button onClick={handleApply} className="shadcn-btn shadcn-btn-primary w-full h-10 text-sm font-bold shadow-lg shadow-indigo-200">
            {t('elementEditor.apply', 'builder')}
        </button>
      </div>
    </div>
  );
};
