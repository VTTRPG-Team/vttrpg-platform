'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase'; 
import { ArrowLeft, Coins, ShoppingBag, Shield, Dices, BookOpen, Star, Loader2, Package, X, Check } from 'lucide-react';

// --- Mockup Data: ข้อมูลสินค้าทั้งหมด ---
// key ของ ITEMS ต้องตรงกับหมวดหมู่ที่จะ loop
const ITEMS = {
  cosmetics: [
    { id: 'cos_helm_01', name: 'Paladin Helm', price: 500, rarity: 'rare', color: 'bg-slate-700', icon: <Shield size={48} /> },
    { id: 'cos_hair_02', name: 'Elven Locks', price: 300, rarity: 'common', color: 'bg-yellow-900', icon: <Shield size={48} /> },
    { id: 'cos_hood_03', name: 'Rogue Hood', price: 450, rarity: 'uncommon', color: 'bg-slate-800', icon: <Shield size={48} /> },
    { id: 'cos_beard_04', name: 'Dwarven Beard', price: 200, rarity: 'common', color: 'bg-orange-900', icon: <Shield size={48} /> },
  ],
  dice: [
    { id: 'dice_ruby', name: 'Blood Ruby Set', price: 1200, rarity: 'legendary', color: 'bg-red-900', icon: <Dices size={48} /> },
    { id: 'dice_ice', name: 'Ice Crystal', price: 800, rarity: 'rare', color: 'bg-cyan-900', icon: <Dices size={48} /> },
    { id: 'dice_gold', name: 'Golden Luck', price: 1500, rarity: 'legendary', color: 'bg-yellow-600', icon: <Dices size={48} /> },
  ],
  bundles: [
    { id: 'bund_strahd', name: 'Curse of Strahd', price: 2500, rarity: 'mythic', color: 'bg-purple-900', icon: <BookOpen size={48} /> },
    { id: 'bund_start', name: 'Starter Pack', price: 0, rarity: 'common', color: 'bg-green-900', icon: <BookOpen size={48} /> },
  ]
};

// รวมไอเทมทั้งหมดเป็น Array เดียวเพื่อใช้ค้นหาเวลาแสดงใน Inventory
const ALL_ITEMS_FLAT = [...ITEMS.cosmetics, ...ITEMS.dice, ...ITEMS.bundles];

