import { SystemLogsViewer } from "@/components/logs/SystemLogsViewer";
import { Activity } from "lucide-react";

export default function LogsPage() {
  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-6">
        <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
          <Activity size={32} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">System Logs Explorer</h2>
          <p className="text-slate-500 text-sm font-medium">
            Monitor activity across Payment Gateways, Notifications, and Core Integrations.
          </p>
        </div>
      </div>

      <SystemLogsViewer />
    </div>
  );
}

