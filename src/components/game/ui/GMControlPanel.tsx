'use client'
import { useState, useEffect } from 'react'
import { useGameStore, DiceType } from '@/store/useGameStore'
import { useParticipants } from '@livekit/components-react' 
import { Zap, Moon, Music, Volume2, ShieldAlert, Heart, Droplet, Dices, ChevronUp, ChevronDown, VolumeX } from 'lucide-react'
import { Cinzel } from 'next/font/google'

const cinzel = Cinzel({ subsets: ['latin'], weight: ['700'] });

// 🌟 1. รับ currentUserId เข้ามาด้วย เพื่อกันการส่งคำสั่งเบิ้ลเข้าตัวเอง
export default function GMControlPanel({ roomId, currentUserId }: { roomId: string, currentUserId: string }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { myUsername } = useGameStore();

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

  // 🌟 2. เปลี่ยน URL เป็น /api/pusher/game-event ให้หมด และใช้ senderId เป็น currentUserId
  const triggerEnv = (action: string) => {
    window.dispatchEvent(new CustomEvent('ai-fx', { detail: { action } }));
    fetch('/api/pusher/game-event', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId, senderId: currentUserId, actionType: 'ENV_FX', actionData: action })
    }).catch(err => console.error(err));
  };

  const triggerAudio = (type: 'play_bgm' | 'play_sfx', track: string) => {
    window.dispatchEvent(new CustomEvent('ai-audio', { detail: { type, track } }));
    fetch('/api/pusher/game-event', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId, senderId: currentUserId, actionType: 'AUDIO_FX', audioData: { type, track } })
    }).catch(err => console.error(err));
  };

  const triggerStatChange = (statType: 'hp' | 'mana', isDamage: boolean) => {
    if (!selectedPlayer && selectedPlayer !== 'ALL') return alert("Select a player first!");
    const finalAmount = isDamage ? -Math.abs(statAmount) : Math.abs(statAmount);

    if (selectedPlayer !== 'ALL') {
        useGameStore.getState().updatePlayerStat(selectedPlayer, statType, finalAmount);
    } else {
        players.forEach(p => useGameStore.getState().updatePlayerStat(p, statType, finalAmount));
    }

    fetch('/api/pusher/game-event', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        roomId, senderId: currentUserId, actionType: 'STAT_CHANGE',
        statData: { username: selectedPlayer, statType, amount: finalAmount }
      })
    }).catch(err => console.error(err));
  };

  const triggerDiceRoll = (diceType: DiceType) => {
    const targets = selectedPlayer === 'ALL' || !selectedPlayer ? ['ALL'] : [selectedPlayer];
    fetch('/api/pusher/game-event', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        roomId, senderId: currentUserId, actionType: 'FORCE_DICE',
        diceData: { diceType, targetPlayers: targets }
      })
    }).catch(err => console.error(err));
  };

  // ... (UI ด้านล่างใช้โค้ดเดิมได้เลยครับ ไม่ต้องแก้) ...
  return (
    <div className={`bg-[#1a0f0a]/95 border-2 border-red-900 rounded-lg shadow-[0_0_30px_rgba(220,38,38,0.2)] backdrop-blur-md w-[320px] md:w-[380px] transition-all duration-300 flex flex-col pointer-events-auto ${isExpanded ? 'h-[550px]' : 'h-12'}`}>
        <div className="flex justify-between items-center p-3 border-b border-red-900/50 bg-[#2a1d15] cursor-pointer hover:bg-[#3e2723] rounded-t-md transition-colors" onClick={() => setIsExpanded(!isExpanded)}>
            <div className={`${cinzel.className} text-red-500 font-bold uppercase tracking-widest flex items-center gap-2 text-sm`}><ShieldAlert size={16} /> Game Master Tools</div>
            {isExpanded ? <ChevronDown size={18} className="text-red-500" /> : <ChevronUp size={18} className="text-red-500" />}
        </div>
        {isExpanded && (
          <div className="p-4 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-5">
              <div>
                 <h4 className="text-[10px] text-[#a1887f] font-bold uppercase tracking-widest mb-2 border-b border-[#3e2723] pb-1">Environment FX</h4>
                 <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => triggerEnv('shake')} className="bg-[#c2410c]/20 hover:bg-[#c2410c] text-[#ea580c] hover:text-white border border-[#c2410c] p-2 rounded text-xs font-bold transition-colors flex items-center justify-center gap-1"><Zap size={14} /> Earthquake</button>
                    <button onClick={() => triggerEnv('dark_on')} className="bg-[#4c1d95]/20 hover:bg-[#4c1d95] text-[#8b5cf6] hover:text-white border border-[#4c1d95] p-2 rounded text-xs font-bold transition-colors flex items-center justify-center gap-1"><Moon size={14} /> Pitch Black</button>
                    <button onClick={() => triggerEnv('dark_off')} className="bg-gray-800/50 hover:bg-gray-700 text-gray-300 border border-gray-600 p-2 rounded text-xs font-bold transition-colors flex items-center justify-center gap-1 col-span-2">Restore Light</button>
                 </div>
              </div>
              <div>
                 <h4 className="text-[10px] text-[#a1887f] font-bold uppercase tracking-widest mb-2 border-b border-[#3e2723] pb-1 flex justify-between">
                    <span>Audio & Music</span>
                    <button onClick={() => triggerAudio('play_bgm', 'stop')} className="text-red-500 hover:text-white flex items-center gap-1 bg-red-950 px-1 rounded"><VolumeX size={10} /> Stop</button>
                 </h4>
                 <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => triggerAudio('play_bgm', 'tavern')} className="bg-blue-900/20 hover:bg-blue-900 text-blue-400 hover:text-white border border-blue-900 p-2 rounded text-[10px] font-bold transition-colors flex flex-col items-center gap-1"><Music size={12}/> Tavern</button>
                    <button onClick={() => triggerAudio('play_bgm', 'dungeon')} className="bg-blue-900/20 hover:bg-blue-900 text-blue-400 hover:text-white border border-blue-900 p-2 rounded text-[10px] font-bold transition-colors flex flex-col items-center gap-1"><Music size={12}/> Dungeon</button>
                    <button onClick={() => triggerAudio('play_bgm', 'rain')} className="bg-blue-900/20 hover:bg-blue-900 text-blue-400 hover:text-white border border-blue-900 p-2 rounded text-[10px] font-bold transition-colors flex flex-col items-center gap-1"><Music size={12}/> Rain</button>
                    <button onClick={() => triggerAudio('play_sfx', 'monster')} className="bg-purple-900/20 hover:bg-purple-900 text-purple-400 hover:text-white border border-purple-900 p-2 rounded text-[10px] font-bold transition-colors flex flex-col items-center gap-1"><Volume2 size={12}/> Monster</button>
                    <button onClick={() => triggerAudio('play_sfx', 'sword')} className="bg-purple-900/20 hover:bg-purple-900 text-purple-400 hover:text-white border border-purple-900 p-2 rounded text-[10px] font-bold transition-colors flex flex-col items-center gap-1"><Volume2 size={12}/> Sword</button>
                    <button onClick={() => triggerAudio('play_sfx', 'explosion')} className="bg-purple-900/20 hover:bg-purple-900 text-purple-400 hover:text-white border border-purple-900 p-2 rounded text-[10px] font-bold transition-colors flex flex-col items-center gap-1"><Volume2 size={12}/> Explosion</button>
                 </div>
              </div>
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
              <div>
                  <h4 className="text-[10px] text-[#a1887f] font-bold uppercase tracking-widest mb-2 border-b border-[#3e2723] pb-1">Force Roll (Dice)</h4>
                  <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => triggerDiceRoll('D20')} className="bg-yellow-900/30 hover:bg-yellow-900/80 text-yellow-500 border border-yellow-700/50 py-1.5 rounded text-xs flex items-center justify-center gap-1"><Dices size={12}/> D20</button>
                      <button onClick={() => triggerDiceRoll('D6')} className="bg-yellow-900/30 hover:bg-yellow-900/80 text-yellow-500 border border-yellow-700/50 py-1.5 rounded text-xs flex items-center justify-center gap-1"><Dices size={12}/> D6</button>
                  </div>
              </div>
          </div>
        )}
    </div>
  )
}