'use client'
import { useGameStore } from '@/store/useGameStore'
import { Cinzel } from 'next/font/google'
import { Sword } from 'lucide-react'
import { useEffect } from 'react'

const cinzel = Cinzel({ subsets: ['latin'], weight: ['700'] });

export default function QuickChoices() {
  const { quickChoices, clearQuickChoices, submitPlayerAction, myUsername } = useGameStore();

  // 🌟 [เพิ่มใหม่] ดักจับ Event เวลาผู้เล่นพิมพ์ส่งข้อความเองในแชท
  useEffect(() => {
    const handleManualSubmit = () => {
      // ถ้ามีการส่งข้อความ (Manual Type) ให้ล้าง QuickChoices และหยุดเวลาทันที
      if (quickChoices && quickChoices.length > 0) {
        clearQuickChoices();
      }
    };

    // ดักจับ Event 'chat-submitted' (หรือถ้าคุณใช้ชื่ออื่นใน Chat Input ให้เปลี่ยนชื่อให้ตรงกัน)
    // หรือดักจาก 'quick-action-selected' ที่เราสร้างเองก็ได้
    window.addEventListener('chat-submitted', handleManualSubmit);
    window.addEventListener('quick-action-selected', handleManualSubmit);

    return () => {
      window.removeEventListener('chat-submitted', handleManualSubmit);
      window.removeEventListener('quick-action-selected', handleManualSubmit);
    };
  }, [quickChoices, clearQuickChoices]);

  // ถ้าไม่มีตัวเลือกให้ซ่อน UI นี้ไปเลย
  if (!quickChoices || quickChoices.length === 0) return null;

  const handleSelect = (choice: string) => {
    // 1. ส่ง Action ของเราเข้า Store
    submitPlayerAction(myUsername || 'Player', choice);

    // 2. แจ้งบอกระบบว่ามีการเลือกแล้ว (เพื่อไปปิด Timer ในส่วนอื่นๆ)
    const customEvent = new CustomEvent('quick-action-selected', { detail: choice });
    window.dispatchEvent(customEvent);
    
    // 3. พอกดปุ๊บ ซ่อนปุ่มทันทีเพื่อไม่ให้กดย้ำ
    clearQuickChoices();
  }

  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[100] flex flex-col items-center gap-4 pointer-events-auto w-full max-w-lg bg-black/60 p-8 rounded-xl backdrop-blur-md shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-[#3e2723]">
        
       <div className="bg-[#1a0f0a] px-6 py-2 rounded-full border border-[#F4E4BC]/50 text-[#F4E4BC] text-sm tracking-widest uppercase animate-pulse flex items-center gap-2 shadow-[0_0_15px_rgba(244,228,188,0.2)]">
          <Sword size={16} /> What is your action? <Sword size={16} className="transform scale-x-[-1]" />
       </div>
       
       <div className="flex flex-col gap-3 w-full mt-2">
          {quickChoices.map((choice, idx) => (
             <button 
               key={idx}
               onClick={() => handleSelect(choice)}
               className="relative overflow-hidden group bg-gradient-to-r from-[#2a1d15] to-[#1a0f0a] border-2 border-[#5d4037] hover:border-[#F4E4BC] rounded-lg p-4 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(244,228,188,0.3)] text-left flex items-center justify-between"
             >
                <div className="absolute inset-0 bg-[#F4E4BC] opacity-0 group-hover:opacity-10 transition-opacity" />
                
                <span className={`${cinzel.className} text-[#F4E4BC] text-base md:text-lg font-bold z-10 drop-shadow-md pr-4`}>
                   {choice}
                </span>
                
                <div className="w-8 h-8 rounded-full border border-[#5d4037] group-hover:border-[#F4E4BC] flex-shrink-0 flex items-center justify-center text-[#5d4037] group-hover:text-[#F4E4BC] font-bold transition-colors z-10">
                   {idx + 1}
                </div>
             </button>
          ))}
       </div>

       <button 
          onClick={() => {
            // เมื่อกดพิมพ์เอง ให้เคลียร์สถานะทอยเต๋า/ช้อยส์ทันทีเพื่อให้เวลามันหายไป
            clearQuickChoices();
          }} 
          className="mt-4 text-xs text-[#a1887f] hover:text-white underline uppercase tracking-widest transition-colors"
       >
          Or type your own action
       </button>
    </div>
  );
}