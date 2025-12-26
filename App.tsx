
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout.tsx';
import { Platform, AspectRatio, ProductCategory, AdConfiguration, BagColor, PostObjective } from './types.ts';
import { generateProductAd, generateBrandIdentity, GenerationOutput, BrandIdentityOutput } from './services/geminiService.ts';
import { translations, Language } from './translations.ts';

const FREE_LIMIT = 10;
const ADMIN_PHONE = "8562076059085";

interface BagStyle {
  bg: string;
  type: 'kraft' | 'matte' | 'glossy' | 'metallic' | 'clear';
}

const BAG_STYLES: Record<BagColor, BagStyle> = {
  [BagColor.C001]: { bg: 'linear-gradient(165deg, #e4cfb1 0%, #d2b48c 50%, #c4a478 100%)', type: 'kraft' },
  [BagColor.C002]: { bg: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 100%)', type: 'clear' },
  [BagColor.C003]: { bg: 'linear-gradient(135deg, #d4af37 0%, #fff1b8 40%, #b8860b 100%)', type: 'metallic' },
  [BagColor.C004]: { bg: 'linear-gradient(135deg, #e0e0e0 0%, #ffffff 40%, #a0a0a0 100%)', type: 'metallic' },
  [BagColor.C005]: { bg: 'radial-gradient(circle at 35% 35%, #444, #000)', type: 'glossy' },
  [BagColor.C006]: { bg: 'radial-gradient(circle at 35% 35%, #fff, #eee)', type: 'glossy' },
  [BagColor.C007]: { bg: 'linear-gradient(180deg, #333 0%, #111 100%)', type: 'matte' },
  [BagColor.C008]: { bg: 'linear-gradient(180deg, #5d4037 0%, #3e2723 100%)', type: 'matte' },
  [BagColor.C009]: { bg: 'linear-gradient(180deg, #00838f 0%, #004d40 100%)', type: 'matte' },
  [BagColor.C010]: { bg: 'linear-gradient(180deg, #388e3c 0%, #1b5e20 100%)', type: 'matte' },
  [BagColor.C011]: { bg: 'linear-gradient(180deg, #283593 0%, #1a237e 100%)', type: 'matte' },
  [BagColor.C012]: { bg: 'radial-gradient(circle at 35% 35%, #4fc3f7, #0288d1)', type: 'glossy' },
  [BagColor.C013]: { bg: 'radial-gradient(circle at 35% 35%, #ff5252, #b71c1c)', type: 'glossy' },
};

