
import React from 'react';
import { Language } from '../translations.ts';

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
    <div className="min-h-screen bg-[#FDF8F3] font-sans text-[#3E2723]">
      <nav className="bg-white border-b border-[#E8D9CF] sticky top-0 z-50 h-16 flex items-center shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 w-full flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-[#FDF8F3] rounded-lg overflow-hidden border border-[#E8D9CF] flex items-center justify-center">
              <img 
                src={LOGO_SRC} 
                alt="Coffee Please" 
                className="w-full h-full object-contain"
                onError={(e) => e.currentTarget.src = FALLBACK_SVG} 
              />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-black tracking-tight uppercase leading-none">Coffee Please</h1>
              <p className="text-[8px] font-bold text-[#8D3B24] uppercase tracking-[0.2em] mt-0.5">Partner System</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex bg-[#FDF8F3] p-0.5 rounded-lg border border-[#E8D9CF]">
              <button 
                onClick={() => setLang('th')} 
                className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${lang === 'th' ? 'bg-[#3E2723] text-white' : 'text-[#6F4E37]/50 hover:text-[#3E2723]'}`}
              >
                TH
              </button>
              <button 
                onClick={() => setLang('lo')} 
                className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${lang === 'lo' ? 'bg-[#3E2723] text-white' : 'text-[#6F4E37]/50 hover:text-[#3E2723]'}`}
              >
                LO
              </button>
            </div>
            <button 
              onClick={onOpenKey} 
              className="p-1.5 text-[#3E2723] hover:bg-[#FDF8F3] rounded-lg border border-[#E8D9CF] shadow-sm transition-colors"
              title="API Key"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </button>
          </div>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-4 py-8 min-h-[calc(100vh-130px)]">
        {children}
      </main>
      <footer className="py-8 text-center border-t border-[#E8D9CF]">
        <p className="text-[9px] font-bold text-[#6F4E37]/30 uppercase tracking-[0.2em]">
          &copy; {new Date().getFullYear()} Coffee Please Systems. All rights reserved.
        </p>
      </footer>
    </div>
  );
};
