'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useGameStore } from '@/store/useGameStore'
import { supabase } from '@/lib/supabase'
import PusherClient from 'pusher-js'

export default function GameControls() {
  const router = useRouter()
  const params = useParams()
  const roomId = params?.id as string

  const { isPaused, togglePause } = useGameStore()

  // --- Realtime Vote States ---
  const [voteActive, setVoteActive] = useState(false)
  const [yesVotes, setYesVotes] = useState(0)
  const [noVotes, setNoVotes] = useState(0)
  const [neededVotes, setNeededVotes] = useState(1)
  const [totalPlayers, setTotalPlayers] = useState(1) // 🌟 เพิ่มตัวแปรนับคนทั้งหมด
  const [hasVoted, setHasVoted] = useState(false)
  const [isInitiator, setIsInitiator] = useState(false) // 🌟 จำว่าเราเป็นคนเริ่มโหวตไหม

  const localClientId = useRef(Math.random().toString(36).substring(7))

  // 1. Setup Pusher & Realtime Listener
  useEffect(() => {
    if (!roomId) return

    const fetchPlayerCount = async () => {
      const { count } = await supabase
        .from('room_players')
        .select('*', { count: 'exact', head: true })
        .eq('room_id', roomId)
      
      const total = count || 1
      setTotalPlayers(total) // เก็บจำนวนคนทั้งหมดไว้
      setNeededVotes(Math.floor(total / 2) + 1)
    }
    fetchPlayerCount()

    const pusher = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    })

    const channel = pusher.subscribe(`room-${roomId}`)

    channel.bind('vote-event', (data: { action: string, senderId: string }) => {
      const { action, senderId } = data
      
      if (senderId === localClientId.current) {
         return; // เมินสัญญาณตัวเอง
      }

      if (action === 'START') {
        setVoteActive(true)
        setYesVotes(1) 
        setNoVotes(0)
        setHasVoted(false) 
        setIsInitiator(false) // 🌟 เราไม่ใช่คนเริ่มโหวต
      } else if (action === 'YES') {
        setYesVotes(prev => prev + 1)
      } else if (action === 'NO') {
        setNoVotes(prev => prev + 1)
      } else if (action === 'CANCEL') {
        setVoteActive(false)
        setHasVoted(false)
        setIsInitiator(false)
      }
    })

    return () => {
      pusher.unsubscribe(`room-${roomId}`)
      pusher.disconnect()
    }
  }, [roomId])

  // 2. เช็คผลโหวต
  useEffect(() => {
    if (!voteActive) return
    
    // เคส 1: โหวต YES ชนะขาดลอย (โหวตออกสำเร็จ)
    if (yesVotes >= neededVotes) {
      // 🌟 สร้างฟังก์ชัน async เพื่อรอให้เซฟเสร็จก่อน ค่อยเด้งออก
      const saveGameAndExit = async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          const { data: room } = await supabase.from('rooms').select('host_id').eq('id', roomId).single();
          
          if (user && room && user.id === room.host_id) {
             // 🌟 ลองอัปเดตแค่ status ดูก่อน (ใช้ตัวเล็ก 'saved' ปลอดภัยสุด)
             const { error } = await supabase.from('rooms').update({ 
                status: 'saved' 
             }).eq('id', roomId);

             if (error) {
                console.error("❌ DB Save Error:", error);
                alert(`Save Failed! ฐานข้อมูลฟ้องว่า: ${error.message}`);
                return; // หยุดทำงาน อย่าเพิ่งเด้งเปลี่ยนหน้า
             }
          }

          alert("✅ Game Saved successfully! Redirecting to main menu...");
          setVoteActive(false);
          router.push('/lobby'); // ไปหน้าล็อบบี้หลัก

        } catch (err: any) {
          console.error("Save catch error:", err);
        }
      };

      saveGameAndExit(); // เรียกใช้งาน
    }
    // เคส 2: โหวต NO ชนะขาดลอย OR โหวตครบทุกคนแล้วแต่ YES ไม่ชนะ
    else if (noVotes >= neededVotes || (yesVotes + noVotes === totalPlayers)) {
      setTimeout(() => {
        alert("❌ Vote failed! The adventure continues.")
        setVoteActive(false)
      }, 500)
    }
  }, [yesVotes, noVotes, neededVotes, totalPlayers, voteActive, router, roomId])

  // --- Actions ---
  const broadcastVote = async (action: string) => {
    try {
      await fetch('/api/pusher/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, action, senderId: localClientId.current })
      })
    } catch (err) {
      console.error("Pusher broadcast failed:", err)
    }
  }

  const handleStartVote = () => {
    setIsInitiator(true) // 🌟 เราคือคนเริ่มโหวต!
    setVoteActive(true)
    setYesVotes(1)
    setNoVotes(0)
    setHasVoted(true) 
    broadcastVote('START')
  }

  const handleVote = (choice: 'YES' | 'NO') => {
    if (hasVoted) return
    setHasVoted(true) 

    if (choice === 'YES') setYesVotes(prev => prev + 1)
    if (choice === 'NO') setNoVotes(prev => prev + 1)
    
    broadcastVote(choice)
  }

  const handleCancelVote = () => {
    setVoteActive(false)
    setHasVoted(false)
    setIsInitiator(false)
    broadcastVote('CANCEL')
  }

  return (
    <>
      <div className="flex gap-2 pointer-events-auto">
        <button 
          onClick={togglePause}
          className={`px-4 py-2 rounded-lg font-bold shadow-lg transition-all border text-sm flex items-center gap-2 ${
            isPaused ? 'bg-yellow-500 text-black border-yellow-400 animate-pulse' : 'bg-neutral-800/80 text-white border-white/20 hover:bg-neutral-700'
          }`}
        >
          {isPaused ? '▶ RESUME' : '⏸ PAUSE'}
        </button>

        <button 
          onClick={handleStartVote}
          disabled={voteActive}
          className="px-4 py-2 bg-red-900/80 hover:bg-red-700 text-white rounded-lg font-bold shadow-lg border border-red-500 transition-all text-sm disabled:opacity-50"
        >
          EXIT
        </button>
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
             {/* 🌟 เช็คก่อนว่าใช่คนเปิดโหวตไหม ถ้าใช่ค่อยให้เห็นปุ่ม Cancel */}
             {isInitiator && (
                <button onClick={handleCancelVote} className="text-gray-500 hover:text-white text-xs">✖</button>
             )}
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