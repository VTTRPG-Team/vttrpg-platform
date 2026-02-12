'use client';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
// Import ไอคอนครบชุด (รวม Eye, EyeOff สำหรับระบบฉายา)
import { Home, LogOut, Edit2, Save, X, Camera, Scroll, Crown, Star, Medal, Sword, Eye, EyeOff } from 'lucide-react';
import { Cinzel, Crimson_Text } from 'next/font/google';

const cinzel = Cinzel({ subsets: ['latin'], weight: ['700', '900'] });
const crimson = Crimson_Text({ subsets: ['latin'], weight: ['400', '600', '700'] });

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Edit Mode States
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Image Upload States
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  // --- ข้อมูลฉายาจำลอง (Mock Titles) ---
  const allTitles = [
    { id: 1, name: "The Awakened", icon: <Star size={18} />, color: "text-yellow-400", bg: "bg-yellow-900/30", border: "border-yellow-600/50" },
    { id: 2, name: "Dungeon Walker", icon: <Medal size={18} />, color: "text-blue-400", bg: "bg-blue-900/30", border: "border-blue-600/50" },
    { id: 3, name: "First Blood", icon: <Sword size={18} className="text-red-500" />, color: "text-red-400", bg: "bg-red-900/30", border: "border-red-600/50" },
  ];

  // เก็บ ID ของฉายาที่เลือกโชว์ (เริ่มต้นให้โชว์หมด [1,2,3])
  const [visibleTitleIds, setVisibleTitleIds] = useState<number[]>([1, 2, 3]);

  // ฟังก์ชันสลับสถานะฉายา (Show/Hide)
  const toggleTitle = (id: number) => {
    if (visibleTitleIds.includes(id)) {
      setVisibleTitleIds(visibleTitleIds.filter(tid => tid !== id)); // เอาออก
    } else {
      setVisibleTitleIds([...visibleTitleIds, id]); // ใส่เพิ่ม
    }
  };

  // 1. Fetch Profile
  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }
      setUser(user);

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (data) {
        setProfile(data);
        setEditName(data.username || '');
      }
      setLoading(false);
    };
    getProfile();
  }, [router]);

  // 2. Handle Image Upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) return;

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      // ตั้งชื่อไฟล์ให้ไม่ซ้ำกันด้วย Date.now()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;

      // Upload (อย่าลืมแก้ Policy ใน Supabase ก่อนนะครับ)
      let { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update Database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setProfile({ ...profile, avatar_url: publicUrl });
      alert('Avatar updated successfully!');

    } catch (error: any) {
      alert('Upload Failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  // 3. Save Profile
  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      const { error } = await supabase
        .from('profiles')
        .update({ username: editName })
        .eq('id', user.id);

      if (error) throw error;

      setProfile({ ...profile, username: editName });
      setIsEditing(false);
      // หมายเหตุ: การซ่อนฉายานี้เป็นแค่ Local State ถ้าจะให้จำค่าถาวรต้องสร้าง Table เก็บเพิ่ม
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-red-600 font-bold animate-pulse">Loading...</div>;

  return (
    <div className={`min-h-screen flex items-center justify-center relative bg-black ${crimson.className}`}>
      
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img src="/dungeon_gate.jpg" alt="BG" className="w-full h-full object-cover opacity-40 blur-sm" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30" />
      </div>

      <div className="relative z-10 w-full max-w-5xl bg-[#1a120b] border-4 border-[#3e2723] rounded-lg shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px] animate-fade-in-up">
        
        {/* Decorations */}
        <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-red-800 rounded-tl-lg pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-red-800 rounded-tr-lg pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-red-800 rounded-bl-lg pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-red-800 rounded-br-lg pointer-events-none"></div>

        {/* --- LEFT COLUMN --- */}
        <div className="w-full md:w-1/3 bg-[#0f0a08] border-r-4 border-[#3e2723] p-8 flex flex-col items-center relative">
           
           {/* Avatar */}
           <div className="relative group w-48 h-48 mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-red-900 to-black rounded-full animate-pulse-slow blur-md"></div>
              <img 
                src={profile?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.id}`} 
                alt="Avatar" 
                className="relative w-full h-full rounded-full border-4 border-[#8B4513] object-cover bg-[#1a120b] shadow-2xl"
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-2 right-2 p-3 bg-red-900 text-white rounded-full border-2 border-[#F4E4BC] hover:bg-red-700 hover:scale-110 transition-all shadow-lg opacity-90"
                title="Change Avatar"
              >
                {uploading ? <span className="animate-spin text-xs">⏳</span> : <Camera size={20} />}
              </button>
              <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
           </div>

           <div className="bg-[#3e2723] px-6 py-2 rounded-full border border-red-900/50 shadow-inner mb-8">
              <span className={`${cinzel.className} text-[#F4E4BC] font-bold text-lg uppercase tracking-widest`}>
                {profile?.role || 'Novice'}
              </span>
           </div>

           <div className="mt-auto w-full space-y-3">
              <Link href="/" className="w-full">
                <button className="w-full py-3 bg-[#2a1d15] text-[#a1887f] font-bold uppercase tracking-wider border border-[#5d4037] hover:bg-[#3e2723] hover:text-[#F4E4BC] hover:border-[#F4E4BC] transition-all flex items-center justify-center gap-2">
                   <Home size={18} /> Return Home
                </button>
              </Link>
              <button onClick={handleLogout} className="w-full py-3 bg-red-950/50 text-red-500 font-bold uppercase tracking-wider border border-red-900/50 hover:bg-red-900 hover:text-white hover:border-red-500 transition-all flex items-center justify-center gap-2">
                 <LogOut size={18} /> Logout
              </button>
           </div>
        </div>

        {/* --- RIGHT COLUMN --- */}
        <div className="w-full md:w-2/3 p-8 md:p-12 relative bg-[#1a1510]/95">
           
           {/* Header & Edit Button */}
           <div className="flex items-center justify-between border-b-2 border-[#3e2723] pb-4 mb-8">
              <h1 className={`${cinzel.className} text-4xl text-[#F4E4BC] drop-shadow-md flex items-center gap-3`}>
                 <Scroll className="text-red-600" size={32} /> Character Sheet
              </h1>
              
              {!isEditing ? (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 text-[#a1887f] hover:text-[#F4E4BC] border border-[#5d4037] hover:border-[#F4E4BC] rounded transition-all uppercase text-sm font-bold tracking-wider"
                >
                  <Edit2 size={16} /> Edit Profile
                </button>
              ) : (
                <div className="flex gap-2">
                   <button onClick={() => setIsEditing(false)} className="p-2 text-red-500 hover:text-red-400 border border-red-900/50 rounded" title="Cancel"><X size={20} /></button>
                   <button onClick={handleSaveProfile} disabled={isSaving} className="flex items-center gap-2 px-4 py-2 bg-green-900/80 text-green-100 hover:bg-green-800 border border-green-700 rounded transition-all uppercase text-sm font-bold tracking-wider">
                      {isSaving ? 'Saving...' : <><Save size={16} /> Save</>}
                   </button>
                </div>
              )}
           </div>

           <div className="grid grid-cols-1 gap-8">
              
              {/* Name Field */}
              <div className="relative p-6 bg-[#0f0a08] border border-[#3e2723] rounded-lg shadow-inner">
                 <label className="absolute -top-3 left-4 bg-[#1a1510] px-2 text-[#8B4513] text-xs font-bold uppercase tracking-widest border border-[#3e2723]">Character Name</label>
                 {isEditing ? (
                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full bg-transparent border-b border-[#5d4037] text-2xl text-[#F4E4BC] font-bold focus:outline-none focus:border-red-500 transition-colors py-1"/>
                 ) : (
                    <h2 className="text-3xl text-[#F4E4BC] font-bold tracking-wide">{profile?.username || 'Unknown Hero'}</h2>
                 )}
              </div>

              {/* Email */}
              <div className="relative p-6 bg-[#0f0a08] border border-[#3e2723] rounded-lg shadow-inner opacity-70">
                 <label className="absolute -top-3 left-4 bg-[#1a1510] px-2 text-[#5d4037] text-xs font-bold uppercase tracking-widest border border-[#3e2723]">Soul Binding (Email)</label>
                 <div className="flex items-center gap-3 text-xl text-[#a1887f]">
                    <span className="font-mono">{user?.email}</span>
                    <span className="text-xs bg-[#3e2723] text-[#a1887f] px-2 py-0.5 rounded border border-[#5d4037]">LOCKED</span>
                 </div>
              </div>

              {/* --- 🏆 Titles System (Show/Hide Toggle) --- */}
              <div className="relative pt-4">
                 <div className="flex items-center gap-2 mb-3">
                    <Crown size={20} className="text-yellow-500" />
                    <h3 className={`${cinzel.className} text-[#F4E4BC] text-lg font-bold uppercase tracking-wider`}>
                       Titles & Honors
                    </h3>
                    {isEditing && <span className="text-xs text-red-400 ml-auto animate-pulse">(Click to toggle visibility)</span>}
                 </div>
                 
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {allTitles.map((title) => {
                       // เช็คว่าตอนนี้กำลังโชว์อยู่ไหม
                       const isVisible = visibleTitleIds.includes(title.id);
                       
                       // ถ้าไม่ใช่โหมด Edit และฉายานั้นปิดอยู่ -> ไม่ต้องเรนเดอร์ออกมาเลย
                       if (!isEditing && !isVisible) return null;

                       return (
                         <div 
                           key={title.id} 
                           onClick={() => isEditing && toggleTitle(title.id)} // กดได้เฉพาะตอน Edit
                           className={`
                             flex items-center gap-3 p-3 rounded border transition-all relative
                             ${title.bg} ${title.border}
                             ${isEditing ? 'cursor-pointer hover:brightness-125' : 'cursor-default'}
                             ${!isVisible && isEditing ? 'opacity-40 grayscale' : 'opacity-100'}
                           `}
                         >
                            <div className={`p-2 rounded-full bg-black/50 ${title.color}`}>
                               {title.icon}
                            </div>
                            <div className="flex-1">
                               <h4 className={`font-bold ${title.color} leading-none`}>{title.name}</h4>
                               <span className="text-[10px] text-[#a1887f] uppercase tracking-wider opacity-70">Earned</span>
                            </div>
                            
                            {/* ไอคอนตา (Eye) บอกสถานะตอน Edit */}
                            {isEditing && (
                              <div className="absolute top-2 right-2 text-[#a1887f]">
                                {isVisible ? <Eye size={16}/> : <EyeOff size={16}/>}
                              </div>
                            )}
                         </div>
                       );
                    })}
                 </div>
              </div>

           </div>
           
           <div className="mt-8 pt-6 border-t border-[#3e2723]/50 text-center">
              <p className="text-[#5d4037] italic font-serif text-sm">"A true hero is measured not by their strength, but by their deeds."</p>
           </div>
        </div>
      </div>
    </div>
  );
}