export default function LogisticsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Logistik & Pengiriman</h2>
        <p className="text-slate-500 text-sm">
          Placeholder awal (iterasi berikutnya: jadwal kirim, armada/supir, cetak DO).
        </p>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="text-sm text-slate-700">
          PRD 3.7: koordinat lat/lng dari invoice + status PREPARING/ON_DELIVERY/DELIVERED.
        </div>
      </div>
    </div>
  );
}

