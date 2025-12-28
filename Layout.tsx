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
    <div className="min-h-screen bg-[#FDF8F3] text-[#3E2723]">
      <nav className="bg-white/80 backdrop-blur-md border-b border-[#E8D9CF] sticky top-0 z-50 h-16 flex items-center shadow-sm">
        <div className="max-w-6xl mx-auto px-4 w-full flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <img 
              src={LOGO_SRC} 
              className="w-8 h-8 object-contain" 
              onError={(e) => e.currentTarget.src = FALLBACK_SVG} 
            />
            <div className="leading-none">
              <h1 className="text-sm font-black uppercase tracking-tight">Coffee Please</h1>
              <p className="text-[8px] font-bold text-[#8D3B24] uppercase tracking-widest">Partner AI</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex bg-[#FDF8F3] p-1 rounded-xl border border-[#E8D9CF]">
              {(['th', 'lo'] as const).map(l => (
                <button 
                  key={l} 
                  onClick={() => setLang(l)} 
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${lang === l ? 'bg-[#3E2723] text-white shadow-md' : 'text-[#6F4E37]/50 hover:text-[#3E2723]'}`}
                >
                  {l}
                </button>
              ))}
            </div>
            <button 
              onClick={onOpenKey} 
              className="p-2 border border-[#E8D9CF] rounded-xl hover:bg-[#FDF8F3] transition-colors"
              title="Set API Key"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </button>
          </div>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
      <footer className="py-8 text-center opacity-20 text-[9px] font-bold uppercase tracking-[0.3em]">
        Coffee Please Partner System &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
};