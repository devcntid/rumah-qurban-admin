import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getSlaughterScheduleById, getAssignedOrderItems } from "@/lib/db/queries/slaughter-schedules";
import ScheduleDetailClient from "./ScheduleDetailClient";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ScheduleDetailPage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const scheduleId = Number(id);
  if (isNaN(scheduleId)) notFound();

  const schedule = await getSlaughterScheduleById(scheduleId);
  if (!schedule) notFound();

  const assignedItems = await getAssignedOrderItems(scheduleId);

  return (
    <ScheduleDetailClient
      schedule={schedule}
      initialAssignedItems={assignedItems}
      userRole={session.role}
    />
  );
}
