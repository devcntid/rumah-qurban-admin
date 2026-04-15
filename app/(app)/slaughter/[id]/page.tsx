import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getSlaughterRecordById } from "@/lib/db/queries/slaughter-records";
import { getAllNotifTemplates } from "@/lib/db/queries/notif-templates";
import SlaughterDetailClient from "./SlaughterDetailClient";

export default async function SlaughterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const recordId = Number(id);
  if (!Number.isFinite(recordId)) notFound();

  const session = await getSession();
  if (!session) redirect("/login");

  const record = await getSlaughterRecordById(recordId);
  if (!record) notFound();

  const templates = await getAllNotifTemplates();

  return (
    <SlaughterDetailClient 
      record={record} 
      templates={templates}
    />
  );
}
