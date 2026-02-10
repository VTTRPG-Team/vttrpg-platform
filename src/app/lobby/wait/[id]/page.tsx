'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation'; // 1. เพิ่ม useParams ตรงนี้
import { Mic, Send } from 'lucide-react';

// 2. ลบ { params } ออกจากวงเล็บ function
export default function WaitingRoomPage() { 
  const router = useRouter();
  
  // 3. ดึง ID จาก URL ด้วย Hook นี้แทน (ชัวร์กว่า)
  const params = useParams(); 
  const roomId = params?.id as string; // เปลี่ยนชื่อตัวแปรเป็น roomId เพื่อความชัดเจน

  const [room, setRoom] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // --- 1. โหลดข้อมูลห้อง & Realtime ---
  useEffect(() => {
    // ถ้ายังไม่มี ID (เช่นกำลังโหลด URL) ให้หยุดก่อน
    if (!roomId) return;

    const init = async () => {
      // เช็ค User ปัจจุบัน
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      // ดึงข้อมูลห้อง (ใช้ roomId แทน params.id)
      const { data: roomData, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId) // <-- แก้ตรงนี้
        .single();
      
      if (error) {
        console.error("Error loading room:", error);
        // ถ้าหาห้องไม่เจอ ให้เด้งออกไปหน้า Join
        router.push('/lobby/join');
        return;
      }
      
      setRoom(roomData);

      // ฟังก์ชันดึงรายชื่อผู้เล่น
      const fetchPlayers = async () => {
        const { data } = await supabase
          .from('room_players')
          .select('user_id, profiles(username, avatar_url)')
          .eq('room_id', roomId); // <-- แก้ตรงนี้
        
        if (data) {
           const formatted = data.map((p: any) => ({
             id: p.user_id,
             name: p.profiles?.username || 'Unknown',
             avatar: p.profiles?.avatar_url
           }));
           setPlayers(formatted);
        }
      };
      fetchPlayers();

      // Realtime Listener
      const channel = supabase.channel(`room-${roomId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'room_players', filter: `room_id=eq.${roomId}` }, () => {
           fetchPlayers();
        })
        .subscribe();
        
      return () => { supabase.removeChannel(channel); };
    };
    init();
  }, [roomId, router]); // <-- แก้ Dependency เป็น roomId

  // --- 2. ฟังก์ชันเริ่มเกม ---
  const handleStartGame = () => {
     router.push(`/room/${roomId}`);
  };

  // --- 3. ฟังก์ชันออกจากห้อง ---
  const handleExit = async () => {
    if (!currentUser || !room) return;

    if (currentUser.id === room.host_id) {
      await supabase.from('rooms').delete().eq('id', room.id);
    } else {
      await supabase.from('room_players').delete()
        .eq('room_id', room.id)
        .eq('user_id', currentUser.id);
    }
    router.push('/lobby/join');
  };

  if (!room) return <div className="min-h-screen bg-[#1a120b] text-[#F4E4BC] flex items-center justify-center font-mono text-2xl animate-pulse">Loading Dungeon...</div>;

  return (
    <div className="min-h-screen bg-[#1a120b] font-mono relative flex flex-col items-center p-8">
      
      {/* Background Image */}
      <div className="absolute inset-0 bg-[url('/images/dungeon-bg.jpg')] bg-cover opacity-40 blur-sm"></div>

      {/* ปุ่ม Exit */}
      <div className="absolute top-6 right-6 z-20">
        <button 
          onClick={handleExit} 
          className="px-6 py-2 bg-[#5A2D0C] border-2 border-[#F4E4BC] text-[#F4E4BC] font-bold hover:bg-red-900 rounded shadow-lg active:translate-y-1 transition-all"
        >
          EXIT LOBBY
        </button>
      </div>

      {/* Main Container */}
      <div className="z-10 w-full max-w-5xl flex gap-6 h-[80vh] mt-10">
        
        {/* Left Panel: Room Info */}
        <div className="w-1/3 bg-[#D4C5A2] rounded-lg border-4 border-[#5A2D0C] p-6 shadow-2xl flex flex-col relative">
          <div className="absolute top-2 left-2 w-3 h-3 rounded-full bg-[#3e2723] shadow-inner"></div>
          <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-[#3e2723] shadow-inner"></div>
          <div className="absolute bottom-2 left-2 w-3 h-3 rounded-full bg-[#3e2723] shadow-inner"></div>
          <div className="absolute bottom-2 right-2 w-3 h-3 rounded-full bg-[#3e2723] shadow-inner"></div>

          <h1 className="text-3xl font-bold text-[#3e2723] mb-2 drop-shadow-sm">{room.name}</h1>
          <div className="text-sm text-[#5A2D0C] mb-4 font-bold uppercase tracking-wider border-b-2 border-[#5A2D0C]/30 pb-2">
            Lobby Status: {players.length}/{room.max_players}
          </div>
          
          <div className="bg-[#3e2723] text-[#F4E4BC] p-4 rounded mb-4 flex-1 border border-[#5A2D0C] shadow-inner">
             <h3 className="font-bold underline mb-2 text-[#F4E4BC]/80 text-xs uppercase">Adventure Description</h3>
             <p className="text-sm opacity-90 leading-relaxed font-serif italic">
               "{room.description || 'No description provided for this journey...'}"
             </p>
          </div>

          <div className="bg-black/20 p-2 rounded text-center border-2 border-[#5A2D0C]/50">
             <img 
               src={room.image_url || "/images/cover-placeholder.jpg"} 
               className="rounded shadow-lg w-full h-40 object-cover bg-gray-800 grayscale hover:grayscale-0 transition-all duration-500" 
               alt="Cover" 
             />
          </div>
        </div>

        {/* Right Panel: Players & Chat */}
        <div className="flex-1 flex flex-col gap-4">
           
           {/* Player Grid */}
           <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
              {players.map((p) => (
                <div key={p.id} className="w-32 flex-shrink-0 bg-[#F4E4BC] rounded-lg border-2 border-[#5A2D0C] p-2 flex flex-col items-center shadow-lg relative group hover:-translate-y-1 transition-transform">
                   <div className="w-20 h-20 rounded-full border-4 border-[#3e2723] overflow-hidden bg-gray-700 shadow-sm">
                      <img src={p.avatar} className="w-full h-full object-cover" />
                   </div>
                   <div className="mt-2 text-xs font-bold text-center truncate w-full text-[#3e2723] px-1 bg-[#D4C5A2] rounded">{p.name}</div>
                   
                   <div className="absolute top-1 right-1 bg-black/50 rounded-full p-1 border border-white/20">
                     <Mic size={12} className="text-white"/>
                   </div>
                   
                   {p.id === room.host_id && (
                     <div className="absolute -top-3 -left-2 text-2xl drop-shadow-md">👑</div>
                   )}
                </div>
              ))}
              
              {[...Array(Math.max(0, room.max_players - players.length))].map((_, i) => (
                 <div key={i} className="w-32 flex-shrink-0 border-2 border-dashed border-[#F4E4BC]/30 rounded-lg flex flex-col items-center justify-center text-[#F4E4BC]/30 font-bold bg-black/20">
                    <span className="text-2xl mb-1">+</span>
                    Empty
                 </div>
              ))}
           </div>

           {/* Chat Box */}
           <div className="flex-1 bg-[#F4E4BC] rounded-lg border-4 border-[#5A2D0C] flex flex-col shadow-2xl overflow-hidden relative">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')] opacity-50 pointer-events-none"></div>
              
              <div className="bg-[#5A2D0C] text-[#F4E4BC] px-4 py-2 font-bold text-sm flex justify-between items-center z-10">
                <span>💬 Party Chat</span>
                <span className="text-xs opacity-70">Connected</span>
              </div>
              
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-transparent z-10">
                 <div className="text-sm bg-[#D4C5A2]/50 p-2 rounded border border-[#5A2D0C]/10">
                    <span className="font-bold text-[#8B4513]">System:</span> Welcome to the lobby! Prepare your dice. 🎲
                 </div>
              </div>

              <div className="p-3 bg-[#D4C5A2] border-t-2 border-[#5A2D0C] flex gap-2 z-10">
                 <input 
                   type="text" 
                   className="flex-1 px-4 py-2 rounded border-2 border-[#8B4513] bg-[#F4E4BC] text-[#3e2723] placeholder-[#8B4513]/50 focus:outline-none focus:border-[#5A2D0C] font-bold" 
                   placeholder="Type your message..." 
                 />
                 <button className="p-3 bg-[#5A2D0C] text-white rounded border-2 border-[#3e2723] hover:bg-[#3e1e08] active:scale-95 transition-transform">
                   <Send size={18}/>
                 </button>
              </div>
           </div>

           {/* Start Button */}
           {currentUser?.id === room.host_id && (
             <div className="flex justify-center mt-2">
                <button 
                  onClick={handleStartGame}
                  className="px-12 py-4 bg-[#8B4513] text-[#F4E4BC] font-bold text-2xl border-4 border-[#F4E4BC] shadow-[0_0_20px_rgba(139,69,19,0.6)] hover:scale-105 hover:shadow-[0_0_30px_rgba(244,228,188,0.4)] active:scale-95 transition-all rounded-lg uppercase tracking-widest"
                >
                  Start Adventure
                </button>
             </div>
           )}
        </div>

      </div>
    </div>
  );
}