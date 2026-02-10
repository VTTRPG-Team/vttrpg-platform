'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Home, LogOut, Edit } from 'lucide-react';
import { Cinzel } from 'next/font/google';

const cinzel = Cinzel({ subsets: ['latin'], weight: ['400', '700'] });

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getProfile = async () => {
      // 1. เช็ค Auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // 2. ดึงข้อมูลจากตาราง profiles
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (data) setProfile(data);
      setLoading(false);
    };
    getProfile();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/'); // Logout เสร็จกลับไปหน้าแรก
  };

  if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading Grimoire...</div>;

  return (
    <div className={`min-h-screen bg-[#1a0f0a] flex items-center justify-center relative ${cinzel.className}`}>
      
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] opacity-20"></div>

      {/* ปุ่มกลับ Home (มุมขวาบน) */}
      <button 
        onClick={() => router.push('/')}
        className="absolute top-6 right-6 p-3 bg-[#5A2D0C] text-[#F4E4BC] border-2 border-[#F4E4BC] rounded-lg hover:bg-[#8B4513] transition-all z-20"
      >
        <Home size={24} />
      </button>

      {/* --- ตัวสมุด (Book Container) --- */}
      <div className="relative w-full max-w-4xl h-[600px] flex drop-shadow-2xl animate-in fade-in zoom-in duration-500">
        
        {/* หน้ากระดาษซ้าย (พื้นหลังรูปสมุดจริง หรือใช้ CSS ทำเลียนแบบ) */}
        <div className="flex-1 bg-[#d4c5a2] rounded-l-lg border-r border-[#bcaaa4] p-8 shadow-[inset_-20px_0px_40px_rgba(0,0,0,0.2)] flex flex-col justify-center items-center relative overflow-hidden">
            {/* รอยเปื้อนกระดาษ */}
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')] opacity-60 pointer-events-none"></div>
            
            <h1 className="text-5xl font-bold text-[#3e2723] mb-8 relative z-10 drop-shadow-sm">Profile 🕯️</h1>
            
            {/* รูปภาพประกอบ (Skeleton ตามรูป ref) */}
            <img src="https://img.icons8.com/external-flaticons-lineal-color-flat-icons/100/external-skeleton-history-flaticons-lineal-color-flat-icons.png" alt="Decoration" className="opacity-80" />
            <p className="text-[#5d4037] mt-4 text-center italic font-sans text-sm max-w-xs z-10">
              "Here lies the record of a brave soul who ventured into the unknown..."
            </p>
        </div>

        {/* หน้ากระดาษขวา (ข้อมูล User) */}
        <div className="flex-1 bg-[#d4c5a2] rounded-r-lg p-10 shadow-[inset_20px_0px_40px_rgba(0,0,0,0.2)] flex flex-col relative">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')] opacity-60 pointer-events-none"></div>

            <div className="z-10 flex flex-col h-full justify-between">
              
              {/* ส่วนบน: Avatar & Info */}
              <div className="flex flex-col gap-6">
                
                {/* Avatar วงกลม */}
                <div className="self-center relative group">
                  <div className="w-32 h-32 rounded-full border-4 border-[#8B4513] overflow-hidden shadow-xl bg-slate-300">
                     <img src={profile?.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                  </div>
                  {/* ปุ่ม Edit รูป (ลอยอยู่) */}
                  <button className="absolute bottom-0 right-0 p-2 bg-[#5A2D0C] rounded-full text-white border border-[#F4E4BC] hover:scale-110 transition-transform">
                    <Edit size={16} />
                  </button>
                </div>

                {/* ข้อมูล Text */}
                <div className="space-y-4 font-bold text-[#3e2723]">
                  <div>
                    <label className="block text-sm opacity-70 mb-1">Name</label>
                    <div className="text-2xl border-b-2 border-[#8B4513] border-dashed pb-1 w-full">
                      {profile?.username}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm opacity-70 mb-1">Email</label>
                    <div className="text-xl border-b-2 border-[#8B4513] border-dashed pb-1 w-full">
                      {profile?.email}
                    </div>
                  </div>

                  <div>
                     <label className="block text-sm opacity-70 mb-1">Role</label>
                     <div className="text-xl text-[#8B4513] uppercase">{profile?.role || 'Adventurer'}</div>
                  </div>
                </div>
              </div>

              {/* ส่วนล่าง: Buttons */}
              <div className="flex gap-4 mt-8">
                 <button className="flex-1 py-3 bg-[#5A2D0C] text-[#F4E4BC] font-bold rounded shadow-md border-2 border-[#F4E4BC] hover:bg-[#3e1e08] active:translate-y-1">
                    Avatar Customize
                 </button>
                 
                 <button 
                    onClick={handleLogout}
                    className="px-4 py-3 bg-red-800 text-white font-bold rounded shadow-md border-2 border-red-950 hover:bg-red-900 active:translate-y-1 flex items-center gap-2"
                 >
                    <LogOut size={18} /> Logout
                 </button>
              </div>

            </div>
        </div>

        {/* สันปกสมุด (ตรงกลาง) */}
        <div className="absolute left-1/2 top-0 bottom-0 w-8 bg-[#3e2723] -translate-x-1/2 rounded-sm shadow-2xl z-20"></div>

      </div>

      {/* Wizard Decoration (Bottom Right) */}
      <img src="https://img.icons8.com/color/96/wizard.png" className="absolute bottom-4 right-4 animate-bounce z-10" alt="Wizard" />

    </div>
  );
}