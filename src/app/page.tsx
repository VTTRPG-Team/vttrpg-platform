import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white">
      <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-4">
        VTTRPG Platform
      </h1>
      <p className="text-slate-400 mb-8">AI Game Master & Virtual Tabletop</p>
      
      <div className="space-y-4">
        <Link href="/room/demo-123">
          <button className="px-8 py-4 bg-purple-600 hover:bg-purple-700 rounded-lg font-bold text-xl transition-all">
            เข้าสู่ห้องเกม (Demo)
          </button>
        </Link>
        <div className="text-sm text-center text-slate-500">
          (ระบบ Login จะมาแทนที่ตรงนี้)
        </div>
      </div>
    </div>
  );
}