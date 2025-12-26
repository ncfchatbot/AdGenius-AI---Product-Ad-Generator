
import React from 'react';
import { Language } from '../translations.ts';

interface LayoutProps {
  children: React.ReactNode;
  lang: Language;
  setLang: (l: Language) => void;
  onOpenKey: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, lang, setLang, onOpenKey }) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#FDF8F3]">
      <header className="bg-white border-b border-[#E8D9CF] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
          <div 
            className="flex items-center space-x-3 cursor-pointer select-none active:scale-95 transition-transform"
            onClick={onOpenKey}
          >
            <div className="w-10 h-10 bg-[#6F4E37] rounded-xl flex items-center justify-center shadow-lg shadow-[#6F4E37]/20">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-[#3E2723] leading-none tracking-tight">COFFEE PLEASE</h1>
              <p className="text-[10px] font-bold text-[#6F4E37] opacity-60 uppercase tracking-widest mt-0.5">Premium Equipment</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex bg-[#FDF8F3] p-1 rounded-xl border border-[#E8D9CF]">
              <button 
                onClick={() => setLang('th')}
                className={`px-4 py-1.5 text-xs font-black rounded-lg transition-all ${lang === 'th' ? 'bg-[#6F4E37] shadow-sm text-white' : 'text-[#6F4E37]/40'}`}
              >
                TH
              </button>
              <button 
                onClick={() => setLang('lo')}
                className={`px-4 py-1.5 text-xs font-black rounded-lg transition-all ${lang === 'lo' ? 'bg-[#6F4E37] shadow-sm text-white' : 'text-[#6F4E37]/40'}`}
              >
                LO
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {children}
      </main>

      <footer className="bg-white border-t border-[#E8D9CF] py-8 mt-12 text-center px-4">
        <p className="text-sm font-bold text-[#3E2723]/40">© 2024 COFFEE PLEASE. ☕ ອຸປະກອນກາເຟ ແລະ ຖົງບັນຈຸ.</p>
      </footer>
    </div>
  );
};
