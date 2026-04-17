export type SlaughterScheduleStatus = "PLANNED" | "ONGOING" | "COMPLETED" | "CANCELLED";

export type SlaughterSchedule = {
  id: number;
  branchId: number;
  branchName?: string;
  scheduledDate: string;
  locationName: string;
  locationLat: string | null;
  locationLng: string | null;
  notes: string | null;
  status: SlaughterScheduleStatus;
  assignedCount?: number;
  createdAt: string;
  updatedAt: string;
};

export type SlaughterScheduleInput = {
  branchId: number;
  scheduledDate: string;
  locationName: string;
  locationLat?: number | null;
  locationLng?: number | null;
  notes?: string | null;
  status?: SlaughterScheduleStatus;
};

export type AssignableOrderItem = {
  orderItemId: number;
  orderId: number;
  invoiceNumber: string;
  customerName: string;
  customerPhone: string | null;
  itemName: string;
  branchId: number;
  branchName: string;
  farmInventoryId: number | null;
  eartagId: string | null;
  currentScheduleId: number | null;
  participantNames: string[];
};
