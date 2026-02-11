'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { Sword, ShoppingBag, User as UserIcon, LogOut, Sparkles, Lock } from 'lucide-react'; // เพิ่ม Lock icon
import { Cinzel, Crimson_Text } from 'next/font/google';

// --- Font Setup ---
const cinzel = Cinzel({ subsets: ['latin'], weight: ['700', '900'] });
const crimson = Crimson_Text({ subsets: ['latin'], weight: ['400', '600', '700'] });

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) setProfile(data);
  };

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        fetchProfile(user.id);
      }
      setIsAuthChecking(false);
    };
    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        fetchProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
      }
      setIsAuthChecking(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // --- 🔥 MODERN BUTTON STYLE (Sleek & Compact) 🔥 ---
  const btnStyle = `
    group relative w-72 py-3 rounded-md
    bg-gradient-to-br from-gray-900 via-red-950 to-black
    border border-red-900/40
    text-red-100 font-bold text-lg uppercase tracking-[0.2em] drop-shadow-sm
    shadow-[0_4px_6px_-1px_rgba(0,0,0,0.5)]
    
    hover:from-red-900 hover:to-red-800
    hover:text-white hover:border-red-500/60
    hover:shadow-[0_0_15px_rgba(220,38,38,0.4)]
    hover:-translate-y-0.5
    
    active:translate-y-0 active:shadow-none

    transition-all duration-300 ease-out
    flex items-center justify-center gap-3 overflow-hidden
  `;

  const shineEffect = "absolute top-0 -left-[150%] w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:animate-shine slanted-shine mix-blend-overlay";

  if (isAuthChecking) {
    return <div className="min-h-screen bg-black flex items-center justify-center"><Sparkles className="text-red-600 animate-spin w-8 h-8"/></div>;
  }

  return (
    <div className={`min-h-screen flex flex-col relative font-mono overflow-hidden bg-black ${crimson.className}`}>
      
      {/* --- 1. Background Image --- */}
      <div className="absolute inset-0 z-0">
        <img 
          src="/dungeon_gate.jpg" 
          alt="Dungeon Gate Background" 
          className="w-full h-full object-cover scale-105 animate-pan-slow opacity-80" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/20" />
      </div>

      {/* --- 2. UI Elements --- */}
      <div className="relative z-10 flex-1 flex flex-col">

        {/* === Top Bar (Compact & Right Aligned) === */}
        <header className="w-full flex items-center p-6 md:p-8">
          
          {/* Profile Section */}
          {user && (
            <Link href="/profile" className="group flex items-center gap-3 pl-1 pr-4 py-1.5 bg-gray-950/80 border border-red-900/30 rounded-full hover:border-red-500/60 transition-all backdrop-blur-md cursor-pointer mr-auto">
              <div className="relative">
                <img 
                  src={profile?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.id}&baseColor=1a1a1a&eyes=eva&mouth=smile01&texture=circuits`} 
                  alt="Avatar" 
                  className="w-8 h-8 rounded-full border border-red-500/50 bg-black object-cover"
                />
                <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 border border-gray-900 rounded-full"></div>
              </div>
              <div className="flex flex-col text-left">
                <span className={`${cinzel.className} text-red-100 font-bold text-sm leading-none group-hover:text-white transition-colors`}>
                  {profile?.username || 'Warrior'}
                </span>
              </div>
            </Link>
          )}

          {/* Login/Signup Section (Right Aligned) */}
          <div className="flex gap-3 ml-auto">
            {user ? (
              <button onClick={() => supabase.auth.signOut()} className="p-2 text-red-300/50 hover:text-red-100 transition-colors rounded-full hover:bg-red-900/20" title="Logout">
                <LogOut size={18} />
              </button>
            ) : (
              <>
                <Link href="/auth/login">
                  <button className="px-4 py-1.5 bg-black/40 border border-red-800/30 text-red-200/80 text-xs font-bold uppercase hover:bg-red-900/30 hover:border-red-500/50 hover:text-white transition-all tracking-wider rounded backdrop-blur-sm">
                    Login
                  </button>
                </Link>
                <Link href="/auth/signup">
                  <button className="px-4 py-1.5 bg-red-900/80 border border-red-600/50 text-white text-xs font-bold uppercase hover:bg-red-700 hover:shadow-[0_0_10px_rgba(239,68,68,0.4)] transition-all tracking-wider rounded shadow-md">
                    Sign Up
                  </button>
                </Link>
              </>
            )}
          </div>
        </header>

        {/* === Main Content === */}
        <main className="flex-1 flex flex-col items-center justify-center gap-12 -mt-16">
          
          {/* --- Title --- */}
          <div className="animate-fade-in-down relative flex flex-col items-center space-y-4">
             <div className="opacity-60 mb-2">
               <Sword size={48} className="text-red-600/80 rotate-90 drop-shadow-md"/>
            </div>
            
            <div className="flex flex-col items-center">
                <h1 className={`${cinzel.className} text-7xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-red-50 via-red-500 to-black drop-shadow-2xl tracking-tighter leading-none`}>
                  DUNGEONS
                </h1>
                <h2 className={`${cinzel.className} text-3xl md:text-5xl font-bold text-red-600/90 tracking-[0.3em] uppercase mt-2 drop-shadow-lg`}>
                  & DRAGONS
                </h2>
            </div>
          </div>

          {/* --- Buttons List --- */}
          <div className="flex flex-col gap-4 animate-fade-in-up delay-150">
            
            {/* 1. PLAY Button */}
            <Link href={user ? "/lobby" : "/auth/login"}>
              <button className={`${btnStyle} border-red-500/60 py-4 text-xl`}>
                 <div className={shineEffect}></div>
                 <Sword size={24} className="text-red-500 group-hover:text-white transition-colors group-hover:rotate-12"/>
                 <span>Enter World</span>
              </button>
            </Link>

            {/* 2. WORKSHOP Button (แก้ไขแล้ว) */}
            {/* เช็ค User: ถ้ามีไป /workshop, ถ้าไม่มีไป /auth/login */}
            <Link href={user ? "/workshop" : "/auth/login"}>
              <button className={btnStyle}>
                 <div className={shineEffect}></div>
                 
                 {/* ถ้ายังไม่ Login ให้โชว์แม่กุญแจ (Lock) แทนถุงช้อปปิ้ง */}
                 {user ? (
                    <ShoppingBag size={18} className="text-red-400/80 group-hover:text-white transition-colors"/>
                 ) : (
                    <Lock size={18} className="text-gray-500 group-hover:text-white transition-colors"/>
                 )}
                 
                 <span>Workshop</span>
              </button>
            </Link>
            
            {/* 3. CUSTOMIZE Button */}
            <Link href={user ? "/profile" : "/auth/login"}>
              <button className={btnStyle}>
                 <div className={shineEffect}></div>
                 <UserIcon size={18} className="text-red-400/80 group-hover:text-white transition-colors"/>
                 <span>Customize</span>
              </button>
            </Link>

          </div>
        </main>

        <footer className="p-4 text-center text-red-900/40 text-[10px] font-mono uppercase tracking-[0.2em]">
           <p>v0.1.0 • Gateway Online</p>
        </footer>

      </div>
    </div>
  );
}