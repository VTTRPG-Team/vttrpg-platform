'use client'
import { useState, useRef, useEffect } from 'react'
import { useGameStore, DiceType } from '@/store/useGameStore'
import { useParticipants } from '@livekit/components-react' 
import { Zap, Moon, Music, Volume2, ShieldAlert, Heart, Droplet, Dices, ChevronUp, ChevronDown, VolumeX, Upload, Map, CircleUserRound, Trash2 } from 'lucide-react'
import { Cinzel } from 'next/font/google'
import { supabase } from '@/lib/supabase'

const cinzel = Cinzel({ subsets: ['latin'], weight: ['700'] });

export default function GMControlPanel({ roomId, currentUserId }: { roomId: string, currentUserId: string }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<'tools' | 'assets'>('tools');
  
  const { myUsername } = useGameStore();
  const localClientId = useRef(Math.random().toString(36).substring(7));

  // --- ดึงรายชื่อผู้เล่นจากคนที่เปิดกล้อง/ไมค์ ---
  const participants = useParticipants();
  const [players, setPlayers] = useState<string[]>([]);
  useEffect(() => {
    const activePlayers = participants
      .map(p => p.name)
      .filter((name): name is string => !!name && name !== myUsername && name !== 'Unknown');
    setPlayers(activePlayers);
  }, [participants, myUsername]);

  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [statAmount, setStatAmount] = useState<number>(10);

  // =====================================
  // 🎭 ฟังก์ชันควบคุม (Tools)
  // =====================================
  const triggerEnv = (action: string) => {
    window.dispatchEvent(new CustomEvent('ai-fx', { detail: { action } }));
    fetch('/api/pusher/game-event', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ roomId, senderId: currentUserId, actionType: 'ENV_FX', actionData: action }) }).catch(err => console.error(err));
  };

  const triggerAudio = (type: 'play_bgm' | 'play_sfx', track: string) => {
    window.dispatchEvent(new CustomEvent('ai-audio', { detail: { type, track } }));
    fetch('/api/pusher/game-event', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ roomId, senderId: currentUserId, actionType: 'AUDIO_FX', audioData: { type, track } }) }).catch(err => console.error(err));
  };

  const triggerStatChange = (statType: 'hp' | 'mana', isDamage: boolean) => {
    if (!selectedPlayer && selectedPlayer !== 'ALL') return alert("Select a player first!");
    const finalAmount = isDamage ? -Math.abs(statAmount) : Math.abs(statAmount);

    if (statType === 'hp') {
        const damageType = finalAmount < 0 ? 'damage' : 'heal';
        if (selectedPlayer !== 'ALL') { 
            useGameStore.getState().triggerStatChange(selectedPlayer, finalAmount, damageType); 
        } else { 
            players.forEach(p => useGameStore.getState().triggerStatChange(p, finalAmount, damageType)); 
        }
    } else {
        if (selectedPlayer !== 'ALL') { 
            useGameStore.getState().updatePlayerStat(selectedPlayer, statType, finalAmount); 
        } else { 
            players.forEach(p => useGameStore.getState().updatePlayerStat(p, statType, finalAmount)); 
        }
    }

    fetch('/api/pusher/game-event', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ roomId, senderId: currentUserId, actionType: 'STAT_CHANGE', statData: { username: selectedPlayer, statType, amount: finalAmount }}) }).catch(err => console.error(err));
  };

  const triggerDiceRoll = (diceType: DiceType) => {
    const targets = selectedPlayer === 'ALL' || !selectedPlayer ? ['ALL'] : [selectedPlayer];
    useGameStore.getState().triggerDiceRollEvent(diceType, targets);
    fetch('/api/pusher/game-event', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ roomId, senderId: currentUserId, actionType: 'FORCE_DICE', diceData: { diceType, targetPlayers: targets }}) }).catch(err => console.error(err));
  };

  // =====================================
  // 🖼️ ฟังก์ชันอัปโหลดรูป (Assets)
  // =====================================
  const [assets, setAssets] = useState<{name: string, url: string}[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const fetchAssets = async () => {
    const { data, error } = await supabase.storage.from('gm-assets').list(roomId);
    if (data) {
      const urls = data.map(file => {
        const { data: { publicUrl } } = supabase.storage.from('gm-assets').getPublicUrl(`${roomId}/${file.name}`);
        return { name: file.name, url: publicUrl };
      });
      setAssets(urls);
    }
  };

  useEffect(() => { if (activeTab === 'assets') fetchAssets(); }, [activeTab, roomId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
    const filePath = `${roomId}/${fileName}`;
    const { error } = await supabase.storage.from('gm-assets').upload(filePath, file);
    if (error) alert("Upload failed: " + error.message);
    else fetchAssets();
    setIsUploading(false);
  };

  const handleSetMap = async (url: string) => {
    await supabase.from('rooms').update({ board_image_url: url }).eq('id', roomId);
    alert("Map updated!");
  };

  const handleSpawnToken = async (url: string) => {
    const tokenData = { id: `token-${Date.now()}`, url, x: 0, z: 0 }; 
    useGameStore.getState().addToken(tokenData); 
    fetch('/api/pusher/game-event', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ roomId, senderId: currentUserId, actionType: 'SPAWN_TOKEN', tokenData }) }).catch(err => console.error(err));
  };

  // =====================================
  // 🎨 UI Rendering
  // =====================================
  return (
    <div className={`bg-[#1a0f0a]/95 border-2 border-red-900 rounded-lg shadow-[0_0_30px_rgba(220,38,38,0.2)] backdrop-blur-md w-[320px] md:w-[380px] transition-all duration-300 flex flex-col pointer-events-auto ${isExpanded ? 'h-[550px]' : 'h-12'}`}>
        
        {/* --- Header --- */}
        <div className="flex justify-between items-center p-3 border-b border-red-900/50 bg-[#2a1d15] cursor-pointer hover:bg-[#3e2723] rounded-t-md transition-colors" onClick={() => setIsExpanded(!isExpanded)}>
            <div className={`${cinzel.className} text-red-500 font-bold uppercase tracking-widest flex items-center gap-2 text-sm`}><ShieldAlert size={16} /> Game Master Tools</div>
            {isExpanded ? <ChevronDown size={18} className="text-red-500" /> : <ChevronUp size={18} className="text-red-500" />}
        </div>

        {/* --- Body --- */}
        {isExpanded && (
          <div className="flex flex-col h-full overflow-hidden">
             
             {/* --- TABS --- */}
             <div className="flex border-b border-[#3e2723]">
                <button onClick={() => setActiveTab('tools')} className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'tools' ? 'bg-red-900/40 text-red-400 border-b-2 border-red-500' : 'text-[#a1887f] hover:bg-[#3e2723]'}`}>🎮 Controls</button>
                <button onClick={() => setActiveTab('assets')} className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'assets' ? 'bg-blue-900/40 text-blue-400 border-b-2 border-blue-500' : 'text-[#a1887f] hover:bg-[#3e2723]'}`}>🖼️ Assets</button>
             </div>

             {/* ================================== */}
             {/* 🌟 TAB 1: TOOLS (เครื่องมือเดิมทั้งหมด) */}
             {/* ================================== */}
             {activeTab === 'tools' && (
                <div className="p-4 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-4 pb-12">
                  
                  {/* 1. Environment */}
                  <div>
                    <h4 className="text-[10px] text-[#a1887f] font-bold uppercase tracking-widest mb-2 border-b border-[#3e2723] pb-1">Environment FX</h4>
                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => triggerEnv('shake')} className="bg-[#c2410c]/20 hover:bg-[#c2410c] text-[#ea580c] hover:text-white border border-[#c2410c] p-2 rounded text-xs font-bold transition-colors flex items-center justify-center gap-1"><Zap size={14} /> Earthquake</button>
                        <button onClick={() => triggerEnv('dark_on')} className="bg-[#4c1d95]/20 hover:bg-[#4c1d95] text-[#8b5cf6] hover:text-white border border-[#4c1d95] p-2 rounded text-xs font-bold transition-colors flex items-center justify-center gap-1"><Moon size={14} /> Pitch Black</button>
                        <button onClick={() => triggerEnv('dark_off')} className="bg-gray-800/50 hover:bg-gray-700 text-gray-300 border border-gray-600 p-2 rounded text-xs font-bold transition-colors col-span-2">Restore Light</button>
                    </div>
                  </div>

                  {/* 2. Audio */}
                  <div>
                     <h4 className="text-[10px] text-[#a1887f] font-bold uppercase tracking-widest mb-2 border-b border-[#3e2723] pb-1 flex justify-between">
                        <span>Audio & Music</span>
                        <button onClick={() => triggerAudio('play_bgm', 'stop')} className="text-red-500 hover:text-white flex items-center gap-1 bg-red-950 px-1 rounded"><VolumeX size={10} /> Stop</button>
                     </h4>
                     <div className="grid grid-cols-3 gap-2 mb-2">
                        <button onClick={() => triggerAudio('play_bgm', 'tavern')} className="bg-blue-900/20 hover:bg-blue-900 text-blue-400 hover:text-white border border-blue-900 p-2 rounded text-[10px] font-bold transition-colors flex flex-col items-center gap-1"><Music size={12}/> Tavern</button>
                        <button onClick={() => triggerAudio('play_bgm', 'dungeon')} className="bg-blue-900/20 hover:bg-blue-900 text-blue-400 hover:text-white border border-blue-900 p-2 rounded text-[10px] font-bold transition-colors flex flex-col items-center gap-1"><Music size={12}/> Dungeon</button>
                        <button onClick={() => triggerAudio('play_bgm', 'rain')} className="bg-blue-900/20 hover:bg-blue-900 text-blue-400 hover:text-white border border-blue-900 p-2 rounded text-[10px] font-bold transition-colors flex flex-col items-center gap-1"><Music size={12}/> Rain</button>
                     </div>
                     <div className="grid grid-cols-4 gap-2">
                        <button onClick={() => triggerAudio('play_sfx', 'monster')} className="bg-purple-900/20 hover:bg-purple-900 text-purple-400 hover:text-white border border-purple-900 p-2 rounded text-[10px] font-bold transition-colors flex flex-col items-center gap-1"><Volume2 size={12}/> Monster</button>
                        <button onClick={() => triggerAudio('play_sfx', 'sword')} className="bg-purple-900/20 hover:bg-purple-900 text-purple-400 hover:text-white border border-purple-900 p-2 rounded text-[10px] font-bold transition-colors flex flex-col items-center gap-1"><Volume2 size={12}/> Sword</button>
                        <button onClick={() => triggerAudio('play_sfx', 'explosion')} className="bg-purple-900/20 hover:bg-purple-900 text-purple-400 hover:text-white border border-purple-900 p-2 rounded text-[10px] font-bold transition-colors flex flex-col items-center gap-1"><Volume2 size={12}/> Explode</button>
                        <button onClick={() => triggerAudio('play_sfx', 'magic')} className="bg-purple-900/20 hover:bg-purple-900 text-purple-400 hover:text-white border border-purple-900 p-2 rounded text-[10px] font-bold transition-colors flex flex-col items-center gap-1"><Zap size={12}/> Magic</button>
                     </div>
                  </div>

                  {/* 3. Player Stats */}
                  <div>
                    <h4 className="text-[10px] text-[#a1887f] font-bold uppercase tracking-widest mb-2 border-b border-[#3e2723] pb-1">Target Player</h4>
                    <select value={selectedPlayer} onChange={(e) => setSelectedPlayer(e.target.value)} className="w-full bg-[#0f0a08] border border-[#5d4037] text-[#F4E4BC] text-sm p-2 rounded focus:outline-none focus:border-red-500 mb-2">
                        <option value="">-- Select Target --</option>
                        <option value="ALL">ALL PLAYERS (AOE)</option>
                        {players.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] text-[#a1887f] font-bold uppercase">Amount:</span>
                        <input type="number" min="1" value={statAmount} onChange={(e) => setStatAmount(Number(e.target.value))} className="bg-black border border-[#5d4037] text-white text-sm px-2 py-1 rounded w-20 focus:border-red-500 outline-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => triggerStatChange('hp', true)} className="bg-red-950 hover:bg-red-800 text-red-200 border border-red-900 py-1.5 rounded text-xs flex items-center justify-center gap-1"><Heart size={12}/> - HP</button>
                        <button onClick={() => triggerStatChange('hp', false)} className="bg-green-950 hover:bg-green-800 text-green-200 border border-green-900 py-1.5 rounded text-xs flex items-center justify-center gap-1"><Heart size={12}/> + HP</button>
                        <button onClick={() => triggerStatChange('mana', true)} className="bg-blue-950 hover:bg-blue-800 text-blue-200 border border-blue-900 py-1.5 rounded text-xs flex items-center justify-center gap-1"><Droplet size={12}/> - Mana</button>
                        <button onClick={() => triggerStatChange('mana', false)} className="bg-cyan-950 hover:bg-cyan-800 text-cyan-200 border border-cyan-900 py-1.5 rounded text-xs flex items-center justify-center gap-1"><Droplet size={12}/> + Mana</button>
                    </div>
                  </div>

                  {/* 4. Force Dice */}
                  <div>
                      <h4 className="text-[10px] text-[#a1887f] font-bold uppercase tracking-widest mb-2 border-b border-[#3e2723] pb-1"><Dices size={12} className="inline mr-1" /> Force Roll (Dice)</h4>
                      <div className="grid grid-cols-4 gap-2">
                          <button onClick={() => triggerDiceRoll('D4')} className="bg-yellow-900/30 hover:bg-yellow-900/80 text-yellow-500 border border-yellow-700/50 py-1.5 rounded text-xs font-bold">D4</button>
                          <button onClick={() => triggerDiceRoll('D6')} className="bg-yellow-900/30 hover:bg-yellow-900/80 text-yellow-500 border border-yellow-700/50 py-1.5 rounded text-xs font-bold">D6</button>
                          <button onClick={() => triggerDiceRoll('D8')} className="bg-yellow-900/30 hover:bg-yellow-900/80 text-yellow-500 border border-yellow-700/50 py-1.5 rounded text-xs font-bold">D8</button>
                          <button onClick={() => triggerDiceRoll('D10')} className="bg-yellow-900/30 hover:bg-yellow-900/80 text-yellow-500 border border-yellow-700/50 py-1.5 rounded text-xs font-bold">D10</button>
                          <button onClick={() => triggerDiceRoll('D12')} className="bg-yellow-900/30 hover:bg-yellow-900/80 text-yellow-500 border border-yellow-700/50 py-1.5 rounded text-xs font-bold">D12</button>
                          <button onClick={() => triggerDiceRoll('D20')} className="bg-yellow-900/30 hover:bg-yellow-900/80 text-yellow-500 border border-yellow-700/50 py-1.5 rounded text-xs font-bold">D20</button>
                          <button onClick={() => triggerDiceRoll('D100')} className="bg-yellow-900/30 hover:bg-yellow-900/80 text-yellow-500 border border-yellow-700/50 py-1.5 rounded text-xs font-bold col-span-2">D100</button>
                      </div>
                  </div>
                </div>
             )}

             {/* ================================== */}
             {/* 🌟 TAB 2: ASSETS (ระบบอัปโหลดรูปและเหรียญ) */}
             {/* ================================== */}
             {activeTab === 'assets' && (
                <div className="p-4 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-4 pb-12">
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-blue-500/50 rounded-lg cursor-pointer bg-blue-950/20 hover:bg-blue-900/30 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          {isUploading ? <Zap className="w-8 h-8 mb-2 text-blue-500 animate-bounce" /> : <Upload className="w-8 h-8 mb-2 text-blue-500" />}
                          <p className="text-xs text-blue-300 font-bold uppercase tracking-widest">{isUploading ? 'Uploading...' : 'Upload Asset'}</p>
                      </div>
                      <input type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={isUploading} />
                  </label>

                  <div className="grid grid-cols-2 gap-3 mt-2">
                    {assets.map((asset, idx) => (
                      <div key={idx} className="relative group bg-black border border-[#5d4037] rounded-lg overflow-hidden flex flex-col">
                         <div className="h-24 w-full bg-[#1a0f0a] flex items-center justify-center">
                            <img src={asset.url} alt="asset" className="max-h-full max-w-full object-contain" />
                         </div>
                         <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity p-2">
                            <button onClick={() => handleSetMap(asset.url)} className="w-full bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold py-1.5 rounded flex items-center justify-center gap-1"><Map size={12}/> Set Map</button>
                            <button onClick={() => handleSpawnToken(asset.url)} className="w-full bg-green-600 hover:bg-green-500 text-white text-[10px] font-bold py-1.5 rounded flex items-center justify-center gap-1"><CircleUserRound size={12}/> Spawn Token</button>
                         </div>
                      </div>
                    ))}
                  </div>
                  {/* 🌟 เพิ่มปุ่มเคลียร์กระดานตรงนี้ครับ */}
                  <button onClick={() => {
                      useGameStore.getState().clearTokens();
                      fetch('/api/pusher/game-event', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ roomId, senderId: currentUserId, actionType: 'CLEAR_TOKENS' }) });
                  }} className="mt-2 w-full bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800 py-2.5 rounded text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors">
                      <Trash2 size={14} /> Clear All Tokens
                  </button>

                </div>
             )}

          </div>
        )}
    </div>
  )
}