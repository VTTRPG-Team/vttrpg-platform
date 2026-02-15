'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Sword, Scroll, Users, PenTool, Sparkles } from 'lucide-react';
import { Cinzel, Crimson_Text } from 'next/font/google';

// Font Setup
const cinzel = Cinzel({ subsets: ['latin'], weight: ['700', '900'] });
const crimson = Crimson_Text({ subsets: ['latin'], weight: ['400', '600', '700'] });

export default function CreateLobbyPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [maxPlayers, setMaxPlayers] = useState('4');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name) return alert("Please name your adventure!");

    setLoading(true);
    
    // 1. หา User ปัจจุบัน
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        router.push('/auth/login');
        return;
    }

    // 2. สร้างห้องใน DB (Table: rooms)
    const { data: room, error } = await supabase
      .from('rooms')
      .insert([{ 
        name, 
        description: desc, 
        max_players: parseInt(maxPlayers),
        host_id: user.id,
        status: 'waiting' // เพิ่ม status เริ่มต้น
      }])
      .select()
      .single();

    if (error) {
        console.error(error);
        alert("Error creating room: " + error.message);
        setLoading(false);
        return;
    }

    if (room) {
      // 3. เอาตัวเองใส่เข้าไปในห้องฐานะคนแรก (Table: room_players)
      // อย่าลืมสร้าง Table 'room_players' ที่มี column: room_id, user_id, is_ready
      const { error: joinError } = await supabase
        .from('room_players')
        .insert([{ 
            room_id: room.id, 
            user_id: user.id 
        }]);
      
      if (joinError) {
          console.error(joinError);
      } else {
          // 4. ไปหน้า Waiting Room (เช่น /lobby/room/ID)
          router.push(`/lobby/room/${room.id}`);
      }
    }
    setLoading(false);
  };

  // Input Style: พื้นหลังดำจางๆ ขอบแดง/ทอง
  const inputStyle = `
    w-full p-4 rounded bg-black/50 border border-[#5d4037] 
    text-[#F4E4BC] placeholder-[#5d4037]
    focus:outline-none focus:border-red-500 focus:bg-black/70 focus:shadow-[0_0_15px_rgba(220,38,38,0.2)]
    transition-all font-sans text-lg
  `;

  // Label Style
  const labelStyle = `
    flex items-center gap-2 mb-2 text-[#a1887f] text-sm font-bold uppercase tracking-widest
  `;

  return (
    <div className={`min-h-screen flex items-center justify-center relative bg-black ${crimson.className}`}>
      
      {/* --- Background --- */}
      <div className="absolute inset-0 z-0">
        <img src="/dungeon_gate.jpg" alt="BG" className="w-full h-full object-cover opacity-30 blur-sm" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/40" />
      </div>

      {/* --- Main Card --- */}
      <div className="relative z-10 w-full max-w-2xl bg-[#1a120b] border-4 border-[#3e2723] rounded-lg shadow-2xl overflow-hidden animate-fade-in-up">
        
        {/* Decorations (มุมกรอบ) */}
        <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-red-900 rounded-tl-lg pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-red-900 rounded-tr-lg pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-red-900 rounded-bl-lg pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-red-900 rounded-br-lg pointer-events-none"></div>

        {/* --- Header --- */}
        <div className="bg-[#0f0a08] p-6 border-b-2 border-[#3e2723] flex justify-between items-center">
            <div>
                <h1 className={`${cinzel.className} text-3xl text-[#F4E4BC] font-bold uppercase tracking-wide flex items-center gap-3`}>
                    <Scroll className="text-red-600" size={32} /> Host A Game
                </h1>
                <p className="text-[#5d4037] text-xs uppercase tracking-widest mt-1">Forge your legend</p>
            </div>
            
            <Link href="/lobby">
              <button className="p-2 text-[#a1887f] hover:text-red-500 transition-colors rounded-full hover:bg-red-900/20">
                 <ArrowLeft size={24} />
              </button>
            </Link>
        </div>

        {/* --- Form Body --- */}
        <div className="p-8 space-y-6">
          
          {/* Campaign Name */}
          <div>
            <label className={labelStyle}>
                <PenTool size={16} /> Campaign Title
            </label>
            <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                className={inputStyle} 
                placeholder="e.g. The Tomb of Horrors" 
                autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className={labelStyle}>
                <Scroll size={16} /> Quest Briefing
            </label>
            <textarea 
                rows={4} 
                value={desc} 
                onChange={e => setDesc(e.target.value)} 
                className={inputStyle} 
                placeholder="Describe the adventure context..." 
            />
          </div>

          {/* Player Count Slider/Input */}
          <div>
             <label className={labelStyle}>
                <Users size={16} /> Max Party Size
            </label>
            <div className="flex items-center gap-4">
                <input 
                    type="range" 
                    min="2" max="8" 
                    value={maxPlayers} 
                    onChange={e => setMaxPlayers(e.target.value)}
                    className="flex-1 accent-red-600 h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer"
                />
                <div className="w-16 h-12 flex items-center justify-center bg-black border border-red-900/50 rounded text-2xl font-bold text-red-500 font-mono">
                    {maxPlayers}
                </div>
            </div>
          </div>

          {/* Create Button */}
          <div className="pt-6">
            <button 
              onClick={handleCreate}
              disabled={loading}
              className={`
                w-full py-4 rounded
                bg-gradient-to-r from-red-900 via-red-800 to-red-900
                border border-red-600/50
                text-[#F4E4BC] font-bold text-xl uppercase tracking-[0.2em]
                hover:shadow-[0_0_20px_rgba(220,38,38,0.6)] hover:border-red-400 hover:text-white
                active:scale-[0.98] transition-all
                flex items-center justify-center gap-3
                ${loading ? 'opacity-70 cursor-not-allowed' : ''}
              `}
            >
              {loading ? (
                  <><Sparkles className="animate-spin" /> Summoning Room...</>
              ) : (
                  <><Sword size={24} /> Begin Adventure</>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}