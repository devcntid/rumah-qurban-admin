export default function FinancePage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Verifikasi Pembayaran</h2>
        <p className="text-slate-500 text-sm">
          Placeholder awal (iterasi berikutnya: antrean bukti transfer + approve/reject).
        </p>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="text-sm text-slate-700">
          PRD 3.5: ketika approve, status order berubah menjadi FULL_PAID dan
          trigger notifikasi.
        </div>
      </div>
    </div>
  );
}

