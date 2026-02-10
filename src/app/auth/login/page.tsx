import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-black text-[#F4E4BC] font-mono">
      <div className="p-8 border-4 border-[#8B4513] bg-[#2a1d15] rounded max-w-sm w-full">
        <h1 className="text-2xl font-bold mb-6 text-center">LOGIN</h1>
        <input type="text" placeholder="Username" className="w-full p-2 mb-4 bg-[#1a120b] border border-[#8B4513]" />
        <input type="password" placeholder="Password" className="w-full p-2 mb-6 bg-[#1a120b] border border-[#8B4513]" />
        
        {/* Mock Login -> ไปหน้า Lobby */}
        <Link href="/lobby">
          <button className="w-full py-3 bg-[#8B4513] hover:bg-[#a05a2c] font-bold border-2 border-[#5A2D0C]">
            ENTER TAVERN
          </button>
        </Link>
        
        <div className="mt-4 text-center text-sm">
          <Link href="/" className="underline opacity-60">Back</Link>
        </div>
      </div>
    </div>
  );
}