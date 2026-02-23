'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useGameStore } from '@/store/useGameStore'
import { supabase } from '@/lib/supabase'
import PusherClient from 'pusher-js'

export default function GameControls({ gmType }: { gmType?: string }) { // 🌟 รับ gmType  
  const router = useRouter()
  const params = useParams()
  const roomId = params?.id as string

  const { isPaused, togglePause, myUsername } = useGameStore()

  const [voteActive, setVoteActive] = useState(false)
  const [yesVotes, setYesVotes] = useState(0)
  const [noVotes, setNoVotes] = useState(0)
  const [neededVotes, setNeededVotes] = useState(1)
  const [totalPlayers, setTotalPlayers] = useState(1)
  const [hasVoted, setHasVoted] = useState(false)
  const [isInitiator, setIsInitiator] = useState(false)

  const localClientId = useRef(Math.random().toString(36).substring(7))

  useEffect(() => {
    if (!roomId) return

    const fetchPlayerCount = async () => {
      const { count } = await supabase.from('room_players').select('*', { count: 'exact', head: true }).eq('room_id', roomId)
      const total = count || 1
      setTotalPlayers(total) 
      setNeededVotes(Math.floor(total / 2) + 1)
    }
    fetchPlayerCount()

    const pusher = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, { cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER! })
    const channel = pusher.subscribe(`room-${roomId}`)

    channel.bind('vote-event', (data: { action: string, senderId: string }) => {
      const { action, senderId } = data
      if (senderId === localClientId.current) return; 

      if (action === 'START') {
        setVoteActive(true); setYesVotes(1); setNoVotes(0); setHasVoted(false); setIsInitiator(false) 
      } else if (action === 'YES') {
        setYesVotes(prev => prev + 1)
      } else if (action === 'NO') {
        setNoVotes(prev => prev + 1)
      } else if (action === 'CANCEL') {
        setVoteActive(false); setHasVoted(false); setIsInitiator(false)
      }
    })

    return () => { pusher.unsubscribe(`room-${roomId}`); pusher.disconnect() }
  }, [roomId])

  useEffect(() => {
    if (!voteActive) return
    if (yesVotes >= neededVotes) {
      const saveGameAndExit = async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          const { data: room } = await supabase.from('rooms').select('host_id').eq('id', roomId).single();
          if (user && room && user.id === room.host_id) {
             const { error } = await supabase.from('rooms').update({ status: 'saved' }).eq('id', roomId);
             if (error) { console.error("❌ DB Save Error:", error); alert(`Save Failed: ${error.message}`); return; }
          }
          alert("✅ Game Saved successfully! Redirecting...");
          setVoteActive(false);
          router.push('/lobby'); 
        } catch (err: any) { console.error(err); }
      };
      saveGameAndExit();
    }
    else if (noVotes >= neededVotes || (yesVotes + noVotes === totalPlayers)) {
      setTimeout(() => { alert("❌ Vote failed! The adventure continues."); setVoteActive(false); }, 500)
    }
  }, [yesVotes, noVotes, neededVotes, totalPlayers, voteActive, router, roomId])

  const broadcastVote = async (action: string) => {
    try {
      await fetch('/api/pusher/vote', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ roomId, action, senderId: localClientId.current })
      })
    } catch (err) { console.error("Pusher error:", err) }
  }

  const handleStartVote = () => {
    setIsInitiator(true); setVoteActive(true); setYesVotes(1); setNoVotes(0); setHasVoted(true) 
    broadcastVote('START')
  }

  const handleVote = (choice: 'YES' | 'NO') => {
    if (hasVoted) return; setHasVoted(true) 
    if (choice === 'YES') setYesVotes(prev => prev + 1); if (choice === 'NO') setNoVotes(prev => prev + 1)
    broadcastVote(choice)
  }

  const handleCancelVote = () => {
    setVoteActive(false); setHasVoted(false); setIsInitiator(false); broadcastVote('CANCEL')
  }

  // 🌟 3. ฟังก์ชันสำหรับยิงดาเมจ/ฮีล (แก้ไขใหม่ ไม่ให้อัปเดตที่เครื่องตัวเองก่อน)
  const handleDebugStat = async (amount: number, type: 'damage' | 'heal') => {
    if (!myUsername) return;
    
    // ยิงเข้า Pusher ไปเลย แล้วเดี๋ยวไฟล์ ai_gm.ts จะเป็นคนรับ Event มาสั่งลดเลือดให้เองพร้อมๆ กันทุกคน (ตัวเราก็จะไม่โดนเบิ้ล 2 เท่า)
    await fetch('/api/pusher/party-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        roomId, 
        senderId: localClientId.current, 
        actionType: 'STAT_CHANGE',
        statData: { username: myUsername, amount, type }
      })
    }).catch(err => console.error(err));
  };

  return (
    <>
      <div className="flex flex-col gap-2 pointer-events-auto">
        <div className="flex gap-2">
          <button onClick={togglePause} className={`px-4 py-2 rounded-lg font-bold shadow-lg transition-all border text-sm flex items-center gap-2 ${
            isPaused ? 'bg-yellow-500 text-black border-yellow-400 animate-pulse' : 'bg-neutral-800/80 text-white border-white/20 hover:bg-neutral-700'
          }`}>
            {isPaused ? '▶ RESUME' : '⏸ PAUSE'}
          </button>
          <button onClick={handleStartVote} disabled={voteActive} className="px-4 py-2 bg-red-900/80 hover:bg-red-700 text-white rounded-lg font-bold shadow-lg border border-red-500 transition-all text-sm disabled:opacity-50">
            EXIT
          </button>
        </div>
        
        {/* 🌟 ซ่อนกล่อง Debug ทั้งหมดถ้าเป็นโหมด Human */}
        {gmType == 'ai' && (
          <div className="flex gap-1 p-2 bg-black/60 rounded-lg border border-gray-700 w-fit backdrop-blur-sm">
            <span className="text-[10px] text-gray-400 font-bold self-center mr-1">DEBUG:</span>
            <button onClick={() => handleDebugStat(-10, 'damage')} className="px-2 py-1 text-xs bg-red-950 hover:bg-red-800 text-red-200 border border-red-900 rounded">
              -10 HP
            </button>
            <button onClick={() => handleDebugStat(-50, 'damage')} className="px-2 py-1 text-xs bg-red-950 hover:bg-red-800 text-red-200 border border-red-900 rounded">
              -50 HP
            </button>
            <button onClick={() => handleDebugStat(20, 'heal')} className="px-2 py-1 text-xs bg-green-950 hover:bg-green-800 text-green-200 border border-green-900 rounded">
              +20 HP
            </button>
          </div>
        )}
      </div>

      {isPaused && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] pointer-events-auto">
          <div className="text-center">
            <h2 className="text-5xl font-black text-white mb-4 tracking-widest">PAUSED</h2>
            <p className="text-gray-400 mb-6">Game Master halted the session</p>
            <button onClick={togglePause} className="px-8 py-3 bg-white text-black font-bold rounded-full hover:scale-110 transition-transform">
              Resume Game
            </button>
          </div>
        </div>
      )}

      {voteActive && (
        <div className="fixed bottom-20 right-4 w-72 bg-neutral-900 border border-red-500 p-4 rounded-xl shadow-2xl z-[100] pointer-events-auto animate-bounce-in">
          <div className="flex justify-between items-center mb-4">
             <h3 className="text-red-500 font-bold uppercase text-xs">Vote to Exit</h3>
             {isInitiator && ( <button onClick={handleCancelVote} className="text-gray-500 hover:text-white text-xs">✖</button> )}
          </div>
          <div className="w-full bg-gray-700 h-2 rounded-full mb-2 overflow-hidden flex">
            <div className="bg-green-500 h-full transition-all duration-500" style={{ width: `${(yesVotes / neededVotes) * 50}%` }}></div>
            <div className="bg-red-500 h-full transition-all duration-500 ml-auto" style={{ width: `${(noVotes / neededVotes) * 50}%` }}></div>
          </div>
          <div className="flex justify-between text-xs text-gray-400 mb-4 font-mono">
            <span>YES: {yesVotes}/{neededVotes}</span>
            <span>NO: {noVotes}/{neededVotes}</span>
          </div>
          {!hasVoted ? (
             <div className="flex gap-2">
                <button onClick={() => handleVote('YES')} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded text-xs font-bold transition-all hover:scale-105">YES</button>
                <button onClick={() => handleVote('NO')} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded text-xs font-bold transition-all hover:scale-105">NO</button>
             </div>
          ) : (
             <div className="text-center text-xs text-yellow-500 font-bold p-2 bg-yellow-900/30 rounded border border-yellow-500/50">
                Waiting for others...
             </div>
          )}
        </div>
      )}
    </>
  )
}