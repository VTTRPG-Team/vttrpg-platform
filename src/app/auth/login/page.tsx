'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock } from 'lucide-react';
import { Cinzel } from 'next/font/google';

// โหลดฟอนต์ RPG
const cinzel = Cinzel({ subsets: ['latin'], weight: ['400', '700'] });

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async () => {
    setLoading(true);
    setErrorMsg('');

    // ส่งข้อมูล Login
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
    } else {
      // ✅ แก้ไข: Login ผ่านแล้วกลับไปหน้า Main Menu (เพื่อดูป้ายชื่อ)
      router.push('/'); 
    }
  };

  return (
    // พื้นหลังธีมแผนที่ (Map Theme)
    <div className={`min-h-screen flex items-center justify-center relative bg-[#d4c5a2] ${cinzel.className}`}>
      
      {/* Texture กระดาษเก่า */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')] opacity-70 pointer-events-none"></div>

      {/* Main Form Container */}
      <div className="z-10 w-full max-w-md p-8">
        
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-[#8B4513] p-3 rounded-lg border-2 border-[#5A2D0C] shadow-lg mb-2">
             <Lock className="text-[#F4E4BC] w-8 h-8" />
          </div>
          <h1 className="text-5xl font-bold text-[#3e2723] drop-shadow-md">Login</h1>
          <p className="text-[#5d4037] mt-2 italic opacity-80">Welcome back, Adventurer.</p>
        </div>

        {/* Form Inputs */}
        <div className="space-y-6">
          
          {/* Email Input */}
          <div className="space-y-1">
            <label className="text-[#3e2723] font-bold text-sm ml-1">Email</label>
            <input 
              type="email" 
              placeholder="Enter your email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-md bg-white border-2 border-[#bcaaa4] focus:border-[#8B4513] focus:outline-none text-[#5d4037] placeholder-[#d7ccc8] shadow-inner" 
            />
          </div>

          {/* Password Input */}
          <div className="space-y-1">
            <label className="text-[#3e2723] font-bold text-sm ml-1">Password</label>
            <input 
              type="password" 
              placeholder="******" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-md bg-white border-2 border-[#bcaaa4] focus:border-[#8B4513] focus:outline-none text-[#5d4037] placeholder-[#d7ccc8] shadow-inner" 
            />
          </div>
          
          {/* Submit Button */}
          <button 
            onClick={handleLogin}
            disabled={loading}
            className="w-full mt-4 py-3 bg-[#212121] text-white text-lg font-bold rounded-lg shadow-lg hover:bg-[#424242] active:translate-y-1 transition-all border-2 border-[#616161] disabled:opacity-70"
          >
            {loading ? 'Opening the Gate...' : 'ENTER TAVERN'}
          </button>
          
          {/* Error Message */}
          {errorMsg && (
            <div className="p-2 bg-[#ffebee] border border-red-300 text-red-800 text-center rounded text-sm font-sans mt-2">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Footer Links */}
          <div className="mt-6 text-center text-sm font-bold text-[#5d4037] space-y-2">
            <div>
              <span>New here? </span>
              <Link href="/auth/signup" className="text-[#8B4513] underline hover:text-[#3e2723]">
                Create new account
              </Link>
            </div>
            <div>
              <Link href="/" className="opacity-60 hover:opacity-100 underline">
                Back to Home
              </Link>
            </div>
          </div>

        </div>
      </div>
      
      {/* Decoration (Optional) */}
      <img src="https://img.icons8.com/color/96/treasure-chest.png" alt="Chest" className="absolute bottom-4 right-4 w-20 h-20 opacity-80" />
    </div>
  );
}