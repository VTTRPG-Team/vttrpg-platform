'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { Cinzel, Crimson_Text } from 'next/font/google';

// Font Setup
const cinzel = Cinzel({ subsets: ['latin'], weight: ['700', '900'] });
const crimson = Crimson_Text({ subsets: ['latin'], weight: ['400', '600', '700'] });

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleGoogleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    });
    if (error) { setErrorMsg(error.message); setLoading(false); }
  };

  const handleLogin = async () => {
    setLoading(true);
    setErrorMsg('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setErrorMsg(error.message); setLoading(false); } 
    else { router.push('/'); }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center relative overflow-hidden bg-[#262626] ${crimson.className}`}>
      
      {/* --- 1. Background Image (Paper & Sword Table) --- */}
      {/* ใช้วิธี img tag เพื่อความชัวร์ (ตรวจสอบชื่อไฟล์ให้ตรงกับใน public นะครับ) */}
      <div className="absolute inset-0 z-0">
        <img 
            src="/bg-login.jpg" 
            alt="Tabletop Background" 
            className="w-full h-full object-cover"
        />
        {/* Overlay เงาดำจางๆ ทับรูปเพื่อให้ตัวหนังสืออ่านง่ายขึ้น */}
        <div className="absolute inset-0 bg-black/10" />
      </div>

      {/* --- 2. Main Login Form Container --- */}
      {/* ปรับตำแหน่งให้วางอยู่ตรงกลางกระดาษ (ขึ้นอยู่กับรูป ถ้าข้อความไม่ตรงกลาง ปรับ mt- หรือ pt- ได้ครับ) */}
      <div className="relative z-10 w-full max-w-md p-8 animate-fade-in-up">
        
        <div className="flex flex-col items-center justify-center text-center space-y-6">
            
            {/* Header: Adventurer Guild */}
            <div className="space-y-2">
                <h1 className={`${cinzel.className} text-4xl font-black text-[#3e2723] leading-tight drop-shadow-sm`}>
                  ADVENTURER<br/>GUILD
                </h1>
                <div className="w-16 h-1 bg-[#8b5e3c] rounded-full mx-auto opacity-70"></div>
                <p className="text-[#5d4037] text-lg italic font-bold">
                  "Sign in to start your legend"
                </p>
            </div>

            {/* Login Form Inputs */}
            <div className="w-full space-y-4 pt-4 px-4">
              <div className="space-y-1 text-left">
                <label className="text-xs font-bold text-[#5d4037] uppercase tracking-wider ml-1">Email</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-[#fdfbf7]/60 border border-[#8b5e3c]/30 text-[#3e2723] font-bold focus:outline-none focus:ring-2 focus:ring-[#8b5e3c] focus:bg-[#fdfbf7] transition-all placeholder-[#8b5e3c]/50 shadow-inner"
                  placeholder="hero@guild.com"
                />
              </div>

              <div className="space-y-1 text-left">
                <label className="text-xs font-bold text-[#5d4037] uppercase tracking-wider ml-1">Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-[#fdfbf7]/60 border border-[#8b5e3c]/30 text-[#3e2723] font-bold focus:outline-none focus:ring-2 focus:ring-[#8b5e3c] focus:bg-[#fdfbf7] transition-all placeholder-[#8b5e3c]/50 shadow-inner"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="w-full space-y-3 pt-2 px-4">
                <button 
                  onClick={handleLogin}
                  disabled={loading}
                  className="w-full py-3 bg-[#3e2723] hover:bg-[#261815] text-[#f4e4bc] font-bold rounded-lg shadow-lg transform active:scale-[0.98] transition-all flex items-center justify-center gap-2 uppercase tracking-wide border border-[#261815]"
                >
                  {loading ? <Sparkles className="animate-spin w-5 h-5"/> : 'Open the Gate'}
                </button>

                <div className="relative flex py-2 items-center w-full">
                    <div className="flex-grow border-t border-[#8b5e3c]/40"></div>
                    <span className="flex-shrink mx-4 text-[#8b5e3c] text-sm font-bold opacity-70">or</span>
                    <div className="flex-grow border-t border-[#8b5e3c]/40"></div>
                </div>

                <button 
                  onClick={handleGoogleLogin}
                  className="w-full py-3 bg-white/80 border border-[#d7c9a3] text-[#5d4037] font-bold rounded-lg shadow-sm hover:bg-white transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.2 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                  <span>Google</span>
                </button>
            </div>

            <div className="text-center pt-2">
                 <Link href="/" className="text-[#8b5e3c] hover:text-[#5d4037] text-sm hover:underline font-bold transition-colors">
                    Back to Main Menu
                 </Link>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-100/90 border border-red-200 text-red-800 text-sm rounded text-center w-full">
                {errorMsg}
              </div>
            )}
        </div>
      </div>
      
      {/* --- Decoration: น้องมังกรน่ารัก (ขวาล่าง) --- */}
      <div className="absolute -bottom-10 -right-10 z-30 hidden md:block pointer-events-none">
          <img 
            src="https://images.unsplash.com/photo-1599704215207-911120a61162?q=80&w=2669&auto=format&fit=crop" 
            alt="Cute Dragon Mascot"
            className="w-[280px] h-auto drop-shadow-2xl transform -rotate-12 hover:rotate-0 transition-transform duration-500"
          />
      </div>

    </div>
  );
}