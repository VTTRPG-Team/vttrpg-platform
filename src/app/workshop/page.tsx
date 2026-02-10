import Link from 'next/link';

export default function WorkshopPage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-slate-900 text-white">
      <h1 className="text-4xl font-bold mb-4">🛠️ WORKSHOP</h1>
      <p className="mb-8 text-slate-400">Under Construction...</p>
      <Link href="/" className="text-blue-400 underline">Back to Menu</Link>
    </div>
  );
}