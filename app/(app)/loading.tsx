import { Heart } from "lucide-react";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm transition-opacity duration-300">
      <div className="relative flex items-center justify-center">
        <div className="h-20 w-20 animate-spin rounded-full border-4 border-slate-100 border-t-red-500 shadow-lg"></div>
        <div className="absolute animate-pulse">
          <Heart size={32} className="text-red-500 fill-red-500" />
        </div>
      </div>
      <div className="mt-8 flex flex-col items-center gap-2">
        <h2 className="text-xl font-bold text-[#1e3a5f] tracking-tight">
          rumah<span className="text-red-500">qurban</span>
        </h2>
        <div className="flex gap-1">
          <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-red-400 [animation-delay:-0.3s]"></div>
          <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-red-500 [animation-delay:-0.15s]"></div>
          <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-red-600"></div>
        </div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-2">
          Memuat halaman...
        </p>
      </div>
    </div>
  );
}
