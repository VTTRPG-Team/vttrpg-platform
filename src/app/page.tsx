'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);

  // สไตล์ปุ่มไม้
  const btnStyle = "w-64 py-4 bg-[#8B4513] border-4 border-[#5A2D0C] text-[#F4E4BC] font-bold text-xl uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] active:translate-y-[4px] active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer";

  // ฟังก์ชันดึงข้อมูล Profile แยกออกมา เพื่อเรียกใช้ซ้ำได้
  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) setProfile(data);
  };

  useEffect(() => {
    // 1. เช็ค User ตอนโหลดหน้าครั้งแรก
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        fetchProfile(user.id);
      }
    };
    checkUser();

    // 2. ***ทีเด็ด: สร้างตัวดักฟังการเปลี่ยนแปลง (Login/Logout)***
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth Event:", event); // เช็คใน Console ได้เลยว่าทำงานไหม
      
      if (session?.user) {
        setUser(session.user);
        fetchProfile(session.user.id); // ดึงชื่อใหม่ทันที
      } else {
        setUser(null);
        setProfile(null);
      }
    });

    // คืนค่าฟังก์ชันเพื่อยกเลิกตัวดักฟังเมื่อเปลี่ยนหน้า (Clean up)
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#1a120b] flex flex-col relative font-mono overflow-hidden">
      
      {/* Background */}
      <div className="absolute inset-0 opacity-50 bg-[radial-gradient(circle_at_center,_#3e2723_0%,_#000000_100%)]"></div>

      {/* --- UI ส่วนมุมบน (Login/Profile) --- */}
      {user ? (
        // === กรณี Login แล้ว: โชว์ป้ายชื่อ (คลิกไป Profile) ===
        <Link href="/profile" className="absolute top-6 left-6 z-30 group">
          <div className="flex items-center gap-3 bg-[#2a1d15] p-2 pr-6 rounded-l-full rounded-r-lg border-2 border-[#8B4513] shadow-lg group-hover:scale-105 transition-transform cursor-pointer">
            <img 
              src={profile?.avatar_url || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user.id}`} 
              alt="Avatar" 
              className="w-12 h-12 rounded-full border-2 border-[#F4E4BC] bg-slate-700 object-cover"
            />
            <div className="flex flex-col text-left">
              <span className="text-[#F4E4BC] font-bold text-lg leading-none">
                {profile?.username || 'Adventurer'}
              </span>
              <span className="text-[#8B4513] text-xs font-bold bg-[#F4E4BC] px-1 rounded mt-1 w-fit">
                Lv.1
              </span>
            </div>
          </div>
        </Link>
      ) : (
        // === กรณีโสด (ยังไม่ Login): โชว์ปุ่ม Login/Signup ===
        <div className="absolute top-6 right-6 z-20 flex gap-4">
          <Link href="/auth/login">
            <button className="px-4 py-2 bg-[#F4E4BC] border-2 border-[#5A2D0C] text-[#5A2D0C] font-bold hover:bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] active:translate-y-1 active:shadow-none">
              Login
            </button>
          </Link>
          <Link href="/auth/signup">
            <button className="px-4 py-2 bg-[#5A2D0C] border-2 border-[#F4E4BC] text-[#F4E4BC] font-bold hover:bg-[#3e1e08] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] active:translate-y-1 active:shadow-none">
              Sign Up
            </button>
          </Link>
        </div>
      )}

      {/* --- Main Content --- */}
      <div className="z-10 flex-1 flex flex-col items-center justify-center gap-8">
        <div className="text-center mb-8">
          <h1 className="text-6xl font-black text-red-600 drop-shadow-[4px_4px_0_#000] tracking-tighter">
            DUNGEONS & DRAGONS
          </h1>
        </div>

        <div className="flex flex-col gap-6">
          {/* ปุ่ม Play */}
          {user ? (
            <Link href="/lobby"><button className={btnStyle}>PLAY</button></Link>
          ) : (
            <Link href="/auth/login"><button className={btnStyle}>PLAY (Login First)</button></Link>
          )}

          {/* ปุ่ม Workshop */}
          <Link href="/workshop"><button className={btnStyle}>WORKSHOP</button></Link>
          
          {/* ปุ่ม Customize */}
          {user ? (
             <Link href="/profile"><button className={btnStyle}>AVATAR CUSTOMIZE</button></Link>
          ) : (
             <Link href="/auth/login"><button className={btnStyle}>AVATAR CUSTOMIZE</button></Link>
          )}
        </div>
      </div>
    </div>
  );
}