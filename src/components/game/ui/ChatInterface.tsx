'use client'
import { useState } from 'react'
import { useGameStore } from '@/store/useGameStore'

export default function ChatInterface() {
  const { messages, addMessage, aiTokens, decreaseToken } = useGameStore()
  const [inputText, setInputText] = useState('')
  const [isAiMode, setIsAiMode] = useState(false)

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim()) return

    if (isAiMode) {
      if (aiTokens > 0) {
        addMessage('Player', inputText, 'USER')
        addMessage('AI GM', 'ระบบกำลังประมวลผลคำสั่ง...', 'SYSTEM')
        decreaseToken()
      } else {
        alert('AI Token หมดแล้ว!')
        return
      }
    } else {
      addMessage('Player', inputText, 'USER')
    }
    
    setInputText('')
  }

  return (
    <div className="flex flex-col h-full bg-neutral-900/90 backdrop-blur-md border-r border-white/10 w-80 shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-white/10 bg-neutral-800/50 flex justify-between items-center">
        <h2 className="font-bold text-white text-lg">Game Chat</h2>
        <div className="flex items-center gap-2">
           <div className={`w-2 h-2 rounded-full ${aiTokens > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
           <span className="text-xs text-gray-400">{aiTokens}/30 Tokens</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && <p className="text-center text-gray-500 text-sm mt-10">... เริ่มต้นการสนทนา ...</p>}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.sender === 'Player' ? 'items-end' : 'items-start'}`}>
            <span className="text-[10px] text-gray-400 mb-1">{msg.sender}</span>
            <div className={`px-3 py-2 rounded-lg max-w-[90%] text-sm ${
              msg.type === 'SYSTEM' ? 'bg-yellow-500/20 text-yellow-200 border border-yellow-500/30' :
              msg.sender === 'Player' ? 'bg-blue-600 text-white' : 'bg-neutral-700 text-gray-200'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/10 bg-neutral-800/80">
        <form onSubmit={handleSend} className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>Mode:</span>
            <button 
              type="button"
              onClick={() => setIsAiMode(!isAiMode)}
              className={`px-2 py-1 rounded transition-colors font-bold ${isAiMode ? 'bg-purple-600 text-white' : 'bg-neutral-700 text-gray-300'}`}
            >
              {isAiMode ? '🤖 Ask AI' : '👥 Chat Party'}
            </button>
          </div>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isAiMode ? "สั่ง AI (เสีย 1 Token)..." : "คุยกับเพื่อน..."}
            className={`w-full bg-black/50 border rounded px-3 py-2 text-white focus:outline-none focus:ring-2 ${isAiMode ? 'border-purple-500 focus:ring-purple-500' : 'border-neutral-600 focus:ring-blue-500'}`}
          />
        </form>
      </div>
    </div>
  )
}