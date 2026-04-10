"use client";

import { useState, useEffect } from "react";
import { 
  Terminal, ChevronDown, ChevronRight, Activity, Clock, 
  Copy, Check, Search, Filter, Shield, MessageSquare, Globe, Loader2
} from "lucide-react";
import { api } from "@/lib/api/client";
import type { BaseLog } from "@/lib/db/queries/logs";

function CopyButton({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={(e) => { e.stopPropagation(); handleCopy(); }}
      className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-slate-400 hover:text-white"
    >
      {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
    </button>
  );
}

const typeConfig: Record<string, { icon: any, color: string, bg: string }> = {
  PAYMENT: { icon: Shield, color: "text-blue-600", bg: "bg-blue-100" },
  NOTIF: { icon: MessageSquare, color: "text-green-600", bg: "bg-green-100" },
  ZAINS: { icon: Globe, color: "text-purple-600", bg: "bg-purple-100" },
};

export function SystemLogsViewer() {
  const [logs, setLogs] = useState<BaseLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    api("/api/logs").then(res => {
      setLogs(res.rows || []);
      setLoading(false);
    });
  }, []);

  const filtered = logs.filter(l => {
    if (filter !== "ALL" && l.type !== filter) return false;
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      return (
        l.logType?.toLowerCase().includes(s) || 
        l.referenceId?.toLowerCase().includes(s)
      );
    }
    return true;
  });

  const toggle = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading) return (
    <div className="py-20 flex flex-col items-center gap-4 text-slate-400 italic text-sm">
      <Loader2 size={32} className="animate-spin" /> Sedang memuat log...
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
          {["ALL", "PAYMENT", "NOTIF", "ZAINS"].map(t => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${
                filter === t ? "bg-white text-[#102a43] shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Cari Ref atau Tipe..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="py-20 bg-slate-50 border border-slate-200 border-dashed rounded-3xl text-center">
             <Clock size={40} className="mx-auto text-slate-300 mb-3" />
             <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Tidak ada log ditemukan</p>
          </div>
        ) : (
          filtered.map(log => {
            const id = `${log.type}-${log.id}`;
            const conf = typeConfig[log.type] || typeConfig.PAYMENT;
            return (
              <div key={id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                <button
                  onClick={() => toggle(id)}
                  className="w-full text-left p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-xl ${conf.bg} ${conf.color}`}>
                      <conf.icon size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-800 text-sm tracking-tight">{log.logType}</span>
                        {log.status && (
                          <span className="px-1.5 py-0.5 bg-slate-100 text-[9px] font-black rounded border border-slate-200 uppercase tracking-widest">
                            {log.status}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        {log.type} • Ref: {log.referenceId || "-"} • {new Date(log.createdAt).toLocaleString("id-ID")}
                      </div>
                    </div>
                  </div>
                  {expanded[id] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </button>

                {expanded[id] && (
                  <div className="p-4 border-t border-slate-100 bg-slate-50 space-y-4 font-mono text-[10px]">
                    <div className="space-y-2">
                      <div className="text-[9px] font-black text-blue-600 uppercase tracking-widest flex items-center justify-between px-1">
                        <span className="flex items-center gap-1.5"><Terminal size={12} /> Payload (Data Masuk)</span>
                        <CopyButton content={JSON.stringify(typeof log.payload === 'string' ? JSON.parse(log.payload) : log.payload, null, 2)} />
                      </div>
                      <pre className="bg-[#0f172a] text-blue-300 p-4 rounded-xl overflow-x-auto custom-scrollbar-light border border-slate-800 shadow-inner">
                        {(() => {
                            try {
                                const p = typeof log.payload === 'string' ? JSON.parse(log.payload) : log.payload;
                                return JSON.stringify(p, null, 2);
                            } catch (e) { return String(log.payload); }
                        })()}
                      </pre>
                    </div>
                    <div className="space-y-2">
                      <div className="text-[9px] font-black text-green-600 uppercase tracking-widest flex items-center justify-between px-1">
                        <span className="flex items-center gap-1.5"><Terminal size={12} /> Response (Respons Sistem)</span>
                        <CopyButton content={JSON.stringify(typeof log.response === 'string' ? JSON.parse(log.response) : log.response, null, 2)} />
                      </div>
                      <pre className="bg-[#0f172a] text-green-300 p-4 rounded-xl overflow-x-auto custom-scrollbar-light border border-slate-800 shadow-inner">
                        {(() => {
                            try {
                                const r = typeof log.response === 'string' ? JSON.parse(log.response) : log.response;
                                return JSON.stringify(r, null, 2);
                            } catch (e) { return String(log.response); }
                        })()}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
