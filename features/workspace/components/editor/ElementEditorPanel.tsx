import React, { useState } from 'react';

interface ElementEditorPanelProps {
  selector: string;
  onApplyAI: (prompt: string) => void;
  onApplyDirectly: (selector: string, styles: Record<string, string>) => void;
  onClose: () => void;
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-6">
        <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">{title}</h5>
        <div className="space-y-4">{children}</div>
    </div>
);

const ColorInput: React.FC<{ label: string; value: string; onChange: (v: string) => void }> = ({ label, value, onChange }) => (
    <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-600">{label}</label>
        <div className="flex items-center gap-2 border border-slate-200 rounded-md px-2 h-10">
            <input type="color" value={value || '#000000'} onChange={e => onChange(e.target.value)} className="w-6 h-6 p-0 border-none rounded cursor-pointer bg-transparent" />
            <input type="text" placeholder="#334155" value={value} onChange={e => onChange(e.target.value)} className="font-mono text-sm w-24 h-full focus:outline-none bg-transparent" />
        </div>
    </div>
);

const BoxModelInput: React.FC<{ label: string; values: Record<string, string>; onChange: (side: string, value: string) => void; }> = ({ label, values, onChange }) => (
    <div>
        <label className="text-sm font-medium text-slate-600 mb-2 block">{label}</label>
        <div className="grid grid-cols-4 gap-2">
            <input type="text" placeholder="top" value={values.top} onChange={e => onChange('top', e.target.value)} className="shadcn-input text-center text-xs h-9" />
            <input type="text" placeholder="right" value={values.right} onChange={e => onChange('right', e.target.value)} className="shadcn-input text-center text-xs h-9" />
            <input type="text" placeholder="bottom" value={values.bottom} onChange={e => onChange('bottom', e.target.value)} className="shadcn-input text-center text-xs h-9" />
            <input type="text" placeholder="left" value={values.left} onChange={e => onChange('left', e.target.value)} className="shadcn-input text-center text-xs h-9" />
        </div>
    </div>
);

export const ElementEditorPanel: React.FC<ElementEditorPanelProps> = ({ selector, onApplyAI, onApplyDirectly, onClose }) => {
  const [fields, setFields] = useState({
    color: '',
    backgroundColor: '',
    textContent: '',
    fontSize: '',
    href: '',
    margin: { top: '', right: '', bottom: '', left: '' },
    padding: { top: '', right: '', bottom: '', left: '' },
  });

  const handleApply = () => {
    const styleChanges: Record<string, string> = {};
    const contentChangePrompts: string[] = [];

    if (fields.color) styleChanges['color'] = fields.color;
    if (fields.backgroundColor) styleChanges['background-color'] = fields.backgroundColor;
    if (fields.fontSize) styleChanges['font-size'] = fields.fontSize;

    const marginValues = Object.values(fields.margin).filter(Boolean);
    if (marginValues.length > 0) {
        styleChanges['margin'] = `${fields.margin.top||'0'} ${fields.margin.right||'0'} ${fields.margin.bottom||'0'} ${fields.margin.left||'0'}`;
    }
    const paddingValues = Object.values(fields.padding).filter(Boolean);
    if (paddingValues.length > 0) {
        styleChanges['padding'] = `${fields.padding.top||'0'} ${fields.padding.right||'0'} ${fields.padding.bottom||'0'} ${fields.padding.left||'0'}`;
    }

    if (fields.textContent) contentChangePrompts.push(`change its text content to "${fields.textContent}"`);
    if (fields.href) contentChangePrompts.push(`make its link (href) point to ${fields.href}`);
    
    const hasStyleChanges = Object.keys(styleChanges).length > 0;
    const hasContentChanges = contentChangePrompts.length > 0;

    if (!hasStyleChanges && !hasContentChanges) return;
    if (hasContentChanges) {
      const allChanges = [...contentChangePrompts];
      if(hasStyleChanges) allChanges.push(`apply the following styles: ${JSON.stringify(styleChanges)}`);
      onApplyAI(`For the element "${selector}", ${allChanges.join(' and ')}.`);
    } else if (hasStyleChanges) {
      onApplyDirectly(selector, styleChanges);
    }
  };

  return (
    <div className="absolute top-0 left-0 bottom-0 w-full bg-slate-50 border-r border-slate-200 z-10 shadow-2xl animate-in slide-in-from-left-full duration-300 flex flex-col">
      <div className="p-4 border-b border-slate-200 bg-white shrink-0">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-bold text-slate-800">Edit Element</h4>
            <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full h-8 w-8 flex items-center justify-center text-xl">&times;</button>
          </div>
          <p className="text-xs font-mono text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded-md truncate">{selector}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <Section title="Typography">
            <ColorInput label="Text Color" value={fields.color} onChange={v => setFields(f=>({...f, color: v}))} />
            <div>
                <label className="text-sm font-medium text-slate-600">Font Size</label>
                <input type="text" placeholder="e.g. 16px or 1rem" value={fields.fontSize} onChange={e => setFields(f=>({...f, fontSize: e.target.value}))} className="shadcn-input h-10 text-sm mt-1" />
            </div>
        </Section>
        <Section title="Appearance">
            <ColorInput label="Background" value={fields.backgroundColor} onChange={v => setFields(f=>({...f, backgroundColor: v}))} />
        </Section>
        <Section title="Spacing">
            <BoxModelInput label="Margin" values={fields.margin} onChange={(s,v) => setFields(f=>({...f, margin: {...f.margin, [s]:v}}))} />
            <BoxModelInput label="Padding" values={fields.padding} onChange={(s,v) => setFields(f=>({...f, padding: {...f.padding, [s]:v}}))} />
        </Section>
         <Section title="Content & Attributes (Uses AI)">
            <div>
                <label className="text-sm font-medium text-slate-600">Text Content</label>
                <input type="text" placeholder="New text here..." value={fields.textContent} onChange={e => setFields(f=>({...f, textContent: e.target.value}))} className="shadcn-input h-10 text-sm mt-1" />
            </div>
            <div>
                <label className="text-sm font-medium text-slate-600">Link URL (href)</label>
                <input type="text" placeholder="/contact-us" value={fields.href} onChange={e => setFields(f=>({...f, href: e.target.value}))} className="shadcn-input h-10 text-sm mt-1" />
            </div>
        </Section>
      </div>

      <div className="p-4 border-t border-slate-200 bg-white mt-auto shrink-0">
        <button onClick={handleApply} className="shadcn-btn shadcn-btn-primary w-full h-10 text-sm">Apply Changes</button>
      </div>
    </div>
  );
};