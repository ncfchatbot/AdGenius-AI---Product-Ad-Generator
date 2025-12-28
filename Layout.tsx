import React from 'react';
import { Language } from './translations.ts';

interface LayoutProps {
  children: React.ReactNode;
  lang: Language;
  setLang: (l: Language) => void;
  onOpenKey: () => void;
}

const LOGO_SRC = "logo.png";
const FALLBACK_SVG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%233E2723'%3E%3Cpath d='M2 21h18v-2H2M20 8h-2V5h2m0-2H4v10a4 4 0 0 0 4 4h6a4 4 0 0 0 4-4v-3h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z'/%3E%3C/svg%3E";

export const Layout: React.FC<LayoutProps> = ({ children, lang, setLang, onOpenKey }) => {
  return (
    <div className="min-h-screen">
      <nav className="bg-white border-b border-[#E8D9CF] sticky top-0 z-50 h-16 flex items-center shadow-sm">
        <div className="max-w-6xl mx-auto px-4 w-full flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-[#FDF8F3] rounded-lg overflow-hidden border border-[#E8D9CF] flex items-center justify-center">
              <img src={LOGO_SRC} alt="Logo" className="w-full h-full object-contain" onError={(e) => e.currentTarget.src = FALLBACK_SVG} />
            </div>
            <h1 className="text-sm font-black uppercase tracking-tight hidden sm:block">Coffee Please</h1>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex bg-[#FDF8F3] p-0.5 rounded-lg border border-[#E8D9CF]">
              {(['th', 'lo'] as const).map(l => (
                <button key={l} onClick={() => setLang(l)} className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${lang === l ? 'bg-[#3E2723] text-white' : 'text-[#6F4E37]/50'}`}>{l}</button>
              ))}
            </div>
            <button onClick={onOpenKey} className="p-2 border border-[#E8D9CF] rounded-lg hover:bg-[#FDF8F3]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </button>
          </div>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
};