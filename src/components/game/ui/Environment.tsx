'use client'
import { useState, useEffect } from 'react'
import { Zap, Moon } from 'lucide-react'

export default function Environment() {
  const [isShaking, setIsShaking] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (isShaking) document.body.classList.add('fx-shake-screen');
    else document.body.classList.remove('fx-shake-screen');
    return () => document.body.classList.remove('fx-shake-screen');
  }, [isShaking]);

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 800); 
  };

  useEffect(() => {
    const handleAIEffects = (e: any) => {
      const action = e.detail?.action;
      if (action === 'shake') triggerShake();
      if (action === 'dark_on') setIsDark(true);
      if (action === 'dark_off') setIsDark(false);
    };
    
    window.addEventListener('ai-fx', handleAIEffects);
    return () => window.removeEventListener('ai-fx', handleAIEffects);
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shake-screen {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          10%, 30%, 50%, 70%, 90% { transform: translate(-4px, 3px) rotate(-1deg); }
          20%, 40%, 60%, 80% { transform: translate(4px, -3px) rotate(1deg); }
        }
        .fx-shake-screen {
          animation: shake-screen 0.4s cubic-bezier(.36,.07,.19,.97) infinite;
        }
      `}} />

      <div 
        className={`fixed inset-0 z-[8000] pointer-events-none transition-all duration-1000 ease-in-out ${isDark ? 'opacity-100' : 'opacity-0'}`}
        style={{
          background: 'radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.95) 100%)',
          boxShadow: 'inset 0 0 150px rgba(0,0,0,1)'
        }}
      />

      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] flex gap-3 pointer-events-auto">
         <button onClick={triggerShake} className="bg-[#c2410c] hover:bg-[#ea580c] text-white px-4 py-2 rounded-lg text-sm font-bold shadow-[0_4px_0_rgb(154,52,18)] active:shadow-[0_0px_0_rgb(154,52,18)] active:translate-y-1 flex items-center gap-2 transition-all border-2 border-[#7c2d12]">
            <Zap size={16} /> SHAKE
         </button>
         <button onClick={() => setIsDark(!isDark)} className="bg-[#4c1d95] hover:bg-[#5b21b6] text-white px-4 py-2 rounded-lg text-sm font-bold shadow-[0_4px_0_rgb(59,7,100)] active:shadow-[0_0px_0_rgb(59,7,100)] active:translate-y-1 flex items-center gap-2 transition-all border-2 border-[#2e1065]">
            <Moon size={16} /> {isDark ? 'LIGHT UP' : 'DARK MODE'}
         </button>
      </div>
    </>
  )
}