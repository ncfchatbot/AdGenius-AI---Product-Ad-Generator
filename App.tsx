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
    const saved = localStorage.getItem('cp_partner_v4');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setRegData(data);
        if (data.name && data.phone && data.address) setIsRegistered(true);
      } catch (e) { console.error("Profile load error", e); }
    }
    checkApiKey();
  }, []);

  const checkApiKey = async () => {
    // @ts-ignore
    if (window.aistudio) setHasApiKey(await window.aistudio.hasSelectedApiKey());
  };

  const handleOpenKey = async () => {
    // @ts-ignore
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
      setError(null);
    }
  };

  const handleRegister = () => {
    const { name, phone, address, facebook, whatsapp } = regData;
    if (!name || !phone || !address || !facebook || !whatsapp) {
      setError("กรุณากรอกข้อมูลให้ครบทั้ง 5 ช่อง");
      return;
    }
    localStorage.setItem('cp_partner_v4', JSON.stringify(regData));
    const msg = encodeURIComponent(`สวัสดีครับ สนใจลงทะเบียนพาร์ทเนอร์:\n👤 ${name}\n📞 ${phone}\n📍 ${address}\n🌐 FB: ${facebook}\n💬 WA: ${whatsapp}`);
    window.open(`https://wa.me/${ADMIN_WHATSAPP}?text=${msg}`, '_blank');
    setIsRegistered(true);
    setError(null);
  };

  const wrapAction = async (fn: () => Promise<void>) => {
    // @ts-ignore
    if (window.aistudio && !(await window.aistudio.hasSelectedApiKey())) {
      setError("กรุณาเชื่อมต่อ API Key ก่อนใช้งาน (ไอคอนกุญแจ)");
      handleOpenKey();
      return;
    }
    setLoading(true); setError(null);
    try {
      await fn();
      resultRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (err: any) {
      if (err.message?.includes("not found")) {
        setError("API Key ไม่ถูกต้อง กรุณากดเลือก Key ใหม่จากโปรเจกต์ที่ตั้งค่า Billing แล้ว");
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
            <input type="text" placeholder="ชื่อร้าน / ชื่อของคุณ" className="w-full p-4 bg-[#FDF8F3] rounded-2xl border border-[#E8D9CF] font-bold outline-none" value={regData.name} onChange={e => setRegData({...regData, name: e.target.value})} />
            <input type="tel" placeholder="เบอร์โทรศัพท์" className="w-full p-4 bg-[#FDF8F3] rounded-2xl border border-[#E8D9CF] font-bold outline-none" value={regData.phone} onChange={e => setRegData({...regData, phone: e.target.value})} />
            <textarea placeholder="ที่อยู่จัดส่งสินค้า" className="w-full p-4 bg-[#FDF8F3] rounded-2xl border border-[#E8D9CF] font-bold h-24 outline-none" value={regData.address} onChange={e => setRegData({...regData, address: e.target.value})} />
            <input type="text" placeholder="Facebook Page" className="w-full p-4 bg-[#FDF8F3] rounded-2xl border border-[#E8D9CF] font-bold outline-none" value={regData.facebook} onChange={e => setRegData({...regData, facebook: e.target.value})} />
            <input type="text" placeholder="WhatsApp Number" className="w-full p-4 bg-[#FDF8F3] rounded-2xl border border-[#E8D9CF] font-bold outline-none" value={regData.whatsapp} onChange={e => setRegData({...regData, whatsapp: e.target.value})} />
            {error && <p className="text-red-500 text-[10px] font-bold text-center">{error}</p>}
            <button onClick={handleRegister} className="w-full bg-[#3E2723] text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl">เข้าใช้งานระบบ</button>
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
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-8 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-[#3E2723] text-white shadow-md' : 'text-[#6F4E37]/30 hover:text-[#3E2723]'}`}>
              {t[`tab${tab.charAt(0).toUpperCase() + tab.slice(1)}` as keyof typeof t]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-[#E8D9CF] shadow-sm space-y-6">
            {activeTab === 'ad' && (
              <>
                <h3 className="text-xs font-black uppercase border-l-4 border-[#3E2723] pl-3">สร้างสื่อโฆษณา</h3>
                <div onClick={() => fileRef.current?.click()} className="aspect-square bg-[#FDF8F3] border-2 border-dashed border-[#E8D9CF] rounded-3xl flex items-center justify-center cursor-pointer overflow-hidden group hover:border-[#3E2723] transition-all">
                  {adConfig.image ? <img src={adConfig.image} className="w-full h-full object-cover" /> : <div className="text-center opacity-30"><p className="text-[10px] font-black uppercase tracking-widest">UPLOAD PRODUCT IMAGE</p></div>}
                </div>
                <input type="file" ref={fileRef} hidden accept="image/*" onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const r = new FileReader();
                    r.onload = () => setAdConfig({...adConfig, image: r.result as string});
                    r.readAsDataURL(file);
                  }
                }} />
                <textarea className="w-full p-5 bg-[#FDF8F3] border border-[#E8D9CF] rounded-2xl font-bold text-sm outline-none" placeholder="รายละเอียดกาแฟ" value={adConfig.coffeeDetails} onChange={e => setAdConfig({...adConfig, coffeeDetails: e.target.value})} />
                <input className="w-full p-5 bg-[#FDF8F3] border border-[#E8D9CF] rounded-2xl font-bold text-sm outline-none" placeholder="บรรยากาศที่ต้องการ" value={adConfig.atmosphere} onChange={e => setAdConfig({...adConfig, atmosphere: e.target.value})} />
                <button disabled={loading} onClick={() => wrapAction(async () => {
                  const res = await generateProductAd(adConfig, lang);
                  setAdResult(res);
                })} className="w-full bg-[#3E2723] text-white py-5 rounded-2xl font-black uppercase shadow-xl disabled:opacity-50">
                  {loading ? 'AI กำลังประมวลผล...' : 'สร้างโฆษณาพรีเมียม'}
                </button>
              </>
            )}
            {activeTab === 'brand' && (
               <button onClick={() => wrapAction(async () => {
                 const res = await generateBrandStrategy("My Brand", "Modern Specialty", lang);
                 setBrandStrategy(res);
               })} className="w-full bg-[#3E2723] text-white py-5 rounded-2xl font-black">วิเคราะห์ชื่อและโลโก้</button>
            )}
            {error && <p className="p-4 bg-red-50 text-red-500 text-[10px] font-black rounded-2xl border border-red-100 uppercase text-center">{error}</p>}
          </div>
        </div>

        <div className="lg:col-span-3 min-h-[600px]" ref={resultRef}>
          <div className="bg-white h-full rounded-[2.5rem] border border-[#E8D9CF] shadow-lg p-8 flex flex-col items-center justify-center overflow-hidden">
            {loading ? (
              <div className="text-center">
                <div className="w-16 h-16 border-[8px] border-[#FDF8F3] border-t-[#3E2723] rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-xs font-black uppercase tracking-widest text-[#3E2723]">AI Generating...</p>
              </div>
            ) : adResult && activeTab === 'ad' ? (
              <div className="w-full space-y-6 animate-fade-in">
                <img src={adResult.imageUrl} className="w-full rounded-3xl shadow-2xl border-4 border-white" />
                <div className="p-6 bg-[#FDF8F3] rounded-2xl border border-[#E8D9CF]">
                  <p className="text-sm font-bold text-slate-800 italic leading-relaxed whitespace-pre-wrap">"{adResult.caption}"</p>
                </div>
              </div>
            ) : brandStrategy && activeTab === 'brand' ? (
              <div className="w-full space-y-4 animate-fade-in">
                {brandStrategy.names.map((n: string) => <span key={n} className="inline-block px-4 py-2 bg-[#FDF8F3] rounded-full text-xs font-black mr-2 uppercase">{n}</span>)}
                <div className="p-6 bg-[#FDF8F3] rounded-2xl font-bold italic">{brandStrategy.logoConcept}</div>
              </div>
            ) : (
              <p className="opacity-10 font-black uppercase tracking-widest">AI Visualization Result</p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default App;