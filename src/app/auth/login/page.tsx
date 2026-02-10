'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock } from 'lucide-react';
import { Cinzel } from 'next/font/google';

const cinzel = Cinzel({ subsets: ['latin'], weight: ['400', '700'] });

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // --- ฟังก์ชัน Google Login ---
  const handleGoogleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // Login เสร็จ ให้เด้งกลับมาหน้าแรกของเว็บเรา
        redirectTo: `${window.location.origin}/`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
    }
  };
  // ---------------------------

  const handleLogin = async () => {
    setLoading(true);
    setErrorMsg('');
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
    } else {
      router.push('/'); 
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center relative bg-[#d4c5a2] ${cinzel.className}`}>
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')] opacity-70 pointer-events-none"></div>

      <div className="z-10 w-full max-w-md p-8">
        
        {/* Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="bg-[#8B4513] p-3 rounded-lg border-2 border-[#5A2D0C] shadow-lg mb-2">
             <Lock className="text-[#F4E4BC] w-8 h-8" />
          </div>
          <h1 className="text-5xl font-bold text-[#3e2723] drop-shadow-md">Login</h1>
        </div>

        <div className="space-y-4">
          
          {/* --- ปุ่ม Google Login (เด่นๆ) --- */}
          <button 
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-3 bg-white text-[#5d4037] font-bold rounded-lg shadow-md hover:bg-gray-50 active:translate-y-1 transition-all border-2 border-[#bcaaa4] flex items-center justify-center gap-3"
          >
            {/* Google Icon SVG */}
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.2 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Sign in with Google
          </button>
          
          <div className="flex items-center gap-2 opacity-50">
             <div className="h-[1px] bg-[#3e2723] flex-1"></div>
             <span className="text-xs font-bold text-[#3e2723]">OR EMAIL</span>
             <div className="h-[1px] bg-[#3e2723] flex-1"></div>
          </div>

          {/* Email Login Form */}
          <div className="space-y-3">
            <input 
              type="email" 
              placeholder="Email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-md bg-white border-2 border-[#bcaaa4] focus:border-[#8B4513] text-[#5d4037]" 
            />
            <input 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-md bg-white border-2 border-[#bcaaa4] focus:border-[#8B4513] text-[#5d4037]" 
            />
            <button 
              onClick={handleLogin}
              disabled={loading}
              className="w-full py-3 bg-[#212121] text-white font-bold rounded-lg shadow-lg hover:bg-[#424242] border-2 border-[#616161]"
            >
              {loading ? 'Processing...' : 'Enter Tavern'}
            </button>
          </div>
          
          {errorMsg && (
            <div className="p-2 bg-[#ffebee] border border-red-300 text-red-800 text-center rounded text-sm mt-2">
              ⚠️ {errorMsg}
            </div>
          )}

          <div className="text-center text-sm font-bold text-[#5d4037]">
             <Link href="/" className="underline hover:opacity-100 opacity-60">Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}