const CoffeeBagIcon = ({ colorKey, isSelected }: { colorKey: BagColor, isSelected: boolean }) => {
  const style = BAG_STYLES[colorKey];
  const label = colorKey.split(' ')[0];

  return (
    <div className={`flex flex-col items-center group cursor-pointer transition-all duration-300 ${isSelected ? 'scale-110' : 'opacity-75 hover:opacity-100'}`}>
      <div 
        className={`w-12 h-18 sm:w-14 sm:h-20 rounded-t-md rounded-b-xl relative shadow-2xl overflow-hidden border transition-all ${isSelected ? 'ring-4 ring-[#6F4E37] ring-offset-2 border-transparent' : 'border-black/5'}`}
        style={{ background: style.bg }}
      >
        {/* Specular Highlights & Texture */}
        {style.type === 'kraft' && (
          <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cardboard-flat.png")' }} />
        )}
        {(style.type === 'glossy' || style.type === 'metallic') && (
          <div className="absolute top-0 left-[-100%] w-[300%] h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-25 animate-pulse pointer-events-none" />
        )}
        {style.type === 'clear' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-10 bg-amber-900/10 blur-lg rounded-full" />
            <div className="absolute inset-0 bg-white/10 backdrop-blur-[3px]" />
          </div>
        )}

        {/* Realistic Sealing Detail */}
        <div className="absolute top-0 left-0 w-full h-5 bg-black/5 flex flex-col justify-center space-y-[2px] px-1 border-b border-black/5">
          {[1, 2, 3].map(i => <div key={i} className="w-full h-[0.5px] bg-white/10" />)}
        </div>

        {/* Degassing Valve with Shadow */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-black/20 border border-white/5 shadow-inner flex items-center justify-center">
          <div className="w-1.5 h-1.5 bg-black/40 rounded-full" />
        </div>

        {/* Side Gusset Reflection */}
        <div className="absolute right-0 top-0 h-full w-[3px] bg-black/10" />
        <div className="absolute left-0 top-0 h-full w-[1px] bg-white/5" />
      </div>
      <span className={`text-[10px] font-black mt-2 tracking-tighter ${isSelected ? 'text-[#3E2723]' : 'text-[#6F4E37]/50'}`}>{label}</span>
    </div>
  );
};

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('th');
  const [userName, setUserName] = useState<string>('');
  const [partnerId, setPartnerId] = useState<string>('');
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [showStep2, setShowStep2] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'ad' | 'brand' | 'calc'>('ad');
  const [loginError, setLoginError] = useState<string | null>(null);
  
  const [brandConcept, setBrandConcept] = useState('');
  const [selectedBagColor, setSelectedBagColor] = useState<BagColor>(BagColor.C005);
  const [isBranding, setIsBranding] = useState(false);
  const [brandResult, setBrandResult] = useState<BrandIdentityOutput | null>(null);
  const [usageCount, setUsageCount] = useState(0);

  const [config, setConfig] = useState<AdConfiguration>({
    platform: Platform.FACEBOOK,
    aspectRatio: AspectRatio.SQUARE,
    category: ProductCategory.PACKAGING,
    objective: PostObjective.TASTE_QUALITY,
    coffeeDetails: '',
    atmosphere: '',
    image: null,
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GenerationOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [beanPrice, setBeanPrice] = useState<number>(0);
  const [targetWeight, setTargetWeight] = useState<number>(250);
  const [packagingCost, setPackagingCost] = useState<number>(0);
  const [otherLabor, setOtherLabor] = useState<number>(0);

  const t = translations[lang];

  useEffect(() => {
    const storedId = localStorage.getItem('coffee_uid');
    if (storedId) {
      setPartnerId(storedId);
      setIsRegistered(true);
    }
  }, []);

  const costPerUnit = (beanPrice > 0) ? ((beanPrice / 1000) * targetWeight) + packagingCost + otherLabor : 0;

  const handleRegister = () => {
    if (!userName.trim()) {
      setLoginError(t.labelName);
      return;
    }
    setLoginError(null);
    const newId = 'CP-' + Math.random().toString(36).substr(2, 6).toUpperCase();
    setPartnerId(newId);
    setShowStep2(true);
  };

  const downloadImage = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBrandIdentity = async () => {
    if (!brandConcept) return;
    setIsBranding(true);
    setError(null);
    try {
      const res = await generateBrandIdentity(brandConcept, selectedBagColor, lang);
      setBrandResult(res);
    } catch (e) {
      setError("การสื่อสารกับ AI ขัดข้อง กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsBranding(false);
    }
  };

  const handleGenerateAd = async () => {
    if (usageCount >= FREE_LIMIT) {
      setError(t.limitReached);
      return;
    }
    if (!config.image || !config.coffeeDetails) {
      setError("กรุณาอัปโหลดรูปภาพและระบุรายละเอียดก่อนกดสร้าง");
      return;
    }
    setIsGenerating(true);
    setError(null);
    try {
      const output = await generateProductAd(config, lang);
      setResult(output);
      setUsageCount(prev => prev + 1);
    } catch (err: any) {
      setError("เกิดข้อผิดพลาดในการประมวลผลรูปภาพ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isRegistered) {
    return (
      <div className="min-h-screen bg-[#FDF8F3] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl p-10 border border-[#E8D9CF]">
          {!showStep2 ? (
            <div className="space-y-8 text-center animate-in fade-in zoom-in duration-300">
              <div className="w-20 h-20 bg-[#3E2723] text-white rounded-[2.2rem] flex items-center justify-center mx-auto mb-6 shadow-xl">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h1 className="text-3xl font-black text-[#3E2723] tracking-tighter">COFFEE PLEASE</h1>
              <p className="text-[#6F4E37]/60 text-sm font-bold uppercase tracking-widest">{t.regSubtitle}</p>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <input 
                    type="text" 
                    placeholder={t.labelName} 
                    className={`w-full p-5 bg-[#FDF8F3] border rounded-2xl transition-all font-bold text-center focus:ring-2 focus:ring-[#6F4E37] outline-none ${loginError ? 'border-red-400' : 'border-transparent'}`} 
                    value={userName}
                    onChange={e => {
                      setUserName(e.target.value);
                      if (loginError) setLoginError(null);
                    }} 
                  />
                  {loginError && <p className="text-red-500 text-xs font-bold">{loginError}</p>}
                </div>
                <button onClick={handleRegister} className="w-full bg-[#3E2723] text-white py-5 rounded-2xl font-black text-lg shadow-xl hover:bg-black transition-all uppercase">{t.regSubmit}</button>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-8 animate-in slide-in-from-right duration-300">
              <h2 className="text-2xl font-black text-[#3E2723] uppercase">{t.regStep2Title}</h2>
              <div className="bg-[#FDF8F3] p-8 rounded-[2rem] border-2 border-dashed border-[#E8D9CF] font-mono text-3xl font-black text-[#6F4E37] tracking-wider">
                {partnerId}
              </div>
              <p className="text-xs text-[#6F4E37]/60 font-bold px-4">บันทึกรหัสพาร์ทเนอร์นี้เพื่อใช้ในครั้งถัดไป</p>
              <button 
                onClick={() => {
                  localStorage.setItem('coffee_uid', partnerId);
                  setIsRegistered(true);
                }} 
                className="w-full bg-[#3E2723] text-white py-5 rounded-2xl font-black uppercase text-sm active:scale-95 transition-all shadow-lg"
              >
                {t.btnStartApp}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <Layout lang={lang} setLang={setLang} onOpenKey={() => {}}>
      <div className="max-w-5xl mx-auto px-4 mt-8">
        <div className="bg-white p-2 rounded-2xl border border-[#E8D9CF] flex shadow-md overflow-hidden">
          {['ad', 'brand', 'calc'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-[#3E2723] text-white shadow-lg' : 'text-[#6F4E37]/30 hover:text-[#6F4E37]'}`}>
              {tab === 'ad' ? t.tabAd : tab === 'brand' ? t.tabBrand : t.tabCalc}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'ad' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-in fade-in slide-in-from-bottom duration-500">
            <div className="space-y-8 bg-white p-10 rounded-[3rem] border border-[#E8D9CF] shadow-sm">
              <div className="flex justify-between items-center border-b border-[#FDF8F3] pb-6">
                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-[#3E2723] uppercase">{t.subtitle}</h2>
                  <p className="text-[#6F4E37]/50 text-xs font-bold">{t.desc}</p>
                </div>
                <div className="px-5 py-2.5 bg-[#FDF8F3] rounded-full border border-[#E8D9CF]">
                  <span className="text-[10px] font-black text-[#6F4E37] uppercase">{FREE_LIMIT - usageCount} {t.usageUnit} {t.usageLeft}</span>
                </div>
              </div>
              
              <div className="space-y-6">
                {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs font-bold border border-red-100">{error}</div>}

                <div className="space-y-3">
                  <label className="text-[11px] font-black text-[#6F4E37]/40 uppercase tracking-widest">{t.stepCategory}</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setConfig({...config, category: ProductCategory.PACKAGING})} className={`p-4 rounded-xl text-[10px] font-black uppercase border transition-all ${config.category === ProductCategory.PACKAGING ? 'bg-[#6F4E37] text-white border-transparent shadow-md' : 'bg-[#FDF8F3] text-[#6F4E37] border-[#E8D9CF]'}`}>
                      {t.catPackaging}
                    </button>
                    <button onClick={() => setConfig({...config, category: ProductCategory.EQUIPMENT})} className={`p-4 rounded-xl text-[10px] font-black uppercase border transition-all ${config.category === ProductCategory.EQUIPMENT ? 'bg-[#6F4E37] text-white border-transparent shadow-md' : 'bg-[#FDF8F3] text-[#6F4E37] border-[#E8D9CF]'}`}>
                      {t.catEquipment}
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[11px] font-black text-[#6F4E37]/40 uppercase tracking-widest">{t.stepObjective}</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: PostObjective.TASTE_QUALITY, label: t.objTaste },
                      { key: PostObjective.NEW_ARRIVAL, label: t.objArrival },
                      { key: PostObjective.ROASTERY_SKILL, label: t.objRoastery },
                      { key: PostObjective.PROMOTION, label: t.objPromo },
                    ].map((obj) => (
                      <button key={obj.key} onClick={() => setConfig({...config, objective: obj.key})} className={`p-3 rounded-xl text-[10px] font-black uppercase border transition-all ${config.objective === obj.key ? 'bg-[#3E2723] text-white border-transparent' : 'bg-[#FDF8F3] text-[#6F4E37] border-[#E8D9CF]'}`}>
                        {obj.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[11px] font-black text-[#6F4E37]/40 uppercase tracking-widest">{t.stepImage}</label>
                  <div className="border-2 border-dashed border-[#E8D9CF] rounded-[2rem] p-8 text-center cursor-pointer hover:bg-[#FDF8F3] transition-all relative overflow-hidden group" onClick={() => document.getElementById('ad-img')?.click()}>
                    <input type="file" id="ad-img" className="hidden" accept="image/*" onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) {
                        const r = new FileReader();
                        r.onload = () => setConfig({...config, image: r.result as string});
                        r.readAsDataURL(f);
                      }
                    }} />
                    {config.image ? (
                      <div className="relative">
                        <img src={config.image} className="max-h-48 mx-auto rounded-xl shadow-lg border-4 border-white" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                           <span className="text-white text-[10px] font-black uppercase">เปลี่ยนรูปภาพ</span>
                        </div>
                      </div>
                    ) : (
                      <div className="py-6 flex flex-col items-center">
                        <svg className="w-12 h-12 text-[#6F4E37]/20 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeWidth="1.5"/></svg>
                        <p className="text-[#6F4E37] font-black text-[10px] uppercase tracking-widest">{t.clickToUpload}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                   <label className="text-[11px] font-black text-[#6F4E37]/40 uppercase tracking-widest">{t.stepDetails}</label>
                   <textarea className="w-full p-5 bg-[#FDF8F3] border-0 rounded-2xl min-h-[80px] font-bold text-sm focus:ring-2 focus:ring-[#6F4E37] outline-none" placeholder={config.category === ProductCategory.PACKAGING ? t.placeholderDetailsPackaging : t.placeholderDetailsEquipment} value={config.coffeeDetails} onChange={e => setConfig({...config, coffeeDetails: e.target.value})} />
                </div>

                <div className="space-y-3">
                   <label className="text-[11px] font-black text-[#6F4E37]/40 uppercase tracking-widest">{t.stepAtmosphere}</label>
                   <textarea className="w-full p-5 bg-[#FDF8F3] border-0 rounded-2xl min-h-[80px] font-bold text-sm focus:ring-2 focus:ring-[#6F4E37] outline-none" placeholder={t.placeholderAtmosphere} value={config.atmosphere} onChange={e => setConfig({...config, atmosphere: e.target.value})} />
                </div>

                <button onClick={handleGenerateAd} disabled={isGenerating} className="w-full bg-[#3E2723] text-white py-6 rounded-2xl font-black text-lg shadow-xl hover:scale-[1.02] active:scale-95 transition-all uppercase disabled:opacity-50">
                  {isGenerating ? t.generating : t.generateBtn}
                </button>
              </div>
            </div>

            <div className="space-y-6">
               <div className="aspect-square bg-white rounded-[4rem] border border-[#E8D9CF] flex flex-col items-center justify-center p-8 relative shadow-inner overflow-hidden">
                  {result ? (
                    <div className="w-full h-full flex flex-col items-center animate-in zoom-in duration-500">
                      <img src={result.imageUrl} className="max-w-full max-h-[85%] object-contain rounded-3xl shadow-2xl mb-6" />
                      <button 
                        onClick={() => downloadImage(result.imageUrl, `coffee-ad-${Date.now()}.png`)} 
                        className="flex items-center space-x-2 bg-white border border-[#E8D9CF] px-8 py-3 rounded-xl shadow-sm hover:bg-[#FDF8F3] active:scale-95 transition-all"
                      >
                        <svg className="w-4 h-4 text-[#3E2723]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeWidth="2.5" strokeLinecap="round"/></svg>
                        <span className="text-[10px] font-black text-[#3E2723] uppercase">{t.download}</span>
                      </button>
                    </div>
                  ) : (
                    <div className="text-center opacity-20 flex flex-col items-center">
                      <svg className="w-20 h-20 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" strokeWidth="1.5"/></svg>
                      <p className="font-black text-xs uppercase tracking-widest">Preview Area</p>
                    </div>
                  )}
               </div>
               {result?.caption && (
                 <div className="bg-white p-8 rounded-[2.5rem] border border-[#E8D9CF] shadow-sm space-y-4 animate-in slide-in-from-top duration-300">
                   <h3 className="text-[10px] font-black text-[#6F4E37] uppercase tracking-widest">{t.captionTitle}</h3>
                   <div className="text-[#3E2723] italic font-bold leading-relaxed whitespace-pre-line text-sm">{result.caption}</div>
                 </div>
               )}
            </div>
          </div>
        )}

        {activeTab === 'brand' && (
          <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom duration-500">
            <div className="bg-white p-12 rounded-[3.5rem] border border-[#E8D9CF] shadow-sm grid grid-cols-1 lg:grid-cols-2 gap-12">
               <div className="space-y-8">
                  <h2 className="text-3xl font-black text-[#3E2723] uppercase tracking-tighter">{t.tabBrand}</h2>
                  
                  <div className="space-y-4">
                    <label className="text-[11px] font-black text-[#6F4E37]/40 uppercase tracking-widest">{t.selectBagColor}</label>
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 gap-4 bg-[#FDF8F3] p-8 rounded-[2.5rem] border border-[#E8D9CF]/50 shadow-inner">
                      {Object.values(BagColor).map((color) => (
                        <button key={color} onClick={() => setSelectedBagColor(color)}>
                          <CoffeeBagIcon colorKey={color} isSelected={selectedBagColor === color} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-[#6F4E37]/40 uppercase tracking-widest">แนวคิดในการออกแบบแบรนด์</label>
                    <textarea className="w-full p-8 bg-[#FDF8F3] border-0 rounded-[2rem] min-h-[150px] font-bold text-lg focus:ring-2 focus:ring-[#6F4E37] outline-none" placeholder={t.brandPlaceholder} value={brandConcept} onChange={e => setBrandConcept(e.target.value)} />
                  </div>
                  
                  <button onClick={handleBrandIdentity} disabled={isBranding} className="w-full bg-[#3E2723] text-white py-6 rounded-2xl font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-50">
                    {isBranding ? t.generating : t.btnGenerateBrand}
                  </button>
                  
                  <div className="p-8 bg-[#FDF8F3] rounded-[2.5rem] border border-[#E8D9CF] space-y-4">
                     <h3 className="font-black text-[#6F4E37] uppercase text-xs tracking-widest">{t.printingService}</h3>
                     <p className="text-xs font-bold text-[#3E2723]/60 leading-relaxed">{t.printingDesc}</p>
                     <button onClick={() => window.open(`https://wa.me/${ADMIN_PHONE}`)} className="w-full bg-white text-[#3E2723] border border-[#E8D9CF] px-6 py-4 rounded-xl text-xs font-black shadow-sm active:scale-95 transition-all uppercase tracking-widest">
                        {t.btnContactPrint}
                     </button>
                  </div>
               </div>
               <div className="space-y-6">
                  {brandResult ? (
                    <div className="space-y-6 animate-in zoom-in duration-500">
                       <div className="relative group">
                        <img src={brandResult.mockupImageUrl} className="w-full aspect-square object-cover rounded-[3rem] shadow-2xl border-8 border-white" />
                        <button 
                          onClick={() => downloadImage(brandResult.mockupImageUrl, `mockup-${Date.now()}.png`)}
                          className="absolute bottom-6 right-6 bg-white/90 backdrop-blur p-4 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                        >
                          <svg className="w-6 h-6 text-[#3E2723]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeWidth="2.5"/></svg>
                        </button>
                       </div>
                       <div className="bg-white p-8 rounded-[2.5rem] border border-[#E8D9CF] shadow-sm space-y-6">
                          <div>
                            <h4 className="text-[10px] font-black text-[#6F4E37] uppercase tracking-widest mb-3">{t.brandNameIdeas}</h4>
                            <div className="flex flex-wrap gap-2">
                              {brandResult.names.map((name, i) => <span key={i} className="px-5 py-3 bg-[#FDF8F3] rounded-xl text-sm font-black border border-[#E8D9CF] text-[#3E2723]">{name}</span>)}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-[10px] font-black text-[#6F4E37] uppercase tracking-widest mb-2">{t.logoConcept}</h4>
                            <p className="text-sm font-bold text-[#3E2723] italic leading-relaxed">"{brandResult.logoConcept}"</p>
                          </div>
                       </div>
                    </div>
                  ) : (
                    <div className="h-full min-h-[450px] border-2 border-dashed border-[#E8D9CF] rounded-[3rem] flex flex-col items-center justify-center opacity-20 text-center p-8">
                      <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17l.354-.354" strokeWidth="1.5"/></svg>
                      <p className="font-black text-xs uppercase tracking-widest">การออกแบบจะแสดงที่นี่</p>
                    </div>
                  )}
               </div>
            </div>
          </div>
        )}

        {activeTab === 'calc' && (
          <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom duration-500">
            <div className="bg-white p-12 rounded-[3.5rem] border border-[#E8D9CF] shadow-sm grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-2 space-y-8">
                <h2 className="text-3xl font-black text-[#3E2723] uppercase tracking-tighter">{t.calcTitle}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-[#6F4E37]/40 uppercase tracking-widest">{t.calcBeanPrice}</label>
                    <input type="number" className="w-full p-6 bg-[#FDF8F3] border-0 rounded-2xl font-black text-xl text-[#3E2723] focus:ring-2 focus:ring-[#6F4E37] outline-none" value={beanPrice} onChange={e => setBeanPrice(Number(e.target.value))} />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-[#6F4E37]/40 uppercase tracking-widest">ปริมาณสุทธิ (กรัม/ถุง)</label>
                    <input type="number" className="w-full p-6 bg-[#FDF8F3] border-0 rounded-2xl font-black text-xl text-[#3E2723] focus:ring-2 focus:ring-[#6F4E37] outline-none" value={targetWeight} onChange={e => setTargetWeight(Number(e.target.value))} />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-[#6F4E37]/40 uppercase tracking-widest">{t.calcPackaging}</label>
                    <input type="number" className="w-full p-6 bg-[#FDF8F3] border-0 rounded-2xl font-black text-xl text-[#3E2723] focus:ring-2 focus:ring-[#6F4E37] outline-none" value={packagingCost} onChange={e => setPackagingCost(Number(e.target.value))} />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-[#6F4E37]/40 uppercase tracking-widest">ค่าแรงและค่าใช้จ่ายอื่นๆ</label>
                    <input type="number" className="w-full p-6 bg-[#FDF8F3] border-0 rounded-2xl font-black text-xl text-[#3E2723] focus:ring-2 focus:ring-[#6F4E37] outline-none" value={otherLabor} onChange={e => setOtherLabor(Number(e.target.value))} />
                  </div>
                </div>
              </div>
              <div className="bg-[#3E2723] rounded-[3rem] p-12 text-white flex flex-col justify-center items-center shadow-2xl border-4 border-[#6F4E37]">
                 <p className="text-[11px] font-black opacity-40 uppercase tracking-[0.3em] mb-6">{t.calcResult}</p>
                 <div className="text-center">
                  <p className="text-7xl font-black mb-2">{costPerUnit.toLocaleString(undefined, { maximumFractionDigits: 1 })}</p>
                  <p className="text-xs font-bold opacity-60 uppercase tracking-widest">THB / UNIT</p>
                 </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default App;
