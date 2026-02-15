'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Users, Sword, ArrowLeft, Scroll, AlertCircle } from 'lucide-react';
import { Cinzel, Crimson_Text } from 'next/font/google';

// Font Setup
const cinzel = Cinzel({ subsets: ['latin'], weight: ['700', '900'] });
const crimson = Crimson_Text({ subsets: ['latin'], weight: ['400', '600', '700'] });

export default function JoinLobbyPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [joiningId, setJoiningId] = useState<string | null>(null);

  // Fetch Rooms
  useEffect(() => {
    const fetchRooms = async () => {
      // ดึงเฉพาะห้องที่ status = 'waiting'
      const { data } = await supabase
        .from('rooms')
        .select('*')
        .eq('status', 'waiting')
        .order('created_at', { ascending: false });
      
      if (data) setRooms(data);
      setLoading(false);
    };
    fetchRooms();
    
    // Realtime Subscription
    const channel = supabase.channel('public:rooms')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'rooms' }, payload => {
        // เมื่อมีห้องใหม่ เพิ่มเข้ามาในรายการทันที
        setRooms(prev => [payload.new, ...prev]);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms' }, payload => {
        // อัปเดตข้อมูลห้อง (เช่น จำนวนคน หรือสถานะ)
         setRooms(prev => prev.map(room => room.id === payload.new.id ? payload.new : room));
         // ถ้าห้องเปลี่ยนสถานะเป็น playing ให้เอาออกจาก list
         if (payload.new.status !== 'waiting') {
            setRooms(prev => prev.filter(room => room.id !== payload.new.id));
         }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Handle Join
  const handleJoin = async (roomId: string) => {
    try {
        setJoiningId(roomId);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            router.push('/auth/login');
            return;
        }

        // เช็คก่อนว่าอยู่ในห้องนี้แล้วหรือยัง (กัน Error Duplicate Key)
        const { data: existingPlayer } = await supabase
            .from('room_players')
            .select('*')
            .eq('room_id', roomId)
            .eq('user_id', user.id)
            .single();

        if (!existingPlayer) {
            // ถ้ายังไม่มี ให้ Insert เข้าไป
            const { error } = await supabase
                .from('room_players')
                .insert([{ room_id: roomId, user_id: user.id }]);
            
            if (error) throw error;
        }

        // ไปหน้า Waiting Room
        router.push(`/lobby/room/${roomId}`);

    } catch (error: any) {
        alert("Failed to join: " + error.message);
        setJoiningId(null);
    }
  };

  // Filter Rooms based on Search
  const filteredRooms = rooms.filter(room => 
    room.name.toLowerCase().includes(searchTerm.toLowerCase())
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
             <div className="absolute inset-0 bg-red-500/5 rounded-lg blur opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
             <Search className="absolute left-4 top-3.5 text-[#a1887f] group-focus-within:text-red-500 transition-colors" size={20} />
             <input 
                type="text" 
                placeholder="Search by adventure name..." 
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
                // Empty State
                <div className="flex flex-col items-center justify-center py-20 text-[#5d4037] gap-4 border-2 border-dashed border-[#3e2723] rounded-lg bg-black/20">
                    <AlertCircle size={48} />
                    <p className="text-xl font-bold uppercase tracking-widest">No Active Quests Found</p>
                    <p className="text-sm">Be the first to create a lobby!</p>
                </div>
             ) : (
                // Room Cards
                filteredRooms.map((room) => (
                    <div 
                        key={room.id} 
                        className="group relative bg-gradient-to-r from-[#1a120b] to-[#0f0a08] border-l-4 border-[#3e2723] p-6 rounded-r-lg shadow-lg flex flex-col md:flex-row justify-between items-center gap-4 hover:border-red-600 hover:from-[#2a1d15] transition-all duration-300 animate-fade-in-up"
                    >
                        {/* Hover Glow */}
                        <div className="absolute inset-0 bg-red-900/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

                        {/* Room Info */}
                        <div className="flex-1 relative z-10 text-center md:text-left">
                           <h3 className={`${cinzel.className} text-2xl font-bold text-[#F4E4BC] group-hover:text-white transition-colors`}>
                               {room.name}
                           </h3>
                           <p className="text-[#a1887f] text-sm italic mt-1 line-clamp-1">
                               {room.description || 'A mysterious adventure awaits...'}
                           </p>
                           <div className="flex items-center justify-center md:justify-start gap-4 mt-3 text-xs text-[#5d4037] font-mono uppercase tracking-widest">
                               <span>Host: Unknown</span> {/* ถ้า Join Table profiles มาได้จะดีมาก */}
                               <span>•</span>
                               <span>Created: {new Date(room.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                           </div>
                        </div>
                        
                        {/* Status & Action */}
                        <div className="flex items-center gap-6 relative z-10">
                           <div className="flex flex-col items-center">
                              <div className="flex items-center gap-2 text-[#a1887f] font-bold bg-black/40 px-3 py-1 rounded border border-[#3e2723]">
                                 <Users size={16} />
                                 {/* ใช้ || 1 เพราะเรายังไม่ได้ทำระบบนับคนจริงจัง */}
                                 <span>{room.current_players || 1}/{room.max_players}</span>
                              </div>
                           </div>

                           <button 
                             onClick={() => handleJoin(room.id)}
                             disabled={joiningId === room.id}
                             className={`
                                flex items-center gap-2 px-6 py-3 rounded
                                font-bold uppercase tracking-widest text-sm
                                transition-all duration-300
                                ${joiningId === room.id 
                                    ? 'bg-gray-800 text-gray-500 cursor-wait' 
                                    : 'bg-[#5A2D0C] text-[#F4E4BC] border border-[#8B4513] hover:bg-red-900 hover:text-white hover:border-red-600 hover:shadow-[0_0_15px_rgba(220,38,38,0.4)] hover:-translate-y-1'
                                }
                             `}
                            >
                             {joiningId === room.id ? (
                                 'Joining...'
                             ) : (
                                 <><Sword size={18} /> Join Party</>
                             )}
                           </button>
                        </div>
                    </div>
                ))
             )}
          </div>
       </div>
    </div>
  );
}