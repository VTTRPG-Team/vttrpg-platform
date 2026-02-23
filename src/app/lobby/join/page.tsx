'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Users, Sword, ArrowLeft, Scroll, AlertCircle, Bot, UserCog, Hash, Eye } from 'lucide-react';
import { Cinzel, Crimson_Text } from 'next/font/google';

// Font Setup
const cinzel = Cinzel({ subsets: ['latin'], weight: ['700', '900'] });
const crimson = Crimson_Text({ subsets: ['latin'], weight: ['400', '600', '700'] });

export default function JoinLobbyPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<any[]>([]);
  const [playerCounts, setPlayerCounts] = useState<Record<string, number>>({});
  const [hostNames, setHostNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [joiningId, setJoiningId] = useState<string | null>(null);

  // Fetch Rooms & Data
  useEffect(() => {
    const fetchAllData = async () => {
      // 🌟 1. ดึงห้องแบบปลอดภัยที่สุด (ไม่ใช้ Join เดี๋ยวพังอีก) เอาทั้ง waiting และ playing
      const { data: roomsData, error: roomsError } = await supabase
        .from('rooms')
        .select('*')
        .in('status', ['waiting', 'playing'])
        .order('created_at', { ascending: false });
      
      if (roomsError) console.error("Error fetching rooms:", roomsError);

      if (roomsData && roomsData.length > 0) {
        setRooms(roomsData);

        // 🌟 2. ดึงชื่อ Host แบบแยก Query (ชัวร์ 100%)
        const hostIds = [...new Set(roomsData.map(r => r.host_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, username')
          .in('id', hostIds);

        if (profilesData) {
          const hostMap: Record<string, string> = {};
          profilesData.forEach(p => hostMap[p.id] = p.username);
          setHostNames(hostMap);
        }

        // 🌟 3. ดึงจำนวนคนในห้องแบบ Realtime
        const { data: playersData } = await supabase.from('room_players').select('room_id');
        if (playersData) {
          const counts: Record<string, number> = {};
          playersData.forEach(p => counts[p.room_id] = (counts[p.room_id] || 0) + 1);
          setPlayerCounts(counts);
        }
      } else {
        setRooms([]); // ถ้าไม่มีห้องให้เซ็ตเป็นว่าง
      }
      setLoading(false);
    };

    fetchAllData();
    
    // 🌟 Realtime: ดักฟังตาราง rooms
    const roomChannel = supabase.channel('public:rooms')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, payload => {
         fetchAllData(); // รีเฟรชข้อมูลเลย
      })
      .subscribe();

    // 🌟 Realtime: ดักฟังตาราง room_players (คนเข้า/ออก)
    const playerChannel = supabase.channel('public:room_players')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'room_players' }, payload => {
         setPlayerCounts(prev => ({ ...prev, [payload.new.room_id]: (prev[payload.new.room_id] || 0) + 1 }));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'room_players' }, payload => {
         setPlayerCounts(prev => ({ ...prev, [payload.old.room_id]: Math.max(0, (prev[payload.old.room_id] || 1) - 1) }));
      })
      .subscribe();

    return () => { 
      supabase.removeChannel(roomChannel); 
      supabase.removeChannel(playerChannel); 
    };
  }, []);

  // Handle Join (รองรับทั้งเข้าเล่นและเข้าไปดู)
  const handleJoin = async (roomId: string, status: string) => {
    try {
        setJoiningId(roomId);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            router.push('/auth/login');
            return;
        }

        const { data: existingPlayer } = await supabase
            .from('room_players')
            .select('*')
            .eq('room_id', roomId)
            .eq('user_id', user.id)
            .single();

        if (!existingPlayer) {
            const { error } = await supabase
                .from('room_players')
                .insert([{ room_id: roomId, user_id: user.id }]);
            if (error) throw error;
        }

        // 🌟 ถ้าห้อง waiting ไปหน้า Lobby Wait, ถ้าห้อง playing ไปหน้าเกมเลย (Spectator)
        if (status === 'waiting') {
            router.push(`/lobby/wait/${roomId}`);
        } else {
            router.push(`/room/${roomId}`);
        }

    } catch (error: any) {
        alert("Failed to join: " + error.message);
        setJoiningId(null);
    }
  };

  // 🌟 Filter Rooms (ค้นหาได้ทั้งชื่อห้อง และ ID)
  const filteredRooms = rooms.filter(room => 
    room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`min-h-screen flex flex-col items-center relative bg-black ${crimson.className}`}>
       
       {/* Background */}
       <div className="absolute inset-0 z-0">
        <img src="/dungeon_gate.jpg" alt="BG" className="w-full h-full object-cover opacity-30 blur-sm" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30" />
      </div>

       <div className="relative z-10 container max-w-5xl mx-auto p-4 md:p-8 h-screen flex flex-col">
          
          {/* --- Header --- */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 border-b-2 border-[#3e2723] pb-6 bg-[#0f0a08]/80 p-6 rounded-t-lg backdrop-blur-sm">
             <div className="flex items-center gap-4">
                <div className="p-3 bg-red-900/20 border border-red-900 rounded-full">
                    <Scroll size={32} className="text-[#F4E4BC]" />
                </div>
                <div>
                    <h1 className={`${cinzel.className} text-3xl md:text-4xl text-[#F4E4BC] font-bold uppercase tracking-wide`}>
                        Quest Board
                    </h1>
                    <p className="text-[#a1887f] text-sm uppercase tracking-widest">Find your party, start the adventure</p>
                </div>
             </div>

             <Link href="/lobby">
               <button className="flex items-center gap-2 px-4 py-2 text-[#a1887f] hover:text-[#F4E4BC] border border-[#5d4037] hover:border-[#F4E4BC] rounded transition-all uppercase text-sm font-bold tracking-wider group bg-black/50">
                 <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Exit Hall
               </button>
             </Link>
          </div>

          {/* --- Search Bar --- */}
          <div className="relative mb-6 group">
             {/* 🌟 THE FIX: ใส่ pointer-events-none ตรงนี้ ทำให้คลิกทะลุไปหา Input ได้ */}
             <div className="absolute inset-0 bg-red-500/5 rounded-lg blur opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none"></div>
             <Search className="absolute left-4 top-3.5 text-[#a1887f] group-focus-within:text-red-500 transition-colors pointer-events-none" size={20} />
             <input 
                type="text" 
                placeholder="Search by Adventure Name or Room ID..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-3 pl-12 rounded-lg bg-[#1a120b] border border-[#5d4037] text-[#F4E4BC] placeholder-[#5d4037] focus:outline-none focus:border-red-500 focus:bg-[#0f0a08] transition-all font-sans text-lg shadow-inner" 
             />
          </div>

          {/* --- Room List --- */}
          <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar pb-10">
             
             {loading ? (
                <div className="text-center py-20 text-[#a1887f] animate-pulse">
                    Scanning magical frequencies...
                </div>
             ) : filteredRooms.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-[#5d4037] gap-4 border-2 border-dashed border-[#3e2723] rounded-lg bg-black/20">
                    <AlertCircle size={48} />
                    <p className="text-xl font-bold uppercase tracking-widest">No Active Quests Found</p>
                    <p className="text-sm">Be the first to create a lobby!</p>
                </div>
             ) : (
                filteredRooms.map((room) => {
                  const currentPlayers = playerCounts[room.id] || 0;
                  const isFull = currentPlayers >= room.max_players;
                  const isPlaying = room.status === 'playing';

                  return (
                    <div 
                        key={room.id} 
                        className="group relative bg-gradient-to-r from-[#1a120b] to-[#0f0a08] border-l-4 border-[#3e2723] p-6 rounded-r-lg shadow-lg flex flex-col md:flex-row justify-between items-center gap-4 hover:border-red-600 hover:from-[#2a1d15] transition-all duration-300 animate-fade-in-up"
                    >
                        <div className="absolute inset-0 bg-red-900/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

                        {/* Room Info */}
                        <div className="flex-1 relative z-10 text-center md:text-left w-full">
                           <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-1">
                              {/* 🌟 ป้ายสถานะ (Waiting/Playing) */}
                              <div className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-widest border ${isPlaying ? 'bg-red-900/50 text-red-400 border-red-900' : 'bg-green-900/50 text-green-400 border-green-900'}`}>
                                 {isPlaying ? 'In Progress' : 'Waiting'}
                              </div>

                              {/* 🌟 ป้ายประเภท GM */}
                              <div className="flex items-center gap-1 text-[10px] bg-[#3e2723]/50 px-2 py-0.5 rounded border border-[#5d4037] text-[#F4E4BC] uppercase font-bold">
                                {room.gm_type === 'human' ? <><UserCog size={12}/> Human GM</> : <><Bot size={12}/> AI GM</>}
                              </div>
                           </div>

                           <h3 className={`${cinzel.className} text-2xl font-bold text-[#F4E4BC] group-hover:text-white transition-colors`}>
                               {room.name}
                           </h3>
                           <p className="text-[#a1887f] text-sm italic mt-1 line-clamp-1">
                               {room.description || 'A mysterious adventure awaits...'}
                           </p>

                           <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-3 text-xs text-[#5d4037] font-mono uppercase tracking-widest">
                               <span className="flex items-center gap-1"><Hash size={12}/> {room.id.split('-')[0]}</span>
                               <span>•</span>
                               <span>Host: {hostNames[room.host_id] || 'Unknown'}</span>
                               <span>•</span>
                               <span>Created: {new Date(room.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                           </div>
                        </div>
                        
                        {/* Status & Action */}
                        <div className="flex items-center gap-6 relative z-10 w-full md:w-auto justify-between md:justify-end mt-4 md:mt-0">
                           <div className="flex flex-col items-center">
                              <div className={`flex items-center gap-2 font-bold px-3 py-1 rounded border ${isFull ? 'bg-red-900/20 text-red-500 border-red-900' : 'bg-black/40 text-[#a1887f] border-[#3e2723]'}`}>
                                 <Users size={16} />
                                 <span>{currentPlayers}/{room.max_players}</span>
                              </div>
                           </div>

                           <button 
                             onClick={() => handleJoin(room.id, room.status)}
                             disabled={joiningId === room.id || (isFull && !isPlaying)} // 🌟 ถ้าเต็มและอยู่หน้า Waiting = กดไม่ได้
                             className={`
                                flex items-center gap-2 px-6 py-3 rounded
                                font-bold uppercase tracking-widest text-sm
                                transition-all duration-300
                                ${joiningId === room.id 
                                    ? 'bg-gray-800 text-gray-500 cursor-wait' 
                                    : (isFull && !isPlaying)
                                      ? 'bg-[#1a0f0a] text-[#5d4037] border border-[#3e2723] cursor-not-allowed'
                                      : isPlaying
                                        ? 'bg-blue-900/80 text-blue-200 border border-blue-600 hover:bg-blue-800 hover:shadow-[0_0_15px_rgba(37,99,235,0.4)]'
                                        : 'bg-[#5A2D0C] text-[#F4E4BC] border border-[#8B4513] hover:bg-red-900 hover:text-white hover:border-red-600 hover:shadow-[0_0_15px_rgba(220,38,38,0.4)] hover:-translate-y-1'
                                }
                             `}
                            >
                             {joiningId === room.id ? (
                                 'Entering...'
                             ) : isFull && !isPlaying ? (
                                 'Party Full'
                             ) : isPlaying ? (
                                 <><Eye size={18} /> Spectate</> // 🌟 ถ้ากำลังเล่นอยู่ เปลี่ยนปุ่มเป็น Spectate
                             ) : (
                                 <><Sword size={18} /> Join Party</>
                             )}
                           </button>
                        </div>
                    </div>
                  )
                })
             )}
          </div>
       </div>
    </div>
  );
}