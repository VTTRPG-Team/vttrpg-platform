import Link from 'next/link';

export default function LobbyPage() {
  const btnStyle = "w-80 py-6 text-2xl bg-[#8B4513] border-4 border-[#5A2D0C] text-[#F4E4BC] font-bold uppercase tracking-widest shadow-[6px_6px_0px_0px_rgba(0,0,0,0.5)] hover:translate-y-[3px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,0.5)] active:translate-y-[6px] active:shadow-none transition-all";

  return (
    <div className="min-h-screen bg-[#1a120b] flex flex-col items-center justify-center relative font-mono">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#4a3b32_0%,_#000000_100%)] opacity-60"></div>

      {/* Exit Button (Top Right) */}
      <Link href="/" className="absolute top-6 right-6 z-20">
        <button className="px-6 py-3 bg-[#5A2D0C] border-2 border-[#F4E4BC] text-[#F4E4BC] font-bold shadow-[3px_3px_0px_0px_rgba(0,0,0,0.5)] hover:bg-[#3e1e08] active:translate-y-1 active:shadow-none">
          EXIT
        </button>
      </Link>

      <div className="z-10 flex flex-col gap-8 text-center">
        <h1 className="text-4xl text-[#F4E4BC] font-bold drop-shadow-md mb-4">LOBBY</h1>
        
        <Link href="/lobby/create">
          <button className={btnStyle}>Create Lobby</button>
        </Link>
        
        <Link href="/lobby/join">
          <button className={btnStyle}>Join Lobby</button>
        </Link>
      </div>

      {/* Decorative Pixel Char (Bottom Left) */}
      <div className="absolute bottom-4 left-4 z-10">
        <div className="w-16 h-16 bg-green-700 border-4 border-white flex items-center justify-center text-3xl">
          🧝
        </div>
      </div>
    </div>
  );
}