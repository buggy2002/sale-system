import { NextResponse } from "next/server";
import {
    updateRowByValue,
    addRow,
    REQUESTS_SHEET,
    INVOICES_SHEET,
    getAllData,
    QuotationRequest
} from "@/lib/google-sheets";
import { v4 as uuidv4 } from "uuid";
import { sendSlackStatusUpdate } from "@/lib/slack";

export async function POST(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        const body = await req.json();
        const { invoiceNo, invoiceDate, vatAmount, deliveryDate } = body;

        if (!invoiceNo || !invoiceDate) {
            return NextResponse.json({ message: "กรุณาระบุเลขที่และวันที่ Invoice" }, { status: 400 });
        }

        // Get old status for notification
        const allRequests = await getAllData<QuotationRequest>(REQUESTS_SHEET);
        const oldRequest = allRequests.find(r => r.id === id);

        // 1. Create Invoice Record
        const invoiceRecord = {
            id: uuidv4(),
            quotationRequestId: id,
            invoiceNo,
            invoiceDate,
            deliveryDate: deliveryDate || "",
            vatAmount: vatAmount ? parseFloat(vatAmount) : 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        await addRow(INVOICES_SHEET, invoiceRecord);

        // 2. Update Request Status
        const updated = await updateRowByValue(REQUESTS_SHEET, "id", id, {
            status: "เปิดบิล",
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
        console.error("POST /api/requests/:id/invoice error:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
