import React, { useState, useEffect, useRef } from 'react';
import { Layout } from './components/Layout.tsx';
import { Platform, AspectRatio, ProductCategory, AdConfiguration, BagColor } from './types.ts';
import { generateProductAd, generateLabelDesign, generateBrandStrategy } from './services/geminiService.ts';
import { translations, Language } from './translations.ts';

// ป้องกันปัญหา "process is not defined" ที่ทำให้จอขาว
if (typeof (window as any).process === 'undefined') {
  (window as any).process = { env: { API_KEY: '' } };
}

const LOGO_FILE = "logo.png";
const FALLBACK_LOGO = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%233E2723'%3E%3Cpath d='M2 21h18v-2H2M20 8h-2V5h2m0-2H4v10a4 4 0 0 0 4 4h6a4 4 0 0 0 4-4v-3h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z'/%3E%3C/svg%3E";
const ADMIN_WHATSAPP = "8562076059085"; 

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('th');
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'ad' | 'label' | 'brand'>('ad');
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  
  // ข้อมูลโปรไฟล์ที่ต้องบันทึก (ครบทุกฟิลด์ตามที่ขอ)
  const [regData, setRegData] = useState({ 
    name: '', 
    phone: '', 
    address: '', 
    facebook: '', 
    whatsapp: '' 
  });
  
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
    objective: 'Taste',
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

  // ตรวจสอบการลงทะเบียนและ API Key เมื่อเปิดแอป
  useEffect(() => {
    // โหลดโปรไฟล์
    const savedProfile = localStorage.getItem('coffee_partner_profile');
    if (savedProfile) {
      try {
        const data = JSON.parse(savedProfile);
        setRegData(data);
        if (data.name && data.phone && data.address && data.facebook && data.whatsapp) {
          setIsRegistered(true);
        }
      } catch (e) {
        console.error("Failed to parse profile", e);
      }
    }

    // ตรวจสอบ API Key
    const checkKey = async () => {
      // @ts-ignore
      if (window.aistudio) {
        // @ts-ignore
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(selected);
      }
    };
    checkKey();
  }, []);

  const handleOpenKey = async () => {
    // @ts-ignore
    if (window.aistudio) {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  const handleSaveAndSend = () => {
    const { name, phone, address, facebook, whatsapp } = regData;
    if (!name || !phone || !address || !facebook || !whatsapp) {
      setError(lang === 'th' ? "กรุณากรอกข้อมูลให้ครบถ้วนทุกช่อง ข้อมูลนี้จะถูกบันทึกไว้เพื่อใช้งานครั้งต่อไป" : "ກະລຸນາກອກຂໍ້ມູນໃຫ້ຄົບຖ້ວນທຸກຊ່ອງ ຂໍ້ມູນນີ້ຈະຖືກບັນທຶກໄວ້ເພື່ອໃຊ້ງານຄັ້ງຕໍ່ໄປ");
      return;
    }
    
    // บันทึกข้อมูลลงเครื่องแบบถาวร
    localStorage.setItem('coffee_partner_profile', JSON.stringify(regData));
    
    // ส่งไป WhatsApp Admin
    const message = encodeURIComponent(`🔔 [ลงทะเบียนพาร์ทเนอร์ใหม่]\n👤 ชื่อ: ${name}\n📞 เบอร์: ${phone}\n📍 ที่อยู่: ${address}\n🌐 FB: ${facebook}\n💬 WA: ${whatsapp}`);
    window.open(`https://wa.me/${ADMIN_WHATSAPP}?text=${message}`, '_blank');
    
    setIsRegistered(true);
    setError(null);
  };

  const wrapApiCall = async (fn: () => Promise<void>) => {
    // ตรวจสอบคีย์ก่อนรัน
    // @ts-ignore
    if (window.aistudio && !(await window.aistudio.hasSelectedApiKey())) {
      setError(lang === 'th' ? "กรุณาเชื่อมต่อ API Key ก่อนเริ่มงาน" : "ກະລຸນາເຊື່ອມຕໍ່ API Key ກ່ອນເລີ່ມງານ");
      handleOpenKey();
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await fn();
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes("Requested entity was not found")) {
        setError(lang === 'th' ? "API Key ของคุณไม่ถูกต้องหรือไม่มีสิทธิ์เข้าถึง (ต้องใช้โปรเจกต์ที่มีการชำระเงิน)" : "API Key ຂອງທ່ານບໍ່ຖືກຕ້ອງ (ຕ້ອງໃຊ້ໂປຣເຈັກທີ່ມີການຊຳລະເງິນ)");
        // @ts-ignore
        window.aistudio?.openSelectKey();
      } else {
        setError(err.message || "Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAd = () => wrapApiCall(async () => {
    if (!adConfig.image) throw new Error(lang === 'th' ? "กรุณาอัปโหลดรูปภาพสินค้าจริง" : "ກະລຸນາອັບໂຫຼດຮູບພາບສິນຄ້າຈິງ");
    const res = await generateProductAd(adConfig, lang);
    setAdResult(res);
    resultRef.current?.scrollIntoView({ behavior: 'smooth' });
  });

  const handleGenerateLabel = () => wrapApiCall(async () => {
    if (!labelConcept.trim()) throw new Error(lang === 'th' ? "กรุณากรอกสไตล์งานออกแบบ" : "ກະລຸນາກອກສະໄຕລ໌ງານອອກແບບ");
    const res = await generateLabelDesign(labelConcept, labelShape, selectedBagColor, prodType, lang, labelLogo);
    setLabelImageUrl(res.imageUrl);
    resultRef.current?.scrollIntoView({ behavior: 'smooth' });
  });

  const handleGenerateBrand = () => wrapApiCall(async () => {
    if (!brandStyleInput.trim()) throw new Error(lang === 'th' ? "กรุณากรอกรายละเอียดสไตล์ LOGO" : "ກະລຸນາກອກລາຍລະອຽດສະໄຕລ໌ LOGO");
    const res = await generateBrandStrategy(brandNameInput, brandStyleInput, lang);
    setBrandStrategy(res);
    resultRef.current?.scrollIntoView({ behavior: 'smooth' });
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string | null) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setter(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // UI หน้าลงทะเบียน/เข้าสู่ระบบ
  if (!isRegistered) {
    return (
      <div className="min-h-screen bg-[#FDF8F3] flex items-center justify-center p-6">
        <div className="w-full max-w-lg bg-white rounded-[2rem] shadow-2xl p-10 border border-[#E8D9CF]">
          <div className="text-center mb-8">
            <img src={LOGO_FILE} className="w-24 h-24 mx-auto mb-4 object-contain" onError={(e) => e.currentTarget.src = FALLBACK_LOGO} />
            <h1 className="text-3xl font-black text-[#3E2723] uppercase tracking-tighter">COFFEE PLEASE</h1>
            <p className="text-[10px] font-bold text-[#8D3B24] uppercase tracking-[0.4em] mt-1 opacity-70">Partner Registration</p>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-slate-400 ml-4">ข้อมูลร้านค้า</label>
              <input type="text" placeholder={t.labelName} value={regData.name} className="w-full p-4 bg-[#FDF8F3] border border-[#E8D9CF] rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 ring-[#3E2723]/10" onChange={e => setRegData({...regData, name: e.target.value})} />
            </div>
            <input type="tel" placeholder={t.labelPhone} value={regData.phone} className="w-full p-4 bg-[#FDF8F3] border border-[#E8D9CF] rounded-2xl outline-none font-bold" onChange={e => setRegData({...regData, phone: e.target.value})} />
            <textarea placeholder={t.labelAddress} value={regData.address} className="w-full p-4 bg-[#FDF8F3] border border-[#E8D9CF] rounded-2xl outline-none font-bold min-h-[100px]" onChange={e => setRegData({...regData, address: e.target.value})} />
            <div className="grid grid-cols-2 gap-3">
              <input type="text" placeholder="Facebook" value={regData.facebook} className="w-full p-4 bg-[#FDF8F3] border border-[#E8D9CF] rounded-2xl outline-none font-bold text-sm" onChange={e => setRegData({...regData, facebook: e.target.value})} />
              <input type="text" placeholder="WhatsApp" value={regData.whatsapp} className="w-full p-4 bg-[#FDF8F3] border border-[#E8D9CF] rounded-2xl outline-none font-bold text-sm" onChange={e => setRegData({...regData, whatsapp: e.target.value})} />
            </div>

            {error && <div className="p-4 bg-red-50 text-red-600 text-xs font-bold rounded-2xl border border-red-100 animate-bounce-slow">{error}</div>}
            
            <button onClick={handleSaveAndSend} className="w-full bg-[#3E2723] text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-[#2d1b19] transition-all shadow-xl active:scale-95">
              ลงทะเบียนและบันทึกข้อมูล
            </button>
            <p className="text-center text-[9px] text-slate-400 font-bold uppercase">ข้อมูลของคุณจะถูกเก็บไว้ในเครื่องนี้เพื่อความสะดวกในการใช้งานครั้งถัดไป</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout lang={lang} setLang={setLang} onOpenKey={handleOpenKey}>
      {/* API Key Status Bar */}
      {!hasApiKey && (
        <div className="mb-8 p-4 bg-[#8D3B24] text-white rounded-2xl flex items-center justify-between animate-pulse">
          <p className="text-[10px] font-black uppercase tracking-widest">⚠️ กรุณาเชื่อมต่อ API Key เพื่อเริ่มใช้งาน AI</p>
          <button onClick={handleOpenKey} className="bg-white text-[#8D3B24] px-4 py-2 rounded-xl text-[10px] font-black uppercase">Connect Key</button>
        </div>
      )}

      {/* Main Tabs */}
      <div className="flex justify-center mb-10">
        <div className="inline-flex bg-white p-2 rounded-[1.5rem] border border-[#E8D9CF] shadow-xl">
          {(['ad', 'label', 'brand'] as const).map((tab) => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab)} 
              className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-[#3E2723] text-white shadow-lg scale-105' : 'text-[#6F4E37]/40 hover:text-[#3E2723]'}`}
            >
              {tab === 'ad' ? t.tabAd : tab === 'label' ? t.tabLabel : t.tabBrand}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {activeTab === 'ad' && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-8 rounded-[2rem] border border-[#E8D9CF] shadow-sm space-y-6">
                <h3 className="text-xs font-black uppercase tracking-widest border-l-4 border-[#3E2723] pl-3 text-[#3E2723]">1. สร้างสื่อโฆษณา</h3>
                <label className="text-[10px] font-black uppercase text-[#8D3B24] block">{t.stepImage}</label>
                <div onClick={() => adFileInputRef.current?.click()} className="aspect-square bg-[#FDF8F3] border-2 border-dashed border-[#E8D9CF] rounded-3xl flex items-center justify-center cursor-pointer overflow-hidden transition-all hover:border-[#3E2723]">
                  {adConfig.image ? <img src={adConfig.image} className="w-full h-full object-cover" /> : <p className="text-[10px] font-black uppercase opacity-40">{t.clickToUpload}</p>}
                </div>
                <input type="file" ref={adFileInputRef} hidden accept="image/*" onChange={e => handleImageUpload(e, (val) => setAdConfig({ ...adConfig, image: val }))} />
                <textarea className="w-full p-5 bg-[#FDF8F3] border border-[#E8D9CF] rounded-2xl outline-none text-sm font-bold min-h-[120px]" placeholder={t.placeholderDetailsPackaging} value={adConfig.coffeeDetails} onChange={e => setAdConfig({...adConfig, coffeeDetails: e.target.value})} />
                <input className="w-full p-5 bg-[#FDF8F3] border border-[#E8D9CF] rounded-2xl outline-none text-sm font-bold" placeholder={t.placeholderAtmosphere} value={adConfig.atmosphere} onChange={e => setAdConfig({...adConfig, atmosphere: e.target.value})} />
                <button disabled={loading} onClick={handleGenerateAd} className="w-full bg-[#3E2723] text-white py-6 rounded-2xl font-black uppercase tracking-widest disabled:opacity-50 shadow-2xl transition-all hover:-translate-y-1">
                  {loading ? 'Processing...' : t.generateBtn}
                </button>
                {error && <div className="p-4 bg-red-50 text-red-600 text-[10px] font-black rounded-2xl border border-red-100 uppercase">{error}</div>}
              </div>
            </div>
            <div className="lg:col-span-3 min-h-[600px]" ref={resultRef}>
               {loading ? (
                 <div className="h-full bg-white rounded-[2.5rem] flex flex-col items-center justify-center space-y-6 border border-[#E8D9CF] p-10">
                   <div className="w-20 h-20 border-8 border-[#FDF8F3] border-t-[#3E2723] rounded-full animate-spin"></div>
                   <div className="text-center">
                     <p className="text-xl font-black text-[#3E2723] animate-pulse">กำลังปรุงแต่งโฆษณาของคุณ...</p>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">AI กำลังทำงานระดับพรีเมียม (1K Resolution)</p>
                   </div>
                 </div>
               ) : adResult ? (
                 <div className="space-y-8 animate-in fade-in duration-1000">
                   <img src={adResult.imageUrl} className="w-full rounded-[2.5rem] shadow-2xl border-[10px] border-white" />
                   <div className="bg-white p-10 rounded-[2rem] border border-[#E8D9CF] shadow-lg">
                     <label className="text-[10px] font-black uppercase text-[#8D3B24] border-b border-[#E8D9CF] pb-4 block mb-6">{t.captionTitle}</label>
                     <p className="text-lg font-medium leading-relaxed text-slate-800 italic">{adResult.caption}</p>
                   </div>
                 </div>
               ) : (
                 <div className="h-full bg-[#FDF8F3]/50 rounded-[2.5rem] border-2 border-dashed border-[#E8D9CF] flex flex-col items-center justify-center opacity-30 uppercase font-black text-slate-400">
                   <svg className="w-24 h-24 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                   <span>พื้นที่แสดงผลงานโฆษณา</span>
                 </div>
               )}
            </div>
          </div>
        )}

        {/* --- PAGE 2: LOGO ONLY TAB --- */}
        {activeTab === 'label' && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-8 rounded-[2rem] border border-[#E8D9CF] shadow-sm space-y-6">
                <h3 className="text-xs font-black uppercase tracking-widest border-l-4 border-[#3E2723] pl-3 text-[#3E2723]">2. ออกแบบฉลากบนถุง</h3>
                <label className="text-[10px] font-black uppercase text-[#8D3B24] block">{t.stepLogo}</label>
                <div onClick={() => labelLogoInputRef.current?.click()} className="aspect-video bg-[#FDF8F3] border-2 border-dashed border-[#E8D9CF] rounded-2xl flex items-center justify-center cursor-pointer overflow-hidden transition-all hover:border-[#3E2723]">
                  {labelLogo ? <img src={labelLogo} className="w-full h-full object-contain" /> : <p className="text-[9px] font-black uppercase opacity-40">{t.clickToUpload}</p>}
                </div>
                <input type="file" ref={labelLogoInputRef} hidden accept="image/*" onChange={e => handleImageUpload(e, setLabelLogo)} />
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setProdType('sticker')} className={`py-4 rounded-xl text-[10px] font-bold uppercase border transition-all ${prodType === 'sticker' ? 'bg-[#3E2723] text-white' : 'bg-[#FDF8F3] text-slate-400'}`}>{t.prodSticker}</button>
                  <button onClick={() => setProdType('print')} className={`py-4 rounded-xl text-[10px] font-bold uppercase border transition-all ${prodType === 'print' ? 'bg-[#3E2723] text-white' : 'bg-[#FDF8F3] text-slate-400'}`}>{t.prodPrint}</button>
                </div>
                <select className="w-full p-4 bg-[#FDF8F3] border border-[#E8D9CF] rounded-2xl text-xs font-bold" value={selectedBagColor} onChange={e => setSelectedBagColor(e.target.value as BagColor)}>
                  {Object.values(BagColor).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <textarea className="w-full p-5 bg-[#FDF8F3] border border-[#E8D9CF] rounded-2xl outline-none text-sm font-bold min-h-[120px]" placeholder="เช่น ฉลากสไตล์ญี่ปุ่น มินิมอล ตัวหนังสือสีดำ" value={labelConcept} onChange={e => setLabelConcept(e.target.value)} />
                <button disabled={loading} onClick={handleGenerateLabel} className="w-full bg-[#3E2723] text-white py-6 rounded-2xl font-black uppercase tracking-widest disabled:opacity-50 shadow-xl transition-all hover:-translate-y-1">
                  {loading ? 'Designing...' : t.btnGenerateLabel}
                </button>
              </div>
            </div>
            <div className="lg:col-span-3 min-h-[600px]">
              {loading ? (
                 <div className="h-full bg-white rounded-[2.5rem] flex items-center justify-center border border-[#E8D9CF] animate-pulse">
                   <div className="text-center"><p className="text-2xl font-black text-[#3E2723]">กำลังออกแบบ Mockup...</p></div>
                 </div>
              ) : labelImageUrl ? (
                <img src={labelImageUrl} className="w-full rounded-[2.5rem] shadow-2xl border-[10px] border-white animate-in zoom-in duration-500" />
              ) : (
                <div className="h-full bg-[#FDF8F3]/50 rounded-[2.5rem] border-2 border-dashed border-[#E8D9CF] flex items-center justify-center opacity-30 font-black text-slate-400 uppercase">Mockup Label Space</div>
              )}
            </div>
          </div>
        )}

        {/* --- PAGE 3: BRANDING TAB --- */}
        {activeTab === 'brand' && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-8 rounded-[2rem] border border-[#E8D9CF] shadow-sm space-y-6">
                <h3 className="text-xs font-black uppercase tracking-widest border-l-4 border-[#3E2723] pl-3 text-[#3E2723]">3. วิเคราะห์แบรนด์ & LOGO</h3>
                <input className="w-full p-5 bg-[#FDF8F3] border border-[#E8D9CF] rounded-2xl outline-none text-sm font-bold" placeholder="ชื่อแบรนด์ที่ต้องการ" value={brandNameInput} onChange={e => setBrandNameInput(e.target.value)} />
                <textarea className="w-full p-6 bg-[#FDF8F3] border border-[#E8D9CF] rounded-[1.5rem] outline-none text-sm font-bold min-h-[160px]" placeholder="อธิบายแนวคิดแบรนด์ (เช่น เน้นความเร็ว, เน้นคุณภาพสูง, มินิมอล)" value={brandStyleInput} onChange={e => setBrandStyleInput(e.target.value)} />
                <button disabled={loading} onClick={handleGenerateBrand} className="w-full bg-[#3E2723] text-white py-6 rounded-2xl font-black uppercase tracking-widest disabled:opacity-50 shadow-xl transition-all">
                  {loading ? 'Analyzing...' : t.btnGenerateBrand}
                </button>
              </div>
            </div>
            <div className="lg:col-span-3 min-h-[600px]">
              {brandStrategy ? (
                <div className="bg-white p-10 rounded-[2.5rem] border border-[#E8D9CF] shadow-lg space-y-10 animate-in slide-in-from-bottom duration-700">
                  <div className="flex flex-wrap gap-3">
                    {brandStrategy.names.map((n: string) => <span key={n} className="px-6 py-3 bg-[#FDF8F3] rounded-full text-xs font-black text-[#3E2723] uppercase border border-[#E8D9CF] shadow-sm">{n}</span>)}
                  </div>
                  <div className="p-8 bg-[#FDF8F3] rounded-[2rem] border border-[#E8D9CF]">
                    <label className="text-[10px] font-black uppercase text-[#8D3B24] border-b border-[#E8D9CF] pb-3 block mb-4">Identity Strategy</label>
                    <p className="text-sm font-bold leading-relaxed text-slate-700 italic">{brandStrategy.logoConcept}</p>
                  </div>
                  <div className="flex gap-8">
                    {brandStrategy.colors?.map((c: string) => (
                      <div key={c} className="flex flex-col items-center gap-3">
                        <div className="w-20 h-20 rounded-2xl shadow-xl border-4 border-white" style={{ backgroundColor: c }}></div>
                        <span className="text-[10px] font-black text-slate-400 uppercase">{c}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-full bg-[#FDF8F3]/50 rounded-[2.5rem] border-2 border-dashed border-[#E8D9CF] flex items-center justify-center opacity-30 font-black text-slate-400 uppercase">Brand Strategy Result Space</div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default App;