'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Scroll, Sparkles, UserPlus, Shield, Mail, Key } from 'lucide-react';
import { Cinzel, Crimson_Text } from 'next/font/google';

// Font Setup
const cinzel = Cinzel({ subsets: ['latin'], weight: ['700', '900'] });
const crimson = Crimson_Text({ subsets: ['latin'], weight: ['400', '600', '700'] });

export default function SignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  const handleSignup = async () => {
    if (!email || !password || !username) {
      setMsg({ text: 'Please fill in all fields to join the guild.', type: 'error' });
      return;
    }
    
    setLoading(true);
    setMsg(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // ส่งชื่อตัวละคร (Username) ไปเก็บใน metadata ของ user
          data: {
            username: username, 
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        setMsg({ text: 'Registration Successful! Check your owl post (email) to confirm.', type: 'success' });
        // รอ 2 วินาทีก่อนกลับไปหน้า Login
        setTimeout(() => router.push('/login'), 2000);
      }
    } catch (err: any) {
      setMsg({ text: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center relative overflow-hidden bg-[#1a1510] ${crimson.className}`}>
      
      {/* --- 1. Background Image (ใช้รูปเดียวกับ Login เพื่อความต่อเนื่อง) --- */}
      <div className="absolute inset-0 z-0">
        <img 
            src="/bg-login.jpg" 
            alt="Tabletop Background HD" 
            className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* --- 2. Main Register Form --- */}
      <div className="relative z-10 w-full max-w-md p-8 animate-fade-in-up">
        
        <div className="flex flex-col items-center justify-center text-center space-y-6">
            
            {/* Header: New Recruit */}
            <div className="space-y-2">
                <h1 className={`${cinzel.className} text-3xl font-black text-[#3e2723] leading-tight drop-shadow-sm uppercase`}>
                  New Recruit<br/>Registration
                </h1>
                <div className="w-16 h-1 bg-[#8b5e3c] rounded-full mx-auto opacity-70"></div>
                <p className="text-[#5d4037] text-lg italic font-bold">
                  "Join the guild, start your journey."
                </p>
            </div>

            {/* Form Inputs */}
            <div className="w-full space-y-4 pt-2 px-4">
              
              {/* Username */}
              <div className="space-y-1 text-left">
                <label className="flex items-center gap-2 text-xs font-bold text-[#5d4037] uppercase tracking-wider ml-1">
                   <Shield size={14} /> Adventurer Name
                </label>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-[#fdfbf7]/60 border border-[#8b5e3c]/30 text-[#3e2723] font-bold focus:outline-none focus:ring-2 focus:ring-[#8b5e3c] focus:bg-[#fdfbf7] transition-all placeholder-[#8b5e3c]/50 shadow-inner"
                  placeholder="e.g. Aragorn"
                />
              </div>

              {/* Email */}
              <div className="space-y-1 text-left">
                <label className="flex items-center gap-2 text-xs font-bold text-[#5d4037] uppercase tracking-wider ml-1">
                   <Mail size={14} /> Email Scroll
                </label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-[#fdfbf7]/60 border border-[#8b5e3c]/30 text-[#3e2723] font-bold focus:outline-none focus:ring-2 focus:ring-[#8b5e3c] focus:bg-[#fdfbf7] transition-all placeholder-[#8b5e3c]/50 shadow-inner"
                  placeholder="hero@guild.com"
                />
              </div>

              {/* Password */}
              <div className="space-y-1 text-left">
                <label className="flex items-center gap-2 text-xs font-bold text-[#5d4037] uppercase tracking-wider ml-1">
                   <Key size={14} /> Secret Password
                </label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-[#fdfbf7]/60 border border-[#8b5e3c]/30 text-[#3e2723] font-bold focus:outline-none focus:ring-2 focus:ring-[#8b5e3c] focus:bg-[#fdfbf7] transition-all placeholder-[#8b5e3c]/50 shadow-inner"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="w-full space-y-3 pt-4 px-4">
                <button 
                  onClick={handleSignup}
                  disabled={loading}
                  className="w-full py-3 bg-[#3e2723] hover:bg-[#261815] text-[#f4e4bc] font-bold rounded-lg shadow-lg transform active:scale-[0.98] transition-all flex items-center justify-center gap-2 uppercase tracking-wide border border-[#261815]"
                >
                  {loading ? <Sparkles className="animate-spin w-5 h-5"/> : (
                    <>
                        <UserPlus size={18} /> Sign The Contract
                    </>
                  )}
                </button>
            </div>

            {/* Footer Link */}
            <div className="text-center pt-2">
                 <span className="text-[#5d4037] text-sm font-bold mr-2">Already a member?</span>
                 <Link href="/login" className="text-[#8b5e3c] hover:text-[#3e2723] text-sm hover:underline font-black uppercase">
                    Login Here
                 </Link>
            </div>

            {/* Message Box */}
            {msg && (
              <div className={`p-3 border text-sm rounded-lg text-center w-full shadow-sm animate-pulse ${
                  msg.type === 'success' 
                  ? 'bg-green-100/90 border-green-300 text-green-800' 
                  : 'bg-red-100/90 border-red-300 text-red-800'
              }`}>
                {msg.text}
              </div>
            )}
        </div>
      </div>
      
      {/* Dragon Mascot (Optional: เอาออกก็ได้ถ้าไม่อยากให้ซ้ำกับหน้า Login) */}
      <div className="absolute -bottom-10 -left-10 z-30 hidden md:block pointer-events-none">
          <img 
            src="https://images.unsplash.com/photo-1599704215207-911120a61162?q=80&w=2669&auto=format&fit=crop" 
            alt="Cute Dragon Mascot"
            className="w-[250px] h-auto drop-shadow-2xl transform rotate-12 hover:rotate-0 transition-transform duration-500 scale-x-[-1]" 
            // scale-x-[-1] คือกลับด้านมังกรให้หันมาอีกทาง (จะได้ไม่ซ้ำกับหน้า Login)
          />
      </div>

    </div>
  );
}