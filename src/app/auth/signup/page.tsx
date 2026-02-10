'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Lock } from 'lucide-react'; // ใช้ไอคอนกุญแจแทน Pixel Art ไปก่อน (หรือใส่ <img> แทนได้)
import { useRouter } from 'next/navigation';
import { Cinzel } from 'next/font/google'; // โหลดฟอนต์แฟนตาซี

// เรียกใช้ฟอนต์
const cinzel = Cinzel({ subsets: ['latin'], weight: ['400', '700'] });

export default function SignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const handleSignup = async () => {
    if (!email || !password || !username) {
      setMsg('❌ กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
    
    setLoading(true);
    setMsg('');

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // *** ทีเด็ด: ส่ง username ไปพร้อมการสมัคร ***
          data: {
            username: username, 
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        setMsg('✅ สมัครสมาชิกสำเร็จ! กำลังเข้าสู่โลก...');
        // รอแป๊บนึงแล้วดีดไปหน้า Main menu
        setTimeout(() => router.push('/'), 1500);
      }
    } catch (err: any) {
      setMsg(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    // พื้นหลังลายแผนที่ (สมมติว่ามีไฟล์ map-bg.jpg หรือใช้สีแทนไปก่อน)
    <div className={`min-h-screen flex items-center justify-center relative bg-[#d4c5a2] ${cinzel.className}`}>
      
      {/* Background Texture (Overlay ลายกระดาษเก่า) */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')] opacity-70 pointer-events-none"></div>
      
      {/* Decorative Corners (Goblin & Dwarf) */}
      {/* คุณสามารถเปลี่ยน src เป็น path รูปในเครื่องเช่น /images/goblin.png */}
      <img src="https://img.icons8.com/color/96/troll.png" alt="Goblin" className="absolute bottom-4 left-4 w-24 h-24 drop-shadow-lg animate-bounce" />
      <img src="https://img.icons8.com/color/96/dwarf.png" alt="Dwarf" className="absolute bottom-4 right-4 w-24 h-24 drop-shadow-lg animate-pulse" />

      {/* Main Form Container */}
      <div className="z-10 w-full max-w-md p-8">
        
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-[#8B4513] p-3 rounded-lg border-2 border-[#5A2D0C] shadow-lg mb-2">
             <Lock className="text-[#F4E4BC] w-8 h-8" />
          </div>
          <h1 className="text-5xl font-bold text-[#3e2723] drop-shadow-md">Register</h1>
        </div>

        {/* Form Inputs */}
        <div className="space-y-6">
          
          {/* Name Input */}
          <div className="space-y-1">
            <label className="text-[#3e2723] font-bold text-sm ml-1">Name</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="SomChai"
              className="w-full px-4 py-3 rounded-md bg-white border-2 border-[#bcaaa4] focus:border-[#8B4513] focus:outline-none text-[#5d4037] placeholder-[#d7ccc8] shadow-inner"
            />
          </div>

          {/* Password Input */}
          <div className="space-y-1">
            <label className="text-[#3e2723] font-bold text-sm ml-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="******"
              className="w-full px-4 py-3 rounded-md bg-white border-2 border-[#bcaaa4] focus:border-[#8B4513] focus:outline-none text-[#5d4037] placeholder-[#d7ccc8] shadow-inner"
            />
          </div>

          {/* Email Input */}
          <div className="space-y-1">
            <label className="text-[#3e2723] font-bold text-sm ml-1">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ake123@gmail.com"
              className="w-full px-4 py-3 rounded-md bg-white border-2 border-[#bcaaa4] focus:border-[#8B4513] focus:outline-none text-[#5d4037] placeholder-[#d7ccc8] shadow-inner"
            />
          </div>

          {/* Submit Button */}
          <button 
            onClick={handleSignup}
            disabled={loading}
            className="w-full mt-8 py-3 bg-[#212121] text-white text-lg font-bold rounded-lg shadow-lg hover:bg-[#424242] active:translate-y-1 transition-all border-2 border-[#616161]"
          >
            {loading ? 'Creating...' : 'Submit'}
          </button>
          
          {/* Error Message */}
          {msg && (
            <div className="p-2 bg-[#ffebee] border border-red-300 text-red-800 text-center rounded text-sm font-sans mt-4">
              {msg}
            </div>
          )}

          {/* Back Link */}
          <div className="text-center mt-4">
             <button onClick={() => router.back()} className="text-[#5d4037] underline hover:text-[#8B4513] text-sm font-sans font-bold">
               Back to Home
             </button>
          </div>

        </div>
      </div>
    </div>
  );
}