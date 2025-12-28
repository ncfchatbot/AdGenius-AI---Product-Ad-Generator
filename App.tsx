import React, { useState, useEffect, useRef } from 'react';
import { Layout } from './components/Layout.tsx';
import { Platform, AspectRatio, ProductCategory, AdConfiguration, BagColor } from './types.ts';
import { generateProductAd, generateLabelDesign, generateBrandStrategy } from './services/geminiService.ts';
import { translations, Language } from './translations.ts';

const LOGO_FILE = "logo.png";
const FALLBACK_LOGO = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%233E2723'%3E%3Cpath d='M2 21h18v-2H2M20 8h-2V5h2m0-2H4v10a4 4 0 0 0 4 4h6a4 4 0 0 0 4-4v-3h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z'/%3E%3C/svg%3E";
const ADMIN_WHATSAPP = "8562076059085"; 

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('th');
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [authStep, setAuthStep] = useState<'register' | 'login'>('register');
  const [activeTab, setActiveTab] = useState<'ad' | 'label' | 'brand'>('ad');
  
  // ข้อมูลโปรไฟล์ที่ต้องบันทึก
  const [regData, setRegData] = useState({ 
    name: '', 
    phone: '', 
    address: '', 
    facebook: '', 
    whatsapp: '' 
  });
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const t = translations[lang];
  const adFileInputRef = useRef<HTMLInputElement>(null);
  const labelLogoInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  // --- AD STATE ---
  const [adConfig, setAdConfig] = useState<AdConfiguration>({
    platform: Platform.FACEBOOK, 
    aspectRatio: AspectRatio.SQUARE,
    category: ProductCategory.PACKAGING, 
    objective: translations[lang].objTaste || 'Taste',
    coffeeDetails: '', 
    atmosphere: '', 
    image: null,
  });
  const [adResult, setAdResult] = useState<{imageUrl: string, caption: string} | null>(null);

  // --- LABEL STATE ---
  const [labelLogo, setLabelLogo] = useState<string | null>(null);
  const [labelConcept, setLabelConcept] = useState('');
  const [prodType, setProdType] = useState<'sticker' | 'print'>('sticker');
  const [labelShape, setLabelShape] = useState<'rect' | 'circle' | 'square'>('rect');
  const [selectedBagColor, setSelectedBagColor] = useState<BagColor>(BagColor.C007);
  const [labelImageUrl, setLabelImageUrl] = useState('');

  // --- BRAND/LOGO STATE ---
  const [brandNameInput, setBrandNameInput] = useState('');
  const [brandStyleInput, setBrandStyleInput] = useState('');
  const [brandStrategy, setBrandStrategy] = useState<any>(null);

  // โหลดข้อมูลจาก localStorage เมื่อเปิดแอป
  useEffect(() => {
    const savedProfile = localStorage.getItem('coffee_partner_profile');
    if (savedProfile) {
      const data = JSON.parse(savedProfile);
      setRegData(data);
      // หากมีข้อมูลครบถ้วน ให้ถือว่าลงทะเบียนแล้ว
      if (data.name && data.phone && data.address) {
        setIsRegistered(true);
      }
    }
  }, []);

  const checkApiKey = async () => {
    // @ts-ignore
    if (window.aistudio && !(await window.aistudio.hasSelectedApiKey())) {
      // @ts-ignore
      await window.aistudio.openSelectKey();
    }
    return true;
  };

  const handleSaveAndSend = () => {
    const { name, phone, address, facebook, whatsapp } = regData;
    if (!name || !phone || !address || !facebook || !whatsapp) {
      setError(lang === 'th' ? "กรุณากรอกข้อมูลให้ครบถ้วนทุกช่อง" : "ກະລຸນາກອກຂໍ້ມູນໃຫ້ຄົບຖ້ວນທຸກຊ່ອງ");
      return;
    }
    
    // บันทึกลงเครื่อง
    localStorage.setItem('coffee_partner_profile', JSON.stringify(regData));
    
    // ส่งไป WhatsApp Admin
    const message = encodeURIComponent(`🔔 [ลงทะเบียนพาร์ทเนอร์ใหม่]\n👤 ชื่อ: ${name}\n📞 เบอร์โทร: ${phone}\n📍 ที่อยู่: ${address}\n🌐 FB: ${facebook}\n💬 WhatsApp: ${whatsapp}`);
    window.open(`https://wa.me/${ADMIN_WHATSAPP}?text=${message}`, '_blank');
    
    setIsRegistered(true);
    setError(null);
  };

  const handleGenerateAd = async () => {
    if (!adConfig.image) {
      setError(lang === 'th' ? "กรุณาอัปโหลดรูปภาพสินค้าจริง" : "ກະລຸນາອັບໂຫຼດຮູບພາບສິນຄ້າຈິງ");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await checkApiKey();
      const res = await generateProductAd(adConfig, lang);
      setAdResult(res);
      resultRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (err: any) { 
      setError(err.message); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleGenerateLabel = async () => {
    if (!labelConcept.trim()) {
      setError(lang === 'th' ? "กรุณากรอกสไตล์งานออกแบบ" : "ກະລຸນາກອກສະໄຕລ໌ງານອອກແບບ");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await checkApiKey();
      const res = await generateLabelDesign(
        labelConcept, 
        labelShape, 
        selectedBagColor, 
        prodType, 
        lang,
        labelLogo
      );
      setLabelImageUrl(res.imageUrl);
      resultRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (err: any) { 
      setError(err.message); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleGenerateBrand = async () => {
    if (!brandStyleInput.trim()) {
      setError(lang === 'th' ? "กรุณากรอกรายละเอียดสไตล์ LOGO" : "ກະລຸນາກອກລາຍລະອຽດສະໄຕລ໌ LOGO");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await checkApiKey();
      const res = await generateBrandStrategy(brandNameInput, brandStyleInput, lang);
      setBrandStrategy(res);
      resultRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (err: any) { 
      setError(err.message); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string | null) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setter(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  if (!isRegistered) {
    return (
      <div className="min-h-screen bg-[#FDF8F3] flex items-center justify-center p-6 text-slate-900">
        <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-8 border border-[#E8D9CF]">
          <div className="text-center mb-8">
            <img src={LOGO_FILE} alt="Logo" className="w-20 h-20 mx-auto mb-4 object-contain" onError={(e) => e.currentTarget.src = FALLBACK_LOGO} />
            <h1 className="text-2xl font-black text-[#3E2723] uppercase">COFFEE PLEASE</h1>
            <p className="text-[10px] font-bold text-[#8D3B24] uppercase tracking-[0.3em]">{t.regSubtitle}</p>
          </div>
          
          {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-100">{error}</div>}
          
          <div className="space-y-4">
            <input type="text" placeholder={t.labelName} value={regData.name} className="w-full p-4 bg-[#FDF8F3] border border-[#E8D9CF] rounded-2xl outline-none font-bold" onChange={e => setRegData({...regData, name: e.target.value})} />
            <input type="tel" placeholder={t.labelPhone} value={regData.phone} className="w-full p-4 bg-[#FDF8F3] border border-[#E8D9CF] rounded-2xl outline-none font-bold" onChange={e => setRegData({...regData, phone: e.target.value})} />
            <textarea placeholder={t.labelAddress} value={regData.address} className="w-full p-4 bg-[#FDF8F3] border border-[#E8D9CF] rounded-2xl outline-none font-bold min-h-[80px]" onChange={e => setRegData({...regData, address: e.target.value})} />
            <input type="text" placeholder="Facebook / Page" value={regData.facebook} className="w-full p-4 bg-[#FDF8F3] border border-[#E8D9CF] rounded-2xl outline-none font-bold" onChange={e => setRegData({...regData, facebook: e.target.value})} />
            <input type="text" placeholder="WhatsApp" value={regData.whatsapp} className="w-full p-4 bg-[#FDF8F3] border border-[#E8D9CF] rounded-2xl outline-none font-bold" onChange={e => setRegData({...regData, whatsapp: e.target.value})} />
            
            <button onClick={handleSaveAndSend} className="w-full bg-[#3E2723] text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-[#2d1b19] transition-colors shadow-lg">
              {t.regSubmit}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout lang={lang} setLang={setLang} onOpenKey={() => window.aistudio?.openSelectKey?.()}>
      <div className="flex justify-center mb-10">
        <div className="inline-flex bg-white p-1.5 rounded-2xl border border-[#E8D9CF] shadow-sm overflow-hidden">
          {(['ad', 'label', 'brand'] as const).map((tab) => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab)} 
              className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-[#3E2723] text-white shadow-md' : 'text-[#6F4E37]/40 hover:text-[#3E2723]'}`}
            >
              {tab === 'ad' ? t.tabAd : tab === 'label' ? t.tabLabel : t.tabBrand}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto text-slate-900">
        {/* --- PAGE 1: CREATE AD --- */}
        {activeTab === 'ad' && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-8 rounded-3xl border border-[#E8D9CF] shadow-sm space-y-6">
                <h3 className="text-xs font-black uppercase tracking-widest border-l-4 border-[#3E2723] pl-3">{t.tabAd}</h3>
                
                <label className="text-[10px] font-black uppercase text-[#8D3B24] mb-2 block">{t.stepImage}</label>
                <div onClick={() => adFileInputRef.current?.click()} className="aspect-square bg-[#FDF8F3] border-2 border-dashed border-[#E8D9CF] rounded-2xl flex items-center justify-center cursor-pointer overflow-hidden relative group">
                  {adConfig.image ? <img src={adConfig.image} className="w-full h-full object-cover" alt="Product" /> : <p className="text-[10px] font-black uppercase opacity-40">{t.clickToUpload}</p>}
                </div>
                <input type="file" ref={adFileInputRef} hidden accept="image/*" onChange={e => handleImageUpload(e, (val) => setAdConfig({ ...adConfig, image: val }))} />
                
                <label className="text-[10px] font-black uppercase text-[#8D3B24] mb-1 block">{t.stepDetails}</label>
                <textarea className="w-full p-4 bg-[#FDF8F3] border border-[#E8D9CF] rounded-xl outline-none text-sm font-medium h-32" placeholder={t.placeholderDetailsPackaging} value={adConfig.coffeeDetails} onChange={e => setAdConfig({...adConfig, coffeeDetails: e.target.value})} />
                
                <label className="text-[10px] font-black uppercase text-[#8D3B24] mb-1 block">{t.stepAtmosphere}</label>
                <input className="w-full p-4 bg-[#FDF8F3] border border-[#E8D9CF] rounded-xl outline-none text-sm font-medium" placeholder={t.placeholderAtmosphere} value={adConfig.atmosphere} onChange={e => setAdConfig({...adConfig, atmosphere: e.target.value})} />
                
                <button disabled={loading} onClick={handleGenerateAd} className="w-full bg-[#3E2723] text-white py-5 rounded-2xl font-black uppercase tracking-widest disabled:opacity-50 flex items-center justify-center shadow-lg transition-transform active:scale-95">
                  {loading ? <span className="animate-pulse">PROCESSING...</span> : t.generateBtn}
                </button>
                {error && <div className="p-3 bg-red-50 text-red-600 text-[10px] font-bold uppercase rounded-xl border border-red-100">{error}</div>}
              </div>
            </div>
            
            <div className="lg:col-span-3" ref={resultRef}>
              <div className="bg-white rounded-3xl border border-[#E8D9CF] shadow-lg overflow-hidden min-h-[500px] p-6 space-y-6 text-center">
                <p className="text-[9px] font-black uppercase tracking-[0.4em] opacity-40">Ad Preview Result</p>
                {adResult ? (
                  <div className="space-y-6 animate-in fade-in duration-700">
                    <img src={adResult.imageUrl} className="w-full rounded-2xl shadow-xl border-4 border-white" alt="Generated Ad" />
                    <div className="bg-[#FDF8F3] p-8 rounded-3xl border border-[#E8D9CF] text-left">
                      <label className="text-[10px] font-black uppercase text-[#8D3B24] mb-3 block border-b border-[#E8D9CF] pb-2">{t.captionTitle}</label>
                      <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap text-slate-800">{adResult.caption}</p>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center opacity-10 py-40 font-black uppercase">
                    <svg className="w-20 h-20 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <span>Result Space</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- PAGE 2: DESIGN LABEL (LOGO ONLY) --- */}
        {activeTab === 'label' && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-8 rounded-3xl border border-[#E8D9CF] shadow-sm space-y-6">
                <h3 className="text-xs font-black uppercase tracking-widest border-l-4 border-[#3E2723] pl-3">{t.tabLabel}</h3>
                
                <label className="text-[10px] font-black uppercase text-[#8D3B24] mb-2 block">{t.stepLogo}</label>
                <div onClick={() => labelLogoInputRef.current?.click()} className="aspect-video bg-[#FDF8F3] border-2 border-dashed border-[#E8D9CF] rounded-xl flex items-center justify-center cursor-pointer overflow-hidden relative group">
                  {labelLogo ? <img src={labelLogo} className="w-full h-full object-contain" alt="Logo" /> : <p className="text-[9px] font-black uppercase opacity-40">{t.clickToUpload}</p>}
                </div>
                <input type="file" ref={labelLogoInputRef} hidden accept="image/*" onChange={e => handleImageUpload(e, setLabelLogo)} />

                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setProdType('sticker')} className={`py-3 rounded-xl text-[10px] font-bold uppercase border transition-all ${prodType === 'sticker' ? 'bg-[#3E2723] text-white' : 'bg-[#FDF8F3] text-slate-400'}`}>{t.prodSticker}</button>
                  <button onClick={() => setProdType('print')} className={`py-3 rounded-xl text-[10px] font-bold uppercase border transition-all ${prodType === 'print' ? 'bg-[#3E2723] text-white' : 'bg-[#FDF8F3] text-slate-400'}`}>{t.prodPrint}</button>
                </div>
                
                <label className="text-[10px] font-black uppercase text-[#8D3B24] mb-1 block">{t.labelShape}</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['rect', 'square', 'circle'] as const).map(s => (
                    <button key={s} onClick={() => setLabelShape(s)} className={`py-2 rounded-xl text-[9px] font-bold uppercase border transition-all ${labelShape === s ? 'bg-[#3E2723] text-white shadow-sm' : 'bg-[#FDF8F3] text-slate-400'}`}>
                      {s === 'rect' ? t.shapeRect : s === 'square' ? t.shapeSquare : t.shapeCircle}
                    </button>
                  ))}
                </div>
                
                <label className="text-[10px] font-black uppercase text-[#8D3B24] mb-1 block">{t.selectBagColor}</label>
                <select className="w-full p-4 bg-[#FDF8F3] border border-[#E8D9CF] rounded-xl text-xs font-bold" value={selectedBagColor} onChange={e => setSelectedBagColor(e.target.value as BagColor)}>
                  {Object.values(BagColor).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                
                <label className="text-[10px] font-black uppercase text-[#8D3B24] mb-1 block">{t.styleLabel}</label>
                <textarea className="w-full p-4 bg-[#FDF8F3] border border-[#E8D9CF] rounded-xl outline-none text-sm font-medium h-32" placeholder={t.brandPlaceholder} value={labelConcept} onChange={e => setLabelConcept(e.target.value)} />
                
                <button disabled={loading} onClick={handleGenerateLabel} className="w-full bg-[#3E2723] text-white py-5 rounded-2xl font-black uppercase tracking-widest disabled:opacity-50 flex items-center justify-center shadow-lg hover:bg-[#2d1b19] transition-colors">
                  {loading ? <span className="animate-pulse">PROCESSING...</span> : t.btnGenerateLabel}
                </button>
                {error && <div className="p-3 bg-red-50 text-red-600 text-[10px] font-bold uppercase rounded-xl border border-red-100">{error}</div>}
              </div>
            </div>
            
            <div className="lg:col-span-3" ref={resultRef}>
               <div className="bg-white rounded-3xl border border-[#E8D9CF] shadow-lg p-6 min-h-[500px] flex flex-col items-center justify-center text-center">
                 {labelImageUrl ? (
                   <img src={labelImageUrl} className="w-full rounded-2xl shadow-2xl border-4 border-white animate-in zoom-in duration-500" alt="Label Preview" />
                 ) : (
                   <div className="py-40 opacity-10 font-black uppercase flex flex-col items-center">
                     <svg className="w-20 h-20 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                     <span>Label Preview Space</span>
                   </div>
                 )}
               </div>
            </div>
          </div>
        )}

        {/* --- PAGE 3: CREATE LOGO/BRAND --- */}
        {activeTab === 'brand' && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-8 rounded-3xl border border-[#E8D9CF] shadow-sm space-y-6">
                <h3 className="text-xs font-black uppercase tracking-widest border-l-4 border-[#3E2723] pl-3">{t.tabBrand}</h3>
                
                <label className="text-[10px] font-black uppercase text-[#8D3B24] mb-1 block">{t.brandNameLabel}</label>
                <input className="w-full p-4 bg-[#FDF8F3] border border-[#E8D9CF] rounded-xl outline-none text-sm font-medium" placeholder="เช่น COFFEE PLEASE" value={brandNameInput} onChange={e => setBrandNameInput(e.target.value)} />
                
                <label className="text-[10px] font-black uppercase text-[#8D3B24] mb-1 block">{t.brandPlaceholder}</label>
                <textarea className="w-full p-5 bg-[#FDF8F3] border border-[#E8D9CF] rounded-2xl outline-none text-sm font-medium h-40" placeholder="เช่น สไตล์มินิมอล เน้นโทนสีครีมและน้ำตาลไม้" value={brandStyleInput} onChange={e => setBrandStyleInput(e.target.value)} />
                
                <button disabled={loading} onClick={handleGenerateBrand} className="w-full bg-[#3E2723] text-white py-5 rounded-2xl font-black uppercase tracking-widest disabled:opacity-50 flex items-center justify-center shadow-lg hover:bg-[#2d1b19] transition-colors">
                  {loading ? <span className="animate-pulse">ANALYZING...</span> : t.btnGenerateBrand}
                </button>
                {error && <div className="p-3 bg-red-50 text-red-600 text-[10px] font-bold uppercase rounded-xl border border-red-100">{error}</div>}
              </div>
            </div>
            
            <div className="lg:col-span-3" ref={resultRef}>
              <div className="bg-white rounded-3xl border border-[#E8D9CF] shadow-lg p-8 min-h-[500px] flex flex-col justify-center space-y-8">
                {brandStrategy ? (
                  <div className="space-y-8 animate-in slide-in-from-bottom duration-500 text-left">
                    <div className="flex flex-wrap gap-2">
                      {brandStrategy.names.map((n: string) => <span key={n} className="px-4 py-2 bg-[#FDF8F3] border border-[#E8D9CF] rounded-full text-[10px] font-black text-[#3E2723] uppercase shadow-sm">{n}</span>)}
                    </div>
                    <div className="p-6 bg-[#FDF8F3] rounded-2xl border border-[#E8D9CF]">
                      <label className="text-[10px] font-black uppercase text-[#8D3B24] mb-4 block border-b border-[#E8D9CF] pb-2">{t.logoConcept}</label>
                      <p className="text-sm font-medium italic leading-relaxed text-slate-700">{brandStrategy.logoConcept}</p>
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t.colorPalette}</label>
                      <div className="flex gap-6">
                        {brandStrategy.colors?.map((c: string) => (
                          <div key={c} className="flex flex-col items-center gap-3 group">
                            <div className="w-16 h-16 rounded-2xl shadow-md border-4 border-white transition-transform group-hover:scale-110" style={{ backgroundColor: c }}></div>
                            <span className="text-[10px] font-bold opacity-60 uppercase tracking-tighter">{c}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-40 opacity-10 text-center font-black uppercase flex flex-col items-center">
                    <svg className="w-20 h-20 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>
                    <span>Brand Strategy Identity Space</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default App;