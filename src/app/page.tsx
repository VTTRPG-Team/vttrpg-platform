import Link from 'next/link';
import { User, LogIn } from 'lucide-react';

export default function Home() {
  // สไตล์ปุ่มไม้แบบ Pixel Art
  const btnStyle = "w-64 py-4 bg-[#8B4513] border-4 border-[#5A2D0C] text-[#F4E4BC] font-bold text-xl uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] active:translate-y-[4px] active:shadow-none transition-all flex items-center justify-center gap-2";

  return (
    // พื้นหลังสมมติว่าเป็นรูป Tavern (ใส่สีเข้มแทนรูปไปก่อน)
    <div className="min-h-screen bg-[#1a120b] flex flex-col relative font-mono overflow-hidden">
      
      {/* Background Image Placeholder (ถ้ามีรูปจริงให้ใส่ className="bg-[url('/path/to/bg.jpg')] bg-cover") */}
      <div className="absolute inset-0 opacity-50 bg-[radial-gradient(circle_at_center,_#3e2723_0%,_#000000_100%)]"></div>

      {/* --- Top Right: Login / Sign Up --- */}
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

      {/* --- Main Content --- */}
      <div className="z-10 flex-1 flex flex-col items-center justify-center gap-8">
        
        {/* Logo (ใส่ Text แทนรูปโลโก้ D&D) */}
        <div className="text-center mb-8">
          <h1 className="text-6xl font-black text-red-600 drop-shadow-[4px_4px_0_#000] tracking-tighter">
            DUNGEONS
          </h1>
          <h1 className="text-6xl font-black text-red-600 drop-shadow-[4px_4px_0_#000] tracking-tighter">
            & DRAGON
          </h1>
        </div>

        {/* 3 Main Buttons */}
        <div className="flex flex-col gap-6">
          {/* 1. PLAY -> ไปหน้า Lobby (สมมติว่า Login แล้ว) */}
          <Link href="/lobby"> 
            <button className={btnStyle}>
              PLAY
            </button>
          </Link>

          {/* 2. WORKSHOP -> ไปหน้า Workshop */}
          <Link href="/workshop">
            <button className={btnStyle}>
              WORKSHOP
            </button>
          </Link>

          {/* 3. AVATAR -> ไปหน้า Login (เพราะต้อง Login ก่อน) */}
          <Link href="/auth/login">
            <button className={btnStyle}>
              AVATAR CUSTOMIZE
            </button>
          </Link>
        </div>
      </div>

      {/* --- Decorative Pixel Char (Bottom Left) --- */}
      <div className="absolute bottom-4 left-4 z-10">
        {/* ใส่เป็น icon สมมติแทน pixel art knight */}
        <div className="w-16 h-16 bg-slate-700 border-4 border-white flex items-center justify-center text-3xl">
          🛡️
        </div>
      </div>

    </div>
  );
}