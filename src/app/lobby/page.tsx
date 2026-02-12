'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Users, Sword, Shield, Crown, Search } from 'lucide-react';
import { Cinzel, Crimson_Text } from 'next/font/google';

// Font Setup
const cinzel = Cinzel({ subsets: ['latin'], weight: ['700', '900'] });
const crimson = Crimson_Text({ subsets: ['latin'], weight: ['400', '600', '700'] });

export default function LobbyPage() {
  const router = useRouter();

  // สไตล์การ์ดเลือกโหมด
  const cardStyle = `
    group relative flex flex-col items-center justify-center gap-4
    w-full md:w-80 h-96 p-8
    bg-gradient-to-b from-gray-900/90 to-black/90
    border-2 border-[#3e2723] rounded-xl
    hover:border-red-500 hover:bg-red-950/20
    hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(220,38,38,0.3)]
    transition-all duration-300 cursor-pointer overflow-hidden
  `;

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center relative bg-black ${crimson.className}`}>
      
      {/* --- 1. Background --- */}
      <div className="absolute inset-0 z-0">
        <img 
          src="/dungeon_gate.jpg" 
          alt="Lobby Background" 
          className="w-full h-full object-cover opacity-30 blur-sm" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/30" />
      </div>

      {/* --- 2. Navigation (Back Button) --- */}
      <div className="absolute top-6 left-6 z-20">
        <Link href="/">
           <button className="flex items-center gap-2 px-4 py-2 text-[#a1887f] hover:text-[#F4E4BC] border border-transparent hover:border-[#F4E4BC]/50 rounded transition-all uppercase text-sm font-bold tracking-wider group">
             <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> 
             Back to Menu
           </button>
        </Link>
      </div>

      {/* --- 3. Main Content --- */}
      <div className="relative z-10 w-full max-w-4xl flex flex-col items-center gap-10 p-4">
        
        {/* Header */}
        <div className="text-center space-y-2 animate-fade-in-down">
           <h1 className={`${cinzel.className} text-5xl md:text-6xl font-black text-[#F4E4BC] drop-shadow-lg tracking-wide uppercase`}>
             Gathering Hall
           </h1>
           <p className="text-[#a1887f] text-lg tracking-widest uppercase font-light opacity-80">
             Choose your path, Adventurer
           </p>
        </div>

        {/* Action Cards Container */}
        <div className="flex flex-col md:flex-row gap-8 w-full justify-center animate-fade-in-up delay-100">
           
           {/* === CARD 1: CREATE LOBBY (HOST) === */}
           <Link href="/lobby/create" className={cardStyle}>
              {/* Background Glow Effect */}
              <div className="absolute inset-0 bg-red-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              {/* Icon */}
              <div className="p-6 rounded-full bg-[#1a0f0a] border border-[#5d4037] group-hover:border-red-500 group-hover:scale-110 transition-all shadow-xl">
                 <Crown size={48} className="text-[#F4E4BC] group-hover:text-red-500 transition-colors" />
              </div>

              {/* Text */}
              <div className="text-center space-y-2 relative z-10">
                 <h2 className={`${cinzel.className} text-2xl font-bold text-[#F4E4BC] uppercase tracking-wider group-hover:text-white`}>
                   Host Game
                 </h2>
                 <p className="text-[#a1887f] text-sm group-hover:text-red-200/70">
                   Forge a new realm and lead your party into the unknown.
                 </p>
              </div>

              {/* Decorative Button Look */}
              <div className="mt-4 px-6 py-2 border border-[#3e2723] rounded text-xs text-[#5d4037] uppercase tracking-widest group-hover:bg-red-600 group-hover:text-white group-hover:border-red-600 transition-all">
                 Create Lobby
              </div>
           </Link>

           {/* === CARD 2: JOIN LOBBY (PLAYER) === */}
           <Link href="/lobby/join" className={cardStyle}>
              {/* Background Glow Effect */}
              <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              {/* Icon */}
              <div className="p-6 rounded-full bg-[#1a0f0a] border border-[#5d4037] group-hover:border-blue-500 group-hover:scale-110 transition-all shadow-xl">
                 <Search size={48} className="text-[#F4E4BC] group-hover:text-blue-500 transition-colors" />
              </div>

              {/* Text */}
              <div className="text-center space-y-2 relative z-10">
                 <h2 className={`${cinzel.className} text-2xl font-bold text-[#F4E4BC] uppercase tracking-wider group-hover:text-white`}>
                   Find Party
                 </h2>
                 <p className="text-[#a1887f] text-sm group-hover:text-blue-200/70">
                   Answer the call. Join an existing adventure and fight together.
                 </p>
              </div>

              {/* Decorative Button Look */}
              <div className="mt-4 px-6 py-2 border border-[#3e2723] rounded text-xs text-[#5d4037] uppercase tracking-widest group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all">
                 Join Lobby
              </div>
           </Link>

        </div>
      </div>

      {/* Footer Text */}
      <div className="absolute bottom-6 text-[#3e2723] text-xs uppercase tracking-[0.3em] font-bold opacity-50">
         Select your destiny
      </div>

    </div>
  );
}