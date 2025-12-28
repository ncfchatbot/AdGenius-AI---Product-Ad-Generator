import React, { useState, useEffect, useRef } from 'react';
import { Layout } from './components/Layout.tsx';
import { Platform, AspectRatio, ProductCategory, AdConfiguration, BagColor } from './types.ts';
import { generateProductAd, generateLabelDesign, generateBrandStrategy } from './geminiService.ts';
import { translations, Language } from './translations.ts';

const LOGO_FILE = "logo.png";
const FALLBACK_LOGO = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%233E2723'%3E%3Cpath d='M2 21h18v-2H2M20 8h-2V5h2m0-2H4v10a4 4 0 0 0 4 4h6a4 4 0 0 0 4-4v-3h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z'/%3E%3C/svg%3E";
const ADMIN_WHATSAPP = "8562076059085"; 

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('th');
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'ad' | 'label' | 'brand'>('ad');
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  
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

  const [labelLogo, setLabelLogo] = useState<string | null>(null);
  const [labelConcept, setLabelConcept] = useState('');
  const [prodType, setProdType] = useState<'sticker' | 'print'>('sticker');
  const [labelShape, setLabelShape] = useState<'rect' | 'circle' | 'square'>('rect');
  const [selectedBagColor, setSelectedBagColor] = useState<BagColor>(BagColor.C007);
  const [labelImageUrl, setLabelImageUrl] = useState('');

  const [brandNameInput, setBrandNameInput] = useState('');
  const [brandStyleInput, setBrandStyleInput] = useState('');
  const [brandStrategy, setBrandStrategy] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem('coffee_partner_profile');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setRegData(data);
        if (data.name && data.phone && data.address && data.facebook && data.whatsapp) {
          setIsRegistered(true);
        }
      } catch (e) { console.error("Profile load failed", e); }
    }

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
      setError(null);
    }
  };

  const handleSaveAndSend = () => {
    const { name, phone, address, facebook, whatsapp } = regData;
    if (!name || !phone || !address || !facebook || !whatsapp) {
      setError("กรุณากรอกข้อมูลให้ครบทั้ง 5 ส่วนเพื่อบันทึกโปรไฟล์ถาวร");
      return;
    }
    localStorage.setItem('coffee_partner_profile', JSON.stringify(regData));
    const msg = encodeURIComponent(`🔔 [Partner Register]\n👤 ${name}\n📞 ${phone}\n📍 ${address}\n🌐 FB: ${facebook}\n💬 WA: ${whatsapp}`);
    window.open(`https://wa.me/${ADMIN_WHATSAPP}?text=${msg}`, '_blank');
    setIsRegistered(true);
    setError(null);
  };

  const wrapApiCall = async (fn: () => Promise<void>) => {
    // @ts-ignore
    if (window.aistudio && !(await window.aistudio.hasSelectedApiKey())) {
      setError("กรุณาเลือก API Key ก่อนใช้งาน (คลิกปุ่ม CONNECT)");
      handleOpenKey();
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await fn();
    } catch (err: any) {
      console.error("API Call Error:", err);
      if (err.message?.includes("not found")) {
        setError("API Key หมดอายุหรือไม่มีสิทธิ์ (โปรดเลือก Key ใหม่จากโปรเจกต์ Paid)");
        handleOpenKey();
      } else {
        setError(err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์ AI");
      }
    } finally { setLoading(false); }
  };

  const handleGenerateAd = () => wrapApiCall(async () => {
    if (!adConfig.image) throw new Error("กรุณาอัปโหลดรูปสินค้าจริง");
    const res = await generateProductAd(adConfig, lang);
    setAdResult(res);
    resultRef.current?.scrollIntoView({ behavior: 'smooth' });
  });

  const handleGenerateLabel = () => wrapApiCall(async () => {
    if (!labelConcept) throw new Error("กรุณาระบุแนวคิดงานออกแบบ");
    const res = await generateLabelDesign(labelConcept, labelShape, selectedBagColor, prodType, lang, labelLogo);
    setLabelImageUrl(res.imageUrl);
    resultRef.current?.scrollIntoView({ behavior: 'smooth' });
  });

  const handleGenerateBrand = () => wrapApiCall(async () => {
    if (!brandStyleInput) throw new Error("กรุณาระบุสไตล์ที่ต้องการ");
    const res = await generateBrandStrategy(brandNameInput, brandStyleInput, lang);
    setBrandStrategy(res);
    resultRef.current?.scrollIntoView({ behavior: 'smooth' });
  });

  if (!isRegistered) {
    return (
      <div className="min-h-screen bg-[#FDF8F3] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-10 border border-[#E8D9CF]">
          <div className="text-center mb-8">
            <img src={LOGO_FILE} className="w-24 h-24 mx-auto mb-4 object-contain" onError={(e) => e.currentTarget.src = FALLBACK_LOGO} />
            <h1 className="text-2xl font-black text-[#3E2723] tracking-tighter">COFFEE PLEASE</h1>
            <p className="text-[10px] font-bold text-[#8D3B24] uppercase tracking-widest mt-1">Partner System Registration</p>
          </div>
          <div className="space-y-4">
            <input type="text" placeholder="ชื่อร้าน / ชื่อของคุณ" value={regData.name} className="w-full p-4 bg-[#FDF8F3] border border-[#E8D9CF] rounded-2xl font-bold focus:ring-2 ring-[#3E2723]/10" onChange={e => setRegData({...regData, name: e.target.value})} />
            <input type="tel" placeholder="เบอร์โทรศัพท์ติดต่อ" value={regData.phone} className="w-full p-4 bg-[#FDF8F3] border border-[#E8D9CF] rounded-2xl font-bold" onChange={e => setRegData({...regData, phone: e.target.value})} />
            <textarea placeholder="ที่อยู่จัดส่งสินค้า" value={regData.address} className="w-full p-4 bg-[#FDF8F3] border border-[#E8D9CF] rounded-2xl font-bold min-h-[100px]" onChange={e => setRegData({...regData, address: e.target.value})} />
            <div className="grid grid-cols-2 gap-3">
              <input type="text" placeholder="Facebook" value={regData.facebook} className="p-4 bg-[#FDF8F3] border border-[#E8D9CF] rounded-2xl font-bold text-sm" onChange={e => setRegData({...regData, facebook: e.target.value})} />
              <input type="text" placeholder="WhatsApp" value={regData.whatsapp} className="p-4 bg-[#FDF8F3] border border-[#E8D9CF] rounded-2xl font-bold text-sm" onChange={e => setRegData({...regData, whatsapp: e.target.value})} />
            </div>
            {error && <p className="text-red-500 text-[11px] font-bold text-center bg-red-50 p-2 rounded-xl">{error}</p>}
            <button onClick={handleSaveAndSend} className="w-full bg-[#3E2723] text-white py-5 rounded-2xl font-black shadow-xl hover:bg-[#2d1b19] transition-all active:scale-95">ลงทะเบียนและเริ่มสร้างโฆษณา</button>
            <p className="text-[9px] text-center text-slate-400 font-bold uppercase tracking-tighter">ระบบจะจดจำข้อมูลของคุณไว้ในเครื่องนี้โดยอัตโนมัติ</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout lang={lang} setLang={setLang} onOpenKey={handleOpenKey}>
      <div className="flex justify-center mb-10">
        <div className="inline-flex bg-white p-2 rounded-3xl border border-[#E8D9CF] shadow-lg">
          {(['ad', 'label', 'brand'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-[#3E2723] text-white shadow-xl scale-105' : 'text-[#6F4E37]/40 hover:text-[#3E2723]'}`}>
              {tab === 'ad' ? t.tabAd : tab === 'label' ? t.tabLabel : t.tabBrand}
            </button>
          ))}
        </div>
      </div>

      {!hasApiKey && (
        <div className="mb-8 p-5 bg-[#8D3B24] text-white rounded-3xl flex items-center justify-between shadow-lg">
          <div className="flex items-center space-x-3">
            <span className="animate-ping w-2 h-2 bg-white rounded-full"></span>
            <p className="text-[10px] font-black uppercase tracking-widest">⚠️ ระบบ AI ต้องการการเชื่อมต่อ API Key เพื่อทำงาน</p>
          </div>
          <button onClick={handleOpenKey} className="bg-white text-[#8D3B24] px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#FDF8F3]">Connect Now</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-[#E8D9CF] shadow-sm space-y-6">
            {activeTab === 'ad' && (
              <>
                <h3 className="text-xs font-black uppercase border-l-4 border-[#3E2723] pl-3">1. สร้างสื่อโฆษณา</h3>
                <div onClick={() => adFileInputRef.current?.click()} className="aspect-square bg-[#FDF8F3] border-2 border-dashed border-[#E8D9CF] rounded-[2rem] flex items-center justify-center cursor-pointer overflow-hidden transition-all hover:border-[#3E2723]">
                  {adConfig.image ? <img src={adConfig.image} className="w-full h-full object-cover" /> : <p className="text-[10px] font-black opacity-40 uppercase tracking-widest text-center px-4">คลิกเพื่ออัปโหลด<br/>รูปสินค้าจริง</p>}
                </div>
                <input type="file" ref={adFileInputRef} hidden accept="image/*" onChange={e => {
                  const file = e.target.files?.[0];
                  if(file) {
                    const reader = new FileReader();
                    reader.onloadend = () => setAdConfig({...adConfig, image: reader.result as string});
                    reader.readAsDataURL(file);
                  }
                }} />
                <textarea className="w-full p-5 bg-[#FDF8F3] border border-[#E8D9CF] rounded-2xl font-bold text-sm min-h-[120px] focus:ring-2 ring-[#3E2723]/5 outline-none" placeholder="รายละเอียดกาแฟ (เช่น คั่วกลาง, หอมถั่ว, ช็อกโกแลต)" value={adConfig.coffeeDetails} onChange={e => setAdConfig({...adConfig, coffeeDetails: e.target.value})} />
                <input className="w-full p-5 bg-[#FDF8F3] border border-[#E8D9CF] rounded-2xl font-bold text-sm outline-none" placeholder="บรรยากาศ (เช่น ในคาเฟ่แสงอุ่นตอนเช้า)" value={adConfig.atmosphere} onChange={e => setAdConfig({...adConfig, atmosphere: e.target.value})} />
                <button disabled={loading} onClick={handleGenerateAd} className="w-full bg-[#3E2723] text-white py-6 rounded-2xl font-black shadow-2xl hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50">
                  {loading ? 'AI กำลังประมวลผล...' : 'สร้างโฆษณาระดับพรีเมียม'}
                </button>
              </>
            )}

            {activeTab === 'label' && (
              <>
                <h3 className="text-xs font-black uppercase border-l-4 border-[#3E2723] pl-3">2. ออกแบบฉลาก Mockup</h3>
                <div onClick={() => labelLogoInputRef.current?.click()} className="aspect-video bg-[#FDF8F3] border-2 border-dashed border-[#E8D9CF] rounded-2xl flex items-center justify-center cursor-pointer overflow-hidden">
                  {labelLogo ? <img src={labelLogo} className="w-full h-full object-contain" /> : <p className="text-[10px] font-black opacity-40 uppercase tracking-widest">อัปโหลดไฟล์ LOGO</p>}
                </div>
                <input type="file" ref={labelLogoInputRef} hidden accept="image/*" onChange={e => {
                  const file = e.target.files?.[0];
                  if(file) {
                    const reader = new FileReader();
                    reader.onloadend = () => setLabelLogo(reader.result as string);
                    reader.readAsDataURL(file);
                  }
                }} />
                <select className="w-full p-4 bg-[#FDF8F3] border border-[#E8D9CF] rounded-2xl font-black text-xs" value={selectedBagColor} onChange={e => setSelectedBagColor(e.target.value as BagColor)}>
                  {Object.values(BagColor).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <textarea className="w-full p-5 bg-[#FDF8F3] border border-[#E8D9CF] rounded-2xl font-bold text-sm min-h-[120px] outline-none" placeholder="สไตล์ฉลาก (เช่น มินิมอล, คลีนๆ, สไตล์ญี่ปุ่น)" value={labelConcept} onChange={e => setLabelConcept(e.target.value)} />
                <button disabled={loading} onClick={handleGenerateLabel} className="w-full bg-[#3E2723] text-white py-6 rounded-2xl font-black shadow-xl hover:-translate-y-1 transition-all">
                  {loading ? 'กำลังเรนเดอร์ภาพ...' : 'ดูตัวอย่างบนบรรจุภัณฑ์'}
                </button>
              </>
            )}

            {activeTab === 'brand' && (
              <>
                <h3 className="text-xs font-black uppercase border-l-4 border-[#3E2723] pl-3">3. วิเคราะห์แบรนด์ & LOGO</h3>
                <input className="w-full p-5 bg-[#FDF8F3] border border-[#E8D9CF] rounded-2xl font-bold outline-none" placeholder="ชื่อแบรนด์ที่ต้องการ" value={brandNameInput} onChange={e => setBrandNameInput(e.target.value)} />
                <textarea className="w-full p-6 bg-[#FDF8F3] border border-[#E8D9CF] rounded-2xl font-bold text-sm min-h-[180px] outline-none" placeholder="อธิบายแนวคิดแบรนด์ (เช่น อยากให้ดูดิบ เท่ โทนดำเข้ม)" value={brandStyleInput} onChange={e => setBrandStyleInput(e.target.value)} />
                <button disabled={loading} onClick={handleGenerateBrand} className="w-full bg-[#3E2723] text-white py-6 rounded-2xl font-black shadow-xl">
                  {loading ? 'กำลังวิเคราะห์กลยุทธ์...' : 'สร้างแนวคิดอัตลักษณ์แบรนด์'}
                </button>
              </>
            )}
            {error && <p className="p-4 bg-red-50 text-red-500 text-[10px] font-black rounded-2xl border border-red-100 uppercase text-center">{error}</p>}
          </div>
        </div>

        <div className="lg:col-span-3 min-h-[600px]" ref={resultRef}>
          <div className="bg-white h-full rounded-[2.5rem] border border-[#E8D9CF] shadow-lg p-8 flex flex-col items-center justify-center relative overflow-hidden">
            {loading ? (
              <div className="text-center space-y-6 z-10">
                <div className="w-20 h-20 border-[10px] border-[#FDF8F3] border-t-[#3E2723] rounded-full animate-spin mx-auto"></div>
                <div className="animate-pulse">
                  <p className="text-xl font-black text-[#3E2723]">AI กำลังสร้างสรรค์ผลงาน...</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-2">Specialized Gemini 3 Vision Engine</p>
                </div>
              </div>
            ) : adResult && activeTab === 'ad' ? (
              <div className="w-full space-y-8 animate-in fade-in zoom-in duration-700">
                <img src={adResult.imageUrl} className="w-full rounded-[2rem] shadow-2xl border-[10px] border-white" />
                <div className="p-8 bg-[#FDF8F3] rounded-3xl border border-[#E8D9CF] relative shadow-inner">
                   <div className="absolute -top-3 left-8 bg-[#3E2723] text-white px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">Caption Result</div>
                  <p className="text-lg font-medium text-slate-800 leading-relaxed italic whitespace-pre-wrap">"{adResult.caption}"</p>
                </div>
              </div>
            ) : labelImageUrl && activeTab === 'label' ? (
              <img src={labelImageUrl} className="w-full rounded-[2rem] shadow-2xl border-[10px] border-white animate-in zoom-in duration-500" />
            ) : brandStrategy && activeTab === 'brand' ? (
              <div className="w-full space-y-10 animate-in slide-in-from-bottom duration-700">
                <div className="flex flex-wrap gap-3">
                  {brandStrategy.names.map((n: string) => <span key={n} className="px-6 py-3 bg-[#FDF8F3] rounded-full text-xs font-black border border-[#E8D9CF] text-[#3E2723] uppercase shadow-sm">{n}</span>)}
                </div>
                <div className="p-10 bg-[#FDF8F3] rounded-[2.5rem] border border-[#E8D9CF] shadow-sm">
                  <label className="text-[10px] font-black uppercase text-[#8D3B24] border-b border-[#E8D9CF] pb-4 block mb-6 tracking-widest">Brand Core Identity</label>
                  <p className="text-lg font-bold text-slate-700 italic leading-relaxed">{brandStrategy.logoConcept}</p>
                </div>
                <div className="flex gap-10">
                  {brandStrategy.colors?.map((c: string) => (
                    <div key={c} className="flex flex-col items-center gap-4 group">
                      <div className="w-24 h-24 rounded-3xl shadow-xl border-[6px] border-white transition-transform group-hover:scale-110" style={{ backgroundColor: c }}></div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="opacity-10 text-center uppercase font-black space-y-6">
                <svg className="w-28 h-28 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <p className="tracking-[0.5em] text-xs">AI Visualization Area</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-16 text-center border-t border-[#E8D9CF] pt-10">
        <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="text-[10px] font-black text-slate-300 uppercase hover:text-[#8D3B24] transition-all tracking-widest">ล้างข้อมูลทั้งหมดและออกจากการใช้งาน (Logout)</button>
      </div>
    </Layout>
  );
};

export default App;