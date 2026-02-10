'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Users } from 'lucide-react';

export default function JoinLobbyPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<any[]>([]);

  useEffect(() => {
    // ดึงข้อมูลห้องที่เป็น status 'waiting'
    const fetchRooms = async () => {
      const { data } = await supabase.from('rooms').select('*').eq('status', 'waiting').order('created_at', { ascending: false });
      if (data) setRooms(data);
    };
    fetchRooms();
    
    // Realtime: ใครสร้างห้องใหม่ ให้เด้งขึ้นมาเลย
    const channel = supabase.channel('public:rooms')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'rooms' }, payload => {
        setRooms(prev => [payload.new, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleJoin = async (roomId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return router.push('/auth/login');

    // บันทึกชื่อเข้าห้อง
    await supabase.from('room_players').insert([{ room_id: roomId, user_id: user.id }]);
    // ไปหน้า Waiting Room
    router.push(`/lobby/wait/${roomId}`);
  };

  return (
    <div className="min-h-screen bg-[#1a120b] font-mono relative">
       {/* Background Dim */}
       <div className="absolute inset-0 bg-[url('/images/dungeon-hall.jpg')] bg-cover opacity-50"></div>
       
       <div className="relative z-10 container mx-auto p-8 h-screen flex flex-col">
          
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl text-[#F4E4BC] font-bold">Find Room</h1>
            <Link href="/lobby">
              <button className="px-6 py-2 bg-[#5A2D0C] border-2 border-[#F4E4BC] text-[#F4E4BC] font-bold hover:bg-red-900">EXIT</button>
            </Link>
          </div>

          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-3 text-gray-500" />
            <input type="text" placeholder="Search adventure..." className="w-full p-3 pl-12 rounded bg-gray-200 border-2 border-[#5A2D0C] focus:outline-none" />
          </div>

          {/* Room List Container */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
            {rooms.map((room) => (
              <div key={room.id} className="bg-[#D4C5A2] border-l-8 border-[#5A2D0C] p-4 rounded shadow-lg flex justify-between items-center hover:bg-[#EDE0C0] transition-colors group">
                <div>
                  <h3 className="text-xl font-bold text-[#3e2723] group-hover:text-[#8B4513]">{room.name}</h3>
                  <p className="text-sm text-gray-700 italic">{room.description || 'No description'}</p>
                </div>
                
                <div className="flex items-center gap-6">
                   <div className="flex items-center gap-2 text-[#5A2D0C] font-bold">
                      <Users size={20} />
                      <span>{room.current_players || 1}/{room.max_players}</span>
                   </div>
                   <button 
                     onClick={() => handleJoin(room.id)}
                     className="px-6 py-2 bg-[#8B4513] text-[#F4E4BC] font-bold rounded border-2 border-[#5A2D0C] hover:scale-105 transition-transform"
                    >
                     JOIN
                   </button>
                </div>
              </div>
            ))}
          </div>

       </div>
    </div>
  );
}