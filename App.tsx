import React, { useState, useEffect, useRef } from 'react';
import { Layout } from './Layout.tsx';
import { Platform, AspectRatio, ProductCategory, AdConfiguration, BagColor } from './types.ts';
import { generateProductAd, generateLabelDesign, generateBrandStrategy } from './geminiService.ts';
import { translations, Language } from './translations.ts';

const ADMIN_WHATSAPP = "8562076059085";

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('th');
  const [isRegistered, setIsRegistered] = useState(false);
  const [activeTab, setActiveTab] = useState<'ad' | 'label' | 'brand'>('ad');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [regData, setRegData] = useState({ name: '', phone: '', address: '', facebook: '', whatsapp: '' });
  const [adConfig, setAdConfig] = useState<AdConfiguration>({
    platform: Platform.FACEBOOK, aspectRatio: AspectRatio.SQUARE,
    category: ProductCategory.PACKAGING, objective: 'Taste',
    coffeeDetails: '', atmosphere: '', image: null,
  });

  const [adResult, setAdResult] = useState<{imageUrl: string, caption: string} | null>(null);
  const [labelImageUrl, setLabelImageUrl] = useState('');
  const [brandStrategy, setBrandStrategy] = useState<any>(null);

  const t = translations[lang];
  const fileRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('cp_partner_v3');
    if (saved) {
      const data = JSON.parse(saved);
      setRegData(data);
      if (data.name && data.phone && data.address) setIsRegistered(true);
    }
    checkKey();
  }, []);

  const checkKey = async () => {
    // @ts-ignore
    if (window.aistudio) setHasApiKey(await window.aistudio.hasSelectedApiKey());
  };

  const handleOpenKey = async () => {
    // @ts-ignore
    if (window.aistudio) {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
      setError(null);
    }
  };

  const handleRegister = () => {
    const { name, phone, address, facebook, whatsapp } = regData;
    if (!name || !phone || !address || !facebook || !whatsapp) {
      setError("กรุณากรอกข้อมูลให้ครบทั้ง 5 ช่องเพื่อลงทะเบียนพาร์ทเนอร์");
      return;
    }
    localStorage.setItem('cp_partner_v3', JSON.stringify(regData));
    const msg = encodeURIComponent(`สวัสดีครับ สนใจลงทะเบียนพาร์ทเนอร์:\n👤 ${name}\n📞 ${phone}\n📍 ${address}\n🌐 FB: ${facebook}\n💬 WA: ${whatsapp}`);
    window.open(`https://wa.me/${ADMIN_WHATSAPP}?text=${msg}`, '_blank');
    setIsRegistered(true);
    setError(null);
  };

  const wrapAction = async (fn: () => Promise<void>) => {
    // @ts-ignore
    if (window.aistudio && !(await window.aistudio.hasSelectedApiKey())) {
      setError("กรุณาเชื่อมต่อ API Key ก่อนใช้งาน (คลิกไอคอนกุญแจ)");
      handleOpenKey();
      return;
    }
    setLoading(true); setError(null);
    try {
      await fn();
      resultRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (err: any) {
      if (err.message?.includes("not found")) {
        setError("API Key เดิมใช้ไม่ได้ กรุณากดเลือก Key ใหม่ (ต้องเป็นโปรเจกต์ที่มีการตั้งค่า Billing)");
        handleOpenKey();
      } else {
        setError(err.message || "เกิดข้อผิดพลาดในการประมวลผล");
      }
    } finally { setLoading(false); }
  };

  if (!isRegistered) {
    return (
      <div className="min-h-screen bg-[#FDF8F3] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-10 border border-[#E8D9CF] animate-fade-in">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black uppercase tracking-tighter">Register Partner</h2>
            <p className="text-[10px] font-bold text-[#8D3B24] uppercase tracking-widest mt-1">Coffee Please Systems</p>
          </div>
          <div className="space-y-4">
            <input type="text" placeholder="ชื่อร้าน / ชื่อของคุณ" className="w-full p-4 bg-[#FDF8F3] rounded-2xl border border-[#E8D9CF] font-bold outline-none focus:ring-2 ring-[#3E2723]/10" value={regData.name} onChange={e => setRegData({...regData, name: e.target.value})} />
            <input type="tel" placeholder="เบอร์โทรศัพท์" className="w-full p-4 bg-[#FDF8F3] rounded-2xl border border-[#E8D9CF] font-bold outline-none" value={regData.phone} onChange={e => setRegData({...regData, phone: e.target.value})} />
            <textarea placeholder="ที่อยู่จัดส่งสินค้า" className="w-full p-4 bg-[#FDF8F3] rounded-2xl border border-[#E8D9CF] font-bold h-24 outline-none" value={regData.address} onChange={e => setRegData({...regData, address: e.target.value})} />
            <input type="text" placeholder="Facebook Page" className="w-full p-4 bg-[#FDF8F3] rounded-2xl border border-[#E8D9CF] font-bold outline-none" value={regData.facebook} onChange={e => setRegData({...regData, facebook: e.target.value})} />
            <input type="text" placeholder="WhatsApp Number" className="w-full p-4 bg-[#FDF8F3] rounded-2xl border border-[#E8D9CF] font-bold outline-none" value={regData.whatsapp} onChange={e => setRegData({...regData, whatsapp: e.target.value})} />
            {error && <p className="text-red-500 text-[10px] font-bold text-center bg-red-50 p-2 rounded-xl">{error}</p>}
            <button onClick={handleRegister} className="w-full bg-[#3E2723] text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-[#2D1B19] transition-all active:scale-95">เริ่มใช้งาน AI ผู้ช่วย</button>
            <p className="text-[8px] text-center opacity-30 font-bold uppercase tracking-widest">ข้อมูลจะถูกบันทึกไว้ในเครื่องนี้โดยอัตโนมัติ</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout lang={lang} setLang={setLang} onOpenKey={handleOpenKey}>
      <div className="flex justify-center mb-10">
        <div className="inline-flex bg-white p-2 rounded-2xl border border-[#E8D9CF] shadow-sm">
          {(['ad', 'label', 'brand'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-8 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-[#3E2723] text-white shadow-md scale-105' : 'text-[#6F4E37]/30 hover:text-[#3E2723]'}`}>
              {t[`tab${tab.charAt(0).toUpperCase() + tab.slice(1)}` as keyof typeof t]}
            </button>
          ))}
        </div>
      </div>

      {!hasApiKey && (
        <div className="mb-8 p-4 bg-[#8D3B24] text-white rounded-2xl flex items-center justify-between shadow-lg animate-pulse">
          <p className="text-[10px] font-black uppercase tracking-widest">⚠️ กรุณาเลือก API Key ก่อน (ต้องเป็น Paid Project สำหรับ Gemini Pro)</p>
          <button onClick={handleOpenKey} className="bg-white text-[#8D3B24] px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">Connect</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-[#E8D9CF] shadow-sm space-y-6">
            {activeTab === 'ad' && (
              <>
                <h3 className="text-xs font-black uppercase border-l-4 border-[#3E2723] pl-3">สร้างโฆษณาสินค้า</h3>
                <div onClick={() => fileRef.current?.click()} className="aspect-square bg-[#FDF8F3] border-2 border-dashed border-[#E8D9CF] rounded-3xl flex items-center justify-center cursor-pointer overflow-hidden group hover:border-[#3E2723] transition-all">
                  {adConfig.image ? <img src={adConfig.image} className="w-full h-full object-cover" /> : <div className="text-center"><p className="text-[10px] font-black opacity-30 uppercase tracking-widest">อัปโหลดรูปสินค้าจริง</p></div>}
                </div>
                <input type="file" ref={fileRef} hidden accept="image/*" onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const r = new FileReader();
                    r.onload = () => setAdConfig({...adConfig, image: r.result as string});
                    r.readAsDataURL(file);
                  }
                }} />
                <textarea className="w-full p-5 bg-[#FDF8F3] border border-[#E8D9CF] rounded-2xl font-bold text-sm outline-none" placeholder="รายละเอียดกาแฟ (เช่น เมล็ดคั่วอ่อน, หอมดอกไม้สีขาว)" value={adConfig.coffeeDetails} onChange={e => setAdConfig({...adConfig, coffeeDetails: e.target.value})} />
                <input className="w-full p-5 bg-[#FDF8F3] border border-[#E8D9CF] rounded-2xl font-bold text-sm outline-none" placeholder="บรรยากาศ (เช่น ในสวนเช้าๆ สไตล์ญี่ปุ่น)" value={adConfig.atmosphere} onChange={e => setAdConfig({...adConfig, atmosphere: e.target.value})} />
                <button disabled={loading} onClick={() => wrapAction(async () => {
                  const res = await generateProductAd(adConfig, lang);
                  setAdResult(res);
                })} className="w-full bg-[#3E2723] text-white py-5 rounded-2xl font-black uppercase shadow-xl hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50">
                  {loading ? 'AI กำลังประมวลผล...' : 'สร้างสื่อโฆษณาพรีเมียม'}
                </button>
              </>
            )}

            {activeTab === 'label' && (
              <div className="space-y-6">
                 <h3 className="text-xs font-black uppercase border-l-4 border-[#3E2723] pl-3">ออกแบบฉลาก Mockup</h3>
                 <p className="text-[10px] font-bold text-slate-400">ระบบจะช่วยจำลองฉลากลงบนบรรจุภัณฑ์จริง</p>
                 <button onClick={() => wrapAction(async () => {
                   const res = await generateLabelDesign("Minimal Japanese", "Rectangle", "Black Matte", "Sticker", lang);
                   setLabelImageUrl(res.imageUrl);
                 })} className="w-full bg-[#3E2723] text-white py-5 rounded-2xl font-black">ตัวอย่างงานออกแบบ</button>
              </div>
            )}

            {activeTab === 'brand' && (
               <div className="space-y-6">
                  <h3 className="text-xs font-black uppercase border-l-4 border-[#3E2723] pl-3">วิเคราะห์แบรนด์</h3>
                  <button onClick={() => wrapAction(async () => {
                    const res = await generateBrandStrategy("My Coffee", "Specialty Coffee", lang);
                    setBrandStrategy(res);
                  })} className="w-full bg-[#3E2723] text-white py-5 rounded-2xl font-black">วิเคราะห์แนวคิดแบรนด์</button>
               </div>
            )}

            {error && <p className="p-4 bg-red-50 text-red-500 text-[10px] font-black rounded-2xl border border-red-100 uppercase text-center">{error}</p>}
          </div>
        </div>

        <div className="lg:col-span-3 min-h-[600px]" ref={resultRef}>
          <div className="bg-white h-full rounded-[2.5rem] border border-[#E8D9CF] shadow-lg p-8 flex flex-col items-center justify-center overflow-hidden">
            {loading ? (
              <div className="text-center space-y-6">
                <div className="w-16 h-16 border-[8px] border-[#FDF8F3] border-t-[#3E2723] rounded-full animate-spin mx-auto"></div>
                <div className="animate-pulse">
                  <p className="text-lg font-black text-[#3E2723] uppercase">AI Generating...</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Powered by Gemini 3 Pro Vision</p>
                </div>
              </div>
            ) : adResult && activeTab === 'ad' ? (
              <div className="w-full space-y-8 animate-fade-in">
                <img src={adResult.imageUrl} className="w-full rounded-3xl shadow-2xl border-4 border-white" />
                <div className="p-8 bg-[#FDF8F3] rounded-[2rem] border border-[#E8D9CF] relative">
                  <span className="absolute -top-3 left-8 bg-[#3E2723] text-white px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">Caption Result</span>
                  <p className="text-lg font-medium text-slate-800 leading-relaxed whitespace-pre-wrap italic">"{adResult.caption}"</p>
                </div>
              </div>
            ) : labelImageUrl && activeTab === 'label' ? (
               <img src={labelImageUrl} className="w-full rounded-3xl shadow-2xl animate-fade-in" />
            ) : brandStrategy && activeTab === 'brand' ? (
               <div className="w-full space-y-8 animate-fade-in">
                  <div className="flex flex-wrap gap-2">
                    {brandStrategy.names.map((n: string) => <span key={n} className="px-5 py-2 bg-[#FDF8F3] rounded-full text-[11px] font-black border border-[#E8D9CF] uppercase">{n}</span>)}
                  </div>
                  <div className="p-8 bg-[#FDF8F3] rounded-3xl border border-[#E8D9CF]">
                    <h4 className="text-[10px] font-black uppercase text-[#8D3B24] mb-4">Core Identity Concept</h4>
                    <p className="text-lg font-bold italic">{brandStrategy.logoConcept}</p>
                  </div>
                  <div className="flex gap-4">
                    {brandStrategy.colors?.map((c: string) => (
                      <div key={c} className="flex flex-col items-center gap-2">
                        <div className="w-16 h-16 rounded-2xl shadow-md border-4 border-white" style={{backgroundColor: c}}></div>
                        <span className="text-[9px] font-black text-slate-400">{c}</span>
                      </div>
                    ))}
                  </div>
               </div>
            ) : (
              <div className="opacity-10 text-center uppercase font-black space-y-6">
                <svg className="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <p className="tracking-[0.4em] text-xs">AI Visualization Result</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-20 pt-10 border-t border-[#E8D9CF] text-center">
        <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="text-[10px] font-black text-slate-300 uppercase hover:text-[#8D3B24] transition-all tracking-widest">Logout & Reset Profile</button>
      </div>
    </Layout>
  );
};

export default App;