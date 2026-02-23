'use client'
import { useState, useEffect, useCallback } from 'react'
import { VT323 } from 'next/font/google'
import { Check, ChevronRight, X } from 'lucide-react'

const vt323 = VT323({ subsets: ['latin'], weight: ['400'] });

const TUTORIAL_STEPS = [
  {
    targetId: 'tutorial-story-panel',
    title: '📖 The Story Panel',
    text: 'ที่นี่คือกระดานเนื้อเรื่อง Game Master จะคอยบรรยายเหตุการณ์ที่นี่ และคุณสามารถพิมพ์โต้ตอบเพื่อกระทำสิ่งต่างๆ ได้'
  },
  {
    targetId: 'tutorial-video-overlay',
    title: '🎥 Your Party & Status',
    text: 'เช็คเพื่อนร่วมทีมของคุณ เลือด (HP) และ มานา (Mana) จะอยู่ตรงนี้ อย่าลืมเช็คสถานะตัวเองก่อนตัดสินใจทำอะไรเสี่ยงๆ ล่ะ!'
  },
  {
    targetId: 'tutorial-party-chat',
    title: '💬 Party Chat',
    text: 'ไม่อยากพูดออกไมค์? หรืออยากกระซิบวางแผนกับเพื่อนโดยไม่ให้ Game Master (AI) ได้ยิน? ใช้แชทปาร์ตี้ตรงนี้เลย!'
  },
  {
    targetId: 'tutorial-game-controls',
    title: '⚙️ Game Controls',
    text: 'ต้องการพักเบรก หรือโหวตจบเกมเพื่อบันทึกความคืบหน้า? ใช้ปุ่มควบคุมตรงนี้ แต่จำไว้ว่าการจบเกมต้องได้รับเสียงโหวตข้างมากนะ!'
  }
]

export default function TutorialOverlay() {
  const [currentStep, setCurrentStep] = useState(0)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  // เช็คว่าเคยดู Tutorial ไปหรือยัง
  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('hasSeenGameTutorial')
    if (!hasSeenTutorial) {
      setIsVisible(true)
    }
  }, [])

  const step = TUTORIAL_STEPS[currentStep]

  const updateSpotlight = useCallback(() => {
    if (!isVisible) return;
    const el = document.getElementById(step.targetId)
    if (el) {
      const rect = el.getBoundingClientRect()
      setTargetRect(rect)
    } else {
      // ถ้าหา element ไม่เจอ ให้ลองหาใหม่ในอีก 100ms (เผื่อ UI กำลังโหลด)
      setTimeout(() => {
        const retryEl = document.getElementById(step.targetId)
        if (retryEl) setTargetRect(retryEl.getBoundingClientRect())
      }, 100)
    }
  }, [step.targetId, isVisible])

  useEffect(() => {
    updateSpotlight()
    window.addEventListener('resize', updateSpotlight)
    // เพิ่ม scroll listener เผื่อมีการเลื่อนจอ
    window.addEventListener('scroll', updateSpotlight, true) 
    return () => {
      window.removeEventListener('resize', updateSpotlight)
      window.removeEventListener('scroll', updateSpotlight, true)
    }
  }, [updateSpotlight])

  const completeTutorial = () => {
    localStorage.setItem('hasSeenGameTutorial', 'true')
    setIsVisible(false)
  }

  const nextStep = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      completeTutorial()
    }
  }

  if (!isVisible) return null

  // กำหนดให้กล่องข้อความอยู่คนละฝั่งกับเป้าหมาย จะได้ไม่บังกัน
  const isTargetAtTop = targetRect && targetRect.top < window.innerHeight / 2

  return (
    <div className="fixed inset-0 z-[99999] overflow-hidden pointer-events-auto flex justify-center items-center transition-opacity duration-500">
      
      {/* 🌟 Spotlight Effect */}
      {targetRect && (
        <div 
          className="absolute rounded-xl transition-all duration-500 ease-in-out pointer-events-none"
          style={{
            top: targetRect.top - 15,
            left: targetRect.left - 15,
            width: targetRect.width + 30,
            height: targetRect.height + 30,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.75)',
            border: '3px solid #F4E4BC',
          }}
        >
          <div className="absolute inset-0 animate-pulse bg-[#F4E4BC]/10 rounded-xl"></div>
        </div>
      )}

      {/* 📜 กล่องคำอธิบายสไตล์ RPG */}
      <div 
        className={`relative bg-[#f4e4bc] border-4 border-[#8B5A2B] rounded-lg shadow-[10px_10px_0px_rgba(0,0,0,0.8)] p-6 w-[90%] max-w-md animate-fade-in ${vt323.className} flex flex-col transition-all duration-500`}
        style={{
           marginTop: isTargetAtTop ? '30vh' : '-30vh'
        }}
      >
        <button 
          onClick={completeTutorial}
          className="absolute -top-4 -right-4 bg-[#8B5A2B] text-[#f4e4bc] p-1.5 rounded-full border-2 border-[#5c3a1a] shadow-[2px_2px_0px_rgba(0,0,0,0.5)] hover:bg-[#5c3a1a] transition-colors"
          title="Skip Tutorial"
        >
          <X size={16} />
        </button>

        <h2 className="text-2xl md:text-3xl text-[#3e2723] font-bold mb-3 uppercase tracking-widest border-b-2 border-[#8B5A2B]/30 pb-2">
          {step.title}
        </h2>
        
        <p className="text-xl text-[#5c3a1a] mb-6 leading-tight whitespace-pre-wrap">
          {step.text}
        </p>
        
        <div className="flex justify-between w-full items-center mt-auto">
          <span className="text-[#8B5A2B] text-xl font-bold tracking-widest">
            {currentStep + 1} / {TUTORIAL_STEPS.length}
          </span>
          <button 
            onClick={nextStep}
            className="bg-[#8B5A2B] hover:bg-[#5c3a1a] text-[#f4e4bc] px-5 py-2 rounded shadow-[3px_3px_0px_rgba(0,0,0,0.4)] border-2 border-[#5c3a1a] flex items-center gap-2 transition-all active:translate-y-1 active:shadow-none text-xl uppercase tracking-wider"
          >
            {currentStep === TUTORIAL_STEPS.length - 1 ? (
              <>Start <Check size={18} /></>
            ) : (
              <>Next <ChevronRight size={18} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}