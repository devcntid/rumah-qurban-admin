import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { NotifTemplatesCrud } from "./NotifTemplatesCrud";

export default async function NotifTemplatesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Template Notifikasi</h1>
        <p className="text-slate-500 text-sm mt-1">
          Kelola template pesan WhatsApp untuk berbagai notifikasi qurban
        </p>
      </div>
      <NotifTemplatesCrud />
    </div>
  );
}
