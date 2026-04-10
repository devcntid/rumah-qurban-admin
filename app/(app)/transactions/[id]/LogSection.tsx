"use client";

import { useState, useEffect } from "react";
import { Terminal, ChevronDown, ChevronRight, Activity, Clock, Copy, Check } from "lucide-react";
import type { PaymentLogRow } from "@/lib/db/queries/transactions";

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
      title="Copy to clipboard"
    >
      {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
    </button>
  );
}

export function LogSection({ logs }: { logs: PaymentLogRow[] }) {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (logs.length > 0) {
      setExpanded({ [logs[0].id]: true });
    }
  }, [logs]);

  const toggle = (id: number) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-4">
      {logs.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-8 text-center">
          <Clock size={32} className="mx-auto text-slate-300 mb-2" />
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Belum ada log pembayaran otomatis</p>
        </div>
      ) : (
        logs.map((log) => (
          <div key={log.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm transition-all hover:shadow-md">
            <button
              onClick={() => toggle(log.id)}
              className="w-full text-left p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="p-2 bg-slate-100 rounded-xl text-slate-600">
                  <Activity size={20} />
                </div>
                <div>
                  <div className="font-black text-slate-800 text-sm">{log.logType || "PAYMENT_LOG"}</div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    Ref: {log.referenceId || "-"} • {new Date(log.createdAt).toLocaleDateString("id-ID", { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
              {expanded[log.id] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </button>

            {expanded[log.id] && (
              <div className="p-4 border-t border-slate-100 bg-slate-50 space-y-4 font-mono text-[10px]">
                <div className="space-y-2">
                  <div className="text-[9px] font-black text-blue-600 uppercase tracking-widest flex items-center justify-between px-1">
                    <span className="flex items-center gap-1.5"><Terminal size={12} /> Payload (Incoming)</span>
                    <CopyButton content={(() => {
                        try {
                            const p = typeof log.payload === 'string' ? JSON.parse(log.payload) : log.payload;
                            return JSON.stringify(p, null, 2);
                        } catch (e) { return String(log.payload); }
                    })()} />
                  </div>
                  <pre className="bg-[#0f172a] text-blue-300 p-4 rounded-xl overflow-x-auto custom-scrollbar-light border border-slate-800 shadow-inner">
                    {(() => {
                        try {
                            const p = typeof log.payload === 'string' ? JSON.parse(log.payload) : log.payload;
                            return JSON.stringify(p, null, 2);
                        } catch (e) {
                            return String(log.payload);
                        }
                    })()}
                  </pre>
                </div>
                <div className="space-y-2">
                  <div className="text-[9px] font-black text-green-600 uppercase tracking-widest flex items-center justify-between px-1">
                    <span className="flex items-center gap-1.5"><Terminal size={12} /> Response (Outgoing)</span>
                    <CopyButton content={(() => {
                        try {
                            const r = typeof log.response === 'string' ? JSON.parse(log.response) : log.response;
                            return JSON.stringify(r, null, 2);
                        } catch (e) { return String(log.response); }
                    })()} />
                  </div>
                  <pre className="bg-[#0f172a] text-green-300 p-4 rounded-xl overflow-x-auto custom-scrollbar-light border border-slate-800 shadow-inner">
                    {(() => {
                        try {
                            const r = typeof log.response === 'string' ? JSON.parse(log.response) : log.response;
                            return JSON.stringify(r, null, 2);
                        } catch (e) {
                            return String(log.response);
                        }
                    })()}
                  </pre>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
