'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Sword, Scroll, Users, PenTool, Sparkles, Archive, X, Bot, UserCog } from 'lucide-react';
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
  
  // 🌟 State ใหม่: เลือกว่าใครเป็น GM (ค่าเริ่มต้นเป็น 'ai')
  const [gmType, setGmType] = useState<'ai' | 'human'>('ai');

  const [showLoadModal, setShowLoadModal] = useState(false);
  const [savedGames, setSavedGames] = useState<any[]>([]);
  const [loadingGames, setLoadingGames] = useState(false);

  const handleCreate = async () => {
    if (!name) return alert("Please name your adventure!");

    setLoading(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        router.push('/auth/login');
        return;
    }

    // 🌟 ส่งค่า gm_type เข้าไปบันทึกด้วย
    const { data: room, error } = await supabase
      .from('rooms')
      .insert([{ 
        name, 
        description: desc, 
        max_players: parseInt(maxPlayers),
        host_id: user.id,
        status: 'waiting',
        gm_type: gmType // <-- ส่งค่านี้ไปให้ Supabase (ต้องไปเพิ่ม Column `gm_type` ใน Table `rooms` ด้วยนะ!)
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
      const { error: joinError } = await supabase
        .from('room_players')
        .insert([{ room_id: room.id, user_id: user.id }]);
      
      if (joinError) console.error(joinError);
      else router.push(`/lobby/wait/${room.id}`);
    }
    setLoading(false);
  };

  const fetchSavedGames = async () => {
    setShowLoadModal(true);
    setLoadingGames(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase
        .from('rooms')
        .select('id, name, description, created_at')
        .eq('host_id', user.id)
        .eq('status', 'saved')
        .order('created_at', { ascending: false });

      if (error) console.error("Error fetching saved games:", error);
      if (data) setSavedGames(data);
    }
    setLoadingGames(false);
  };

  const inputStyle = `
    w-full p-4 rounded bg-black/50 border border-[#5d4037] 
    text-[#F4E4BC] placeholder-[#5d4037]
    focus:outline-none focus:border-red-500 focus:bg-black/70 focus:shadow-[0_0_15px_rgba(220,38,38,0.2)]
    transition-all font-sans text-lg
  `;

  const labelStyle = `
    flex items-center gap-2 mb-2 text-[#a1887f] text-sm font-bold uppercase tracking-widest
  `;

  const handleLoadGame = async (gameId: string) => {
    setLoadingGames(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      await supabase.from('room_players').delete().eq('room_id', gameId).neq('user_id', user.id);
      const { error: updateErr } = await supabase.from('room_players').update({ is_ready: false }).eq('room_id', gameId).eq('user_id', user.id);
      
      if (updateErr) {
         await supabase.from('room_players').insert([{ room_id: gameId, user_id: user.id }]);
      }
      
      await supabase.from('rooms').update({ status: 'waiting' }).eq('id', gameId);
      router.push(`/lobby/wait/${gameId}`);
    }
    setLoadingGames(false);
  };

  return (
    <div className={`min-h-screen flex items-center justify-center relative bg-black ${crimson.className}`}>
      
      <div className="absolute inset-0 z-0">
        <img src="/dungeon_gate.jpg" alt="BG" className="w-full h-full object-cover opacity-30 blur-sm" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/40" />
      </div>

      <div className="relative z-10 w-full max-w-2xl bg-[#1a120b] border-4 border-[#3e2723] rounded-lg shadow-2xl overflow-hidden animate-fade-in-up mt-8 mb-8">
        
        <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-red-900 rounded-tl-lg pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-red-900 rounded-tr-lg pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-red-900 rounded-bl-lg pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-red-900 rounded-br-lg pointer-events-none"></div>

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

        <div className="p-8 space-y-6">
          
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

          {/* 🌟 THE NEW FEATURE: เลือกประเภท GM */}
          <div>
            <label className={labelStyle}>
              <UserCog size={16} /> Game Master Type
            </label>
            <div className="grid grid-cols-2 gap-4 mt-2">
              
              {/* Option 1: AI GM */}
              <button
                onClick={() => setGmType('ai')}
                className={`relative flex flex-col items-center justify-center p-4 border-2 rounded-lg transition-all duration-300 ${
                  gmType === 'ai' 
                    ? 'bg-blue-900/40 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
                    : 'bg-black/50 border-[#3e2723] hover:border-blue-500/50 hover:bg-blue-900/10'
                }`}
              >
                {gmType === 'ai' && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>}
                <Bot size={32} className={`mb-2 ${gmType === 'ai' ? 'text-blue-400' : 'text-[#5d4037]'}`} />
                <span className={`font-bold uppercase tracking-wider text-sm ${gmType === 'ai' ? 'text-blue-100' : 'text-[#a1887f]'}`}>AI Storyteller</span>
                <span className={`text-[10px] text-center mt-1 ${gmType === 'ai' ? 'text-blue-300/70' : 'text-[#5d4037]'}`}>Gemini handles the narrative</span>
              </button>

              {/* Option 2: Human GM */}
              <button
                onClick={() => setGmType('human')}
                className={`relative flex flex-col items-center justify-center p-4 border-2 rounded-lg transition-all duration-300 ${
                  gmType === 'human' 
                    ? 'bg-red-900/40 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' 
                    : 'bg-black/50 border-[#3e2723] hover:border-red-500/50 hover:bg-red-900/10'
                }`}
              >
                {gmType === 'human' && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-400 animate-pulse"></div>}
                <UserCog size={32} className={`mb-2 ${gmType === 'human' ? 'text-red-400' : 'text-[#5d4037]'}`} />
                <span className={`font-bold uppercase tracking-wider text-sm ${gmType === 'human' ? 'text-red-100' : 'text-[#a1887f]'}`}>You are the GM</span>
                <span className={`text-[10px] text-center mt-1 ${gmType === 'human' ? 'text-red-300/70' : 'text-[#5d4037]'}`}>Control the game manually</span>
              </button>

            </div>
          </div>

          <div>
             <label className={labelStyle}>
                <Users size={16} /> Max Party Size (Including GM)
            </label>
            <div className="flex items-center gap-4">
                <input 
                    type="range" 
                    min="2" max="8" // 🌟 แนะนำให้ขั้นต่ำเป็น 2 (GM 1 + Player 1)
                    value={maxPlayers} 
                    onChange={e => setMaxPlayers(e.target.value)}
                    className="flex-1 accent-red-600 h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer"
                />
                <div className="w-16 h-12 flex items-center justify-center bg-black border border-red-900/50 rounded text-2xl font-bold text-red-500 font-mono">
                    {maxPlayers}
                </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex flex-col gap-3">
            <button 
              onClick={handleCreate}
              disabled={loading}
              className={`
                w-full py-4 rounded bg-gradient-to-r from-red-900 via-red-800 to-red-900
                border border-red-600/50 text-[#F4E4BC] font-bold text-xl uppercase tracking-[0.2em]
                hover:shadow-[0_0_20px_rgba(220,38,38,0.6)] hover:border-red-400 hover:text-white
                active:scale-[0.98] transition-all flex items-center justify-center gap-3
                ${loading ? 'opacity-70 cursor-not-allowed' : ''}
              `}
            >
              {loading ? (
                  <><Sparkles className="animate-spin" /> Summoning Room...</>
              ) : ( 
                  <><Sword size={24} /> Begin Adventure</>
              )}
            </button>

            <button 
              onClick={fetchSavedGames}
              className="w-full py-3 rounded bg-black/40 border border-[#5d4037]/50 text-[#a1887f] font-bold text-sm uppercase tracking-widest hover:bg-[#3e2723]/40 hover:text-[#F4E4BC] hover:border-[#a1887f] transition-all flex items-center justify-center gap-2"
            >
              <Archive size={18} /> Load Saved Adventure
            </button>
          </div>

        </div>
      </div>

      {/* ========================================== */}
      {/* 🌟 POP-UP (MODAL) สำหรับ LOAD GAME */}
      {/* ========================================== */}
      {showLoadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowLoadModal(false)}></div>
          
          <div className="relative bg-[#1a120b] border-2 border-[#5d4037] rounded-lg shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up">
            <div className="bg-[#0f0a08] p-4 border-b border-[#3e2723] flex justify-between items-center">
              <h2 className={`${cinzel.className} text-xl text-[#F4E4BC] font-bold flex items-center gap-2`}>
                <Archive className="text-yellow-600" size={20} /> Your Saved Epics
              </h2>
              <button onClick={() => setShowLoadModal(false)} className="text-gray-500 hover:text-red-500 transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="p-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {loadingGames ? (
                <div className="text-center py-8 text-[#a1887f] animate-pulse">Loading chronicles...</div>
              ) : savedGames.length === 0 ? (
                <div className="text-center py-8 text-[#5d4037]">No saved adventures found in your history.</div>
              ) : (
                <div className="space-y-3">
                  {savedGames.map((game) => (
                    <div 
                      key={game.id} 
                      onClick={() => handleLoadGame(game.id)}
                      className="group p-4 bg-black/40 border border-[#3e2723] rounded hover:border-red-800 hover:bg-red-900/10 cursor-pointer transition-all"
                    >
                      <h3 className="text-lg text-[#F4E4BC] font-bold group-hover:text-red-400">{game.name || 'Untitled Campaign'}</h3>
                      <p className="text-xs text-[#5d4037] mt-1 line-clamp-1">{game.description || 'No description'}</p>
                      <div className="text-[10px] text-gray-600 mt-2 font-mono">
                        Saved on: {new Date(game.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}