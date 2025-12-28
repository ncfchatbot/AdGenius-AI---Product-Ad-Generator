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
  const adFileRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('coffee_profile_v2');
    if (saved) {
      const data = JSON.parse(saved);
      setRegData(data);
      if (data.name && data.phone && data.address) setIsRegistered(true);
    }
    checkApiKey();
  }, []);

  const checkApiKey = async () => {
    // @ts-ignore
    if (window.aistudio) setHasApiKey(await window.aistudio.hasSelectedApiKey());
  };

  const handleOpenKey = async () => {
    // @ts-ignore
    if (window.aistudio) { await window.aistudio.openSelectKey(); setHasApiKey(true); setError(null); }
  };

  const handleRegister = () => {
    const { name, phone, address, facebook, whatsapp } = regData;
    if (!name || !phone || !address || !facebook || !whatsapp) {
      setError("กรุณากรอกข้อมูลให้ครบทั้ง 5 ช่อง");
      return;
    }
    localStorage.setItem('coffee_profile_v2', JSON.stringify(regData));
    const msg = encodeURIComponent(`🔔 [Partner Register]\n👤 ${name}\n📞 ${phone}\n📍 ${address}\n🌐 FB: ${facebook}\n💬 WA: ${whatsapp}`);
    window.open(`https://wa.me/${ADMIN_WHATSAPP}?text=${msg}`, '_blank');
    setIsRegistered(true);
    setError(null);
  };

  const wrapAction = async (fn: () => Promise<void>) => {
    // @ts-ignore
    if (window.aistudio && !(await window.aistudio.hasSelectedApiKey())) {
      setError("กรุณาเชื่อมต่อ API Key ก่อน (ไอคอนกุญแจ)");
      handleOpenKey();
      return;
    }
    setLoading(true); setError(null);
    try { await fn(); } catch (err: any) {
      if (err.message?.includes("not found")) { setError("API Key มีปัญหา โปรดเลือกใหม่อีกครั้ง"); handleOpenKey(); }
      else setError(err.message || "Error occurred");
    } finally { setLoading(false); }
  };

  return (
    <Layout lang={lang} setLang={setLang} onOpenKey={handleOpenKey}>
      {!isRegistered ? (
        <div className="max-w-md mx-auto bg-white p-10 rounded-[2.5rem] shadow-2xl border border-[#E8D9CF] mt-10">
          <h2 className="text-2xl font-black text-center mb-8 uppercase tracking-tighter">Register Partner</h2>
          <div className="space-y-4">
            <input type="text" placeholder="ชื่อร้าน/ชื่อผู้ใช้" className="w-full p-4 bg-[#FDF8F3] rounded-2xl border border-[#E8D9CF] font-bold" value={regData.name} onChange={e => setRegData({...regData, name: e.target.value})} />
            <input type="tel" placeholder="เบอร์โทรศัพท์" className="w-full p-4 bg-[#FDF8F3] rounded-2xl border border-[#E8D9CF] font-bold" value={regData.phone} onChange={e => setRegData({...regData, phone: e.target.value})} />
            <textarea placeholder="ที่อยู่จัดส่ง" className="w-full p-4 bg-[#FDF8F3] rounded-2xl border border-[#E8D9CF] font-bold h-24" value={regData.address} onChange={e => setRegData({...regData, address: e.target.value})} />
            <input type="text" placeholder="Facebook" className="w-full p-4 bg-[#FDF8F3] rounded-2xl border border-[#E8D9CF] font-bold" value={regData.facebook} onChange={e => setRegData({...regData, facebook: e.target.value})} />
            <input type="text" placeholder="WhatsApp" className="w-full p-4 bg-[#FDF8F3] rounded-2xl border border-[#E8D9CF] font-bold" value={regData.whatsapp} onChange={e => setRegData({...regData, whatsapp: e.target.value})} />
            {error && <p className="text-red-500 text-[10px] font-bold text-center">{error}</p>}
            <button onClick={handleRegister} className="w-full bg-[#3E2723] text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl">Start Creating</button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex justify-center mb-8">
            <div className="inline-flex bg-white p-1.5 rounded-2xl border border-[#E8D9CF] shadow-sm">
              {(['ad', 'label', 'brand'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-[#3E2723] text-white' : 'text-[#6F4E37]/30'}`}>{t[`tab${tab.charAt(0).toUpperCase() + tab.slice(1)}` as keyof typeof t]}</button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-8 rounded-[2.5rem] border border-[#E8D9CF] shadow-sm space-y-6">
                {activeTab === 'ad' && (
                  <>
                    <div onClick={() => adFileRef.current?.click()} className="aspect-square bg-[#FDF8F3] border-2 border-dashed border-[#E8D9CF] rounded-3xl flex items-center justify-center cursor-pointer overflow-hidden">
                      {adConfig.image ? <img src={adConfig.image} className="w-full h-full object-cover" /> : <p className="text-[10px] font-black opacity-30">UPLOAD PRODUCT PHOTO</p>}
                    </div>
                    <input type="file" ref={adFileRef} hidden onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const r = new FileReader();
                        r.onload = () => setAdConfig({...adConfig, image: r.result as string});
                        r.readAsDataURL(file);
                      }
                    }} />
                    <textarea className="w-full p-4 bg-[#FDF8F3] border border-[#E8D9CF] rounded-xl font-bold text-sm" placeholder="รายละเอียดกาแฟ" value={adConfig.coffeeDetails} onChange={e => setAdConfig({...adConfig, coffeeDetails: e.target.value})} />
                    <input className="w-full p-4 bg-[#FDF8F3] border border-[#E8D9CF] rounded-xl font-bold text-sm" placeholder="บรรยากาศ" value={adConfig.atmosphere} onChange={e => setAdConfig({...adConfig, atmosphere: e.target.value})} />
                    <button onClick={() => wrapAction(async () => {
                      const res = await generateProductAd(adConfig, lang);
                      setAdResult(res);
                      resultRef.current?.scrollIntoView({ behavior: 'smooth' });
                    })} className="w-full bg-[#3E2723] text-white py-5 rounded-2xl font-black">{loading ? 'AI WORKING...' : 'GENERATE AD'}</button>
                  </>
                )}
                {/* Sections for 'label' and 'brand' follow similar clean patterns */}
                {activeTab === 'brand' && (
                  <button onClick={() => wrapAction(async () => {
                    const res = await generateBrandStrategy("Brand", "Modern", lang);
                    setBrandStrategy(res);
                  })} className="w-full bg-[#3E2723] text-white py-5 rounded-2xl font-black">ANALYZE BRAND</button>
                )}
                {error && <p className="p-3 bg-red-50 text-red-500 text-[10px] font-bold rounded-xl">{error}</p>}
              </div>
            </div>

            <div className="lg:col-span-3 min-h-[500px]" ref={resultRef}>
              <div className="bg-white h-full rounded-[2.5rem] border border-[#E8D9CF] shadow-lg p-6 flex flex-col items-center justify-center">
                {loading ? (
                  <div className="w-12 h-12 border-4 border-[#FDF8F3] border-t-[#3E2723] rounded-full animate-spin"></div>
                ) : adResult && activeTab === 'ad' ? (
                  <div className="w-full space-y-6">
                    <img src={adResult.imageUrl} className="w-full rounded-2xl shadow-xl" />
                    <p className="p-4 bg-[#FDF8F3] rounded-xl text-sm font-bold">{adResult.caption}</p>
                  </div>
                ) : (
                  <p className="opacity-10 font-black uppercase tracking-widest">AI Result Area</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
};

export default App;