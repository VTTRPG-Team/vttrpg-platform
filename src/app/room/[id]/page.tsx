'use client';
import { Map, Users, Dice5 } from 'lucide-react';
import GeminiChat from '@/app/ai-gm/ai_gm';

export default function GameRoom({ params }: { params: { id: string } }) {

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 overflow-hidden">
      
      {/* --- ส่วนที่ 1 (ซ้าย): พื้นที่กระดาน & ผู้เล่น (Board Area) --- */}
      <div className="flex-1 flex flex-col relative border-r border-slate-700">
        {/* Top Bar: ชื่อห้อง & เมนู */}
        <div className="h-14 bg-slate-800 flex items-center px-4 justify-between border-b border-slate-700">
          <h2 className="font-bold flex items-center gap-2"><Map size={18}/> Room: {params.id}</h2>
          <div className="flex gap-2">
            <button className="p-2 bg-slate-700 rounded hover:bg-slate-600"><Users size={18}/></button>
          </div>
        </div>

        {/* Game Board */}
        <div className="flex-1 bg-slate-950 relative grid place-items-center bg-[radial-gradient(#333_1px,transparent_1px)] [background-size:16px_16px]">
          <span className="text-slate-500">[ พื้นที่สำหรับวาง Map & Token ]</span>
          <div className="absolute bottom-4 left-4 p-4 bg-slate-800/90 rounded-lg border border-slate-600 backdrop-blur">
            <div className="flex items-center gap-2 text-yellow-400 font-bold">
               <Dice5 /> ทอยเต๋า: 18
            </div>
          </div>
        </div>
      </div>

      {/* --- ส่วนที่ 2 (ขวา): แชท & AI --- */}
      <div className="w-96 h-full"> 
         <GeminiChat />
      </div>

    </div>
  );
}