import { NextResponse } from "next/server";
import { updateRowByValue, REQUESTS_SHEET, getAllData, QuotationRequest } from "@/lib/google-sheets";
import { sendSlackStatusUpdate } from "@/lib/slack";

export async function POST(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;

        // Get old status for notification
        const allRequests = await getAllData<QuotationRequest>(REQUESTS_SHEET);
        const oldRequest = allRequests.find(r => r.id === id);

        const updated = await updateRowByValue(REQUESTS_SHEET, "id", id, {
            status: "ไม่อนุมัติ",
            updatedAt: new Date().toISOString(),
        });

        if (!updated) {
            return NextResponse.json({ message: "ไม่พบคำขอนี้" }, { status: 404 });
        }

        // Notify Slack
        const updatedRequest = (updated as any).toObject();
        await sendSlackStatusUpdate(updatedRequest, oldRequest?.status);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("POST /api/requests/:id/reject error:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
