'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CreateLobbyPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [maxPlayers, setMaxPlayers] = useState('4');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    // 1. หา User ปัจจุบัน
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 2. สร้างห้องใน DB
    const { data: room, error } = await supabase
      .from('rooms')
      .insert([{ 
        name, 
        description: desc, 
        max_players: parseInt(maxPlayers),
        host_id: user.id 
      }])
      .select()
      .single();

    if (!error && room) {
      // 3. เอาตัวเองใส่เข้าไปในห้องฐานะคนแรก
      await supabase.from('room_players').insert([{ room_id: room.id, user_id: user.id }]);
      // 4. ไปหน้า Waiting Room
      router.push(`/lobby/wait/${room.id}`);
    }
    setLoading(false);
  };

  // Input Style ให้เหมือนช่องในเกม
  const inputStyle = "w-full p-3 rounded bg-white/90 border-2 border-[#5A2D0C] text-[#3e2723] focus:outline-none focus:border-[#F4E4BC] font-sans font-bold";

  return (
    <div className="min-h-screen bg-[url('/images/dungeon-bg.jpg')] bg-cover flex items-center justify-center font-mono">
      <div className="absolute inset-0 bg-black/60"></div>

      {/* Main Modal Box */}
      <div className="relative z-10 w-full max-w-2xl bg-[#5A2D0C]/80 p-8 rounded-lg border-4 border-[#8B4513] shadow-2xl backdrop-blur-sm">
        
        {/* Header & Exit */}
        <div className="flex justify-between items-center mb-6">
           <h1 className="text-3xl text-[#F4E4BC] font-bold drop-shadow-md">Create Lobby</h1>
           <Link href="/lobby">
             <button className="px-4 py-2 bg-[#3e1e08] border border-[#F4E4BC] text-[#F4E4BC] hover:bg-red-900 rounded">EXIT</button>
           </Link>
        </div>

        <div className="space-y-4 text-[#F4E4BC]">
          
          <div>
            <label className="block mb-1 text-lg font-bold shadow-black drop-shadow-md">Adventure Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className={inputStyle} placeholder="The Lost Mine..." />
          </div>

          <div>
            <label className="block mb-1 text-lg font-bold drop-shadow-md">Player Amount</label>
            <input type="number" value={maxPlayers} onChange={e => setMaxPlayers(e.target.value)} className={inputStyle} min={1} max={10} />
          </div>

          <div>
            <label className="block mb-1 text-lg font-bold drop-shadow-md">Description</label>
            <textarea rows={3} value={desc} onChange={e => setDesc(e.target.value)} className={inputStyle} placeholder="Short story..." />
          </div>

          <div className="pt-4 flex justify-end">
            <button 
              onClick={handleCreate}
              disabled={loading}
              className="px-8 py-4 bg-[#8B4513] border-4 border-[#F4E4BC] text-[#F4E4BC] text-2xl font-bold uppercase hover:bg-[#a05a2c] active:translate-y-1 transition-all"
            >
              {loading ? 'Creating...' : 'START'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}