export default function WorkshopPage() {
  const [gold, setGold] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [ownedItemIds, setOwnedItemIds] = useState<string[]>([]); // เก็บ ID ของที่ซื้อแล้ว
  
  // State สำหรับ Modal Inventory
  const [showInventory, setShowInventory] = useState(false);

  // State สำหรับ Popup แจ้งเตือน
  const [notification, setNotification] = useState<{msg: string, type: 'success'|'error'} | null>(null);

  // 1. โหลดข้อมูลเมื่อเข้าหน้าเว็บ (เงิน + ของที่มี)
  useEffect(() => {
    async function fetchUserData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // ดึงเงิน
        const { data: profile } = await supabase.from('profiles').select('gold').eq('id', user.id).single();
        if (profile) setGold(profile.gold);

        // ดึงของที่ซื้อแล้ว
        const { data: inventory } = await supabase.from('user_inventory').select('item_id').eq('user_id', user.id);
        if (inventory) {
          setOwnedItemIds(inventory.map((row: any) => row.item_id));
        }
      }
      setLoading(false);
    }
    fetchUserData();
  }, []);

  // 2. ฟังก์ชันซื้อของ
  const handleBuy = async (item: any) => {
    if (gold < item.price) {
      showToast('เงินไม่พอครับท่าน!', 'error');
      return;
    }

    setBuyingId(item.id);

    // เรียก SQL Function
    const { data, error } = await supabase.rpc('buy_item', { 
      item_id_input: item.id, 
      price_input: item.price 
    });

    if (error || !data.success) {
      showToast(data?.message || 'เกิดข้อผิดพลาด', 'error');
    } else {
      setGold(data.new_balance);
      setOwnedItemIds([...ownedItemIds, item.id]); // อัปเดตรายการของที่มีทันที
      showToast(`ได้รับ ${item.name} แล้ว!`, 'success');
    }
    
    setBuyingId(null);
  };

  const showToast = (msg: string, type: 'success'|'error') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-200 font-sans relative selection:bg-amber-500 selection:text-black">
       
       {/* Background */}
       <div className="fixed inset-0 bg-[url('/bg-market.jpg')] bg-cover bg-center -z-20" />
       <div className="fixed inset-0 bg-black/85 -z-10" />

       {/* --- Popup Notification --- */}
       {notification && (
         <div className={`fixed top-24 right-6 z-[100] px-6 py-4 rounded-lg shadow-2xl border flex items-center gap-3 animate-bounce
           ${notification.type === 'success' ? 'bg-green-900/90 border-green-500 text-green-100' : 'bg-red-900/90 border-red-500 text-red-100'}
         `}>
           {notification.type === 'success' ? <ShoppingBag /> : <Shield />}
           <span className="font-bold">{notification.msg}</span>
         </div>
       )}

      {/* --- Header --- */}
      <header className="sticky top-0 z-40 bg-[#0f0f0f]/95 backdrop-blur-md border-b border-amber-900/30 px-6 py-4 flex justify-between items-center shadow-2xl">
        <Link href="/" className="text-slate-400 hover:text-white flex items-center gap-2 transition-colors">
          <ArrowLeft size={20} /> <span className="hidden md:inline">MAIN MENU</span>
        </Link>
        
        <h1 className="text-3xl md:text-5xl font-serif font-black text-transparent bg-clip-text bg-gradient-to-b from-red-500 to-red-800 uppercase tracking-tighter drop-shadow-sm">
          Marketplace
        </h1>
        
        <div className="flex items-center gap-3">
          {/* ปุ่มเปิดกระเป๋า (Inventory) */}
          <button 
            onClick={() => setShowInventory(true)}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full border border-slate-600 transition-colors relative group"
          >
            <Package size={20} className="text-slate-200"/>
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full text-[10px] flex items-center justify-center font-bold">
              {ownedItemIds.length}
            </span>
            <div className="absolute top-full mt-2 right-0 bg-black text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Inventory
            </div>
          </button>

          {/* แสดงเงิน */}
          <div className="flex items-center gap-2 bg-black/60 border border-amber-600/50 px-4 py-2 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <Coins className="text-amber-400" size={20} />
            {loading ? (
              <span className="text-xs text-slate-500">Loading...</span>
            ) : (
              <span className="text-amber-100 font-bold font-mono text-lg">{gold.toLocaleString()}</span>
            )}
          </div>
        </div>
      </header>

      {/* --- Main Content --- */}
      <main className="container mx-auto px-4 py-8 space-y-16 pb-24">
        
        {/* Loop หมวดหมู่: Cosmetics */}
        <Section title="Avatar Cosmetics" icon={<Shield />} items={ITEMS.cosmetics} />

        {/* Loop หมวดหมู่: Dice Sets */}
        <Section title="Dice Sets" icon={<Dices />} items={ITEMS.dice} />

        {/* Loop หมวดหมู่: Bundles */}
        <Section title="Digital Bundles" icon={<BookOpen />} items={ITEMS.bundles} />

      </main>

      {/* --- Inventory Modal (Popup) --- */}
      {showInventory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#1a1a1a] border border-slate-600 w-full max-w-2xl max-h-[80vh] rounded-2xl flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-slate-700 bg-[#222]">
              <h2 className="text-2xl font-serif font-bold text-slate-100 flex items-center gap-2">
                <Package className="text-amber-500"/> My Inventory
              </h2>
              <button onClick={() => setShowInventory(false)} className="text-slate-400 hover:text-white p-1 hover:bg-slate-700 rounded transition">
                <X size={24} />
              </button>
            </div>

            {/* Modal Body (Grid ของที่ซื้อแล้ว) */}
            <div className="p-6 overflow-y-auto grid grid-cols-2 md:grid-cols-4 gap-4 scrollbar-thin scrollbar-thumb-slate-700">
              {ownedItemIds.length === 0 ? (
                <div className="col-span-full text-center text-slate-500 py-10">
                  ยังไม่มีไอเทม... ไปช้อปปิ้งกันเถอะ!
                </div>
              ) : (
                ownedItemIds.map(id => {
                  const item = ALL_ITEMS_FLAT.find(i => i.id === id); // หาข้อมูลไอเทมจาก ID
                  if (!item) return null;
                  return (
                    <div key={id} className="bg-slate-800 rounded-lg p-3 border border-slate-700 flex flex-col items-center gap-2">
                       <div className={`w-12 h-12 rounded-full ${item.color} flex items-center justify-center opacity-80`}>
                          {/* ย่อขนาดไอคอนลง */}
                          <div className="scale-50">{item.icon}</div>
                       </div>
                       <span className="text-xs text-center font-bold text-slate-300">{item.name}</span>
                       <span className="text-[10px] px-2 py-0.5 bg-green-900/50 text-green-400 rounded border border-green-800">Owned</span>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );

  // --- Helper Components เพื่อลดโค้ดซ้ำ ---
  function Section({ title, icon, items }: { title: string, icon: any, items: any[] }) {
    return (
      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-amber-900/30 pb-2">
          <div className="p-2 bg-amber-900/20 rounded-lg text-amber-500">{icon}</div>
          <h2 className="text-2xl font-serif font-bold text-amber-100/90 tracking-wide">{title}</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map((item) => {
            const isOwned = ownedItemIds.includes(item.id); // เช็คว่ามีของหรือยัง

            return (
              <div key={item.id} className={`group relative bg-[#151515] border rounded-xl overflow-hidden transition-all duration-300 
                ${isOwned ? 'border-green-900/50 opacity-80' : 'border-slate-800 hover:border-amber-600/50 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(217,119,6,0.15)]'}
              `}>
                
                {/* Rarity Badge */}
                {item.rarity === 'legendary' || item.rarity === 'mythic' ? (
                  <div className="absolute top-2 right-2 bg-yellow-500/20 border border-yellow-500/50 text-yellow-200 text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider z-10 flex items-center gap-1">
                    <Star size={10} fill="currentColor" /> Rare
                  </div>
                ) : null}

                {/* Image Area */}
                <div className={`h-40 w-full ${item.color} flex items-center justify-center relative overflow-hidden`}>
                   <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                   <div className={`text-white/20 transition-transform duration-500 ${!isOwned && 'group-hover:scale-110 group-hover:text-white/60'}`}>
                      {item.icon}
                   </div>
                </div>

                {/* Details */}
                <div className="p-4 space-y-3">
                  <h3 className="font-bold text-slate-200 truncate group-hover:text-amber-400 transition-colors">
                    {item.name}
                  </h3>
                  
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                      {item.rarity}
                    </div>
                    
                    {/* ปุ่มกดซื้อ (เปลี่ยนสถานะตามการเป็นเจ้าของ) */}
                    {isOwned ? (
                       <button disabled className="bg-slate-800 text-green-500 border border-green-900/50 px-3 py-1.5 rounded text-sm font-bold flex items-center gap-1 cursor-default">
                         <Check size={14} /> OWNED
                       </button>
                    ) : (
                       <button 
                         onClick={() => handleBuy(item)}
                         disabled={buyingId === item.id}
                         className="flex items-center gap-1.5 bg-slate-800 hover:bg-amber-700 text-amber-500 hover:text-white px-3 py-1.5 rounded transition-colors text-sm font-bold disabled:opacity-50"
                       >
                         {buyingId === item.id ? <Loader2 className="animate-spin" size={14}/> : (
                           <>
                             <span>{item.price === 0 ? 'FREE' : item.price}</span>
                             {item.price > 0 && <Coins size={14} />}
                           </>
                         )}
                       </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  }
} 