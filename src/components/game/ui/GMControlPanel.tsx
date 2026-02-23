'use client'

export default function GMControlPanel({ roomId }: { roomId: string }) {
  return (
    <div className="bg-[#1a0f0a]/90 border-2 border-red-900 rounded-lg p-4 shadow-2xl backdrop-blur-md w-[400px]">
        <h3 className="text-red-500 font-bold uppercase tracking-widest mb-4 border-b border-red-900/50 pb-2">
            Game Master Tools
        </h3>
        <p className="text-[#a1887f] text-sm">เครื่องมือสำหรับ GM (คนจริง) จะมาอยู่ตรงนี้ เช่น เปลี่ยนรูปกระดาน, เปลี่ยนเพลง, ลด/เพิ่มเลือดผู้เล่น, สร้างแบบโหวต</p>
    </div>
  )
}