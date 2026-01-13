import { NextResponse } from "next/server";
import {
    getAllData,
    REQUESTS_SHEET,
    addRow,
    QuotationRequest
} from "@/lib/google-sheets";
import { v4 as uuidv4 } from "uuid";
import { sendSlackRequestNotification } from "@/lib/slack";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status");
        const from = searchParams.get("from");
        const to = searchParams.get("to");

        const requests = await getAllData<QuotationRequest>(REQUESTS_SHEET);

        // Process data (handle JSON parsing for items)
        let result = requests.map(r => {
            let items = [];
            try {
                // Priority: Use itemsJson (new detailed JSON) then itemsRaw (old detailed JSON) fallback to items
                const rawData = r.itemsJson || r.itemsRaw || r.items;
                items = typeof rawData === 'string' && (rawData.trim().startsWith('[') || rawData.trim().startsWith('{'))
                    ? JSON.parse(rawData)
                    : (r.items || []);
            } catch (e) {
                console.error("Failed to parse items for request", r.id);
            }

            return {
                ...r,
                items,
                totalAmount: parseFloat(String(r.totalAmount))
            };
        });

        // Filter
        if (status) {
            result = result.filter(r => r.status === status);
        }
        if (from) {
            result = result.filter(r => new Date(r.createdAt) >= new Date(from));
        }
        if (to) {
            result = result.filter(r => new Date(r.createdAt) <= new Date(to));
        }

        // Sort by newest
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("GET /api/requests error:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            quotationDate,
            customerName,
            customerTaxId,
            customerAddress,
            salesName,
            items,
            paymentTerm,
            subtotal,
            vatAmount,
            totalAmount,
            requestType,
            note
        } = body;

        if (!quotationDate || !customerName || !salesName || !totalAmount || !requestType || !items || !paymentTerm) {
            return NextResponse.json({ message: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 });
        }

        const newRequest = {
            id: uuidv4(),
            quotationDate,
            customerName,
            customerTaxId: customerTaxId || "",
            customerAddress: customerAddress || "",
            salesName,
            // Display only names in 'items' column for Google Sheets readability
            items: items.map((i: any) => i.name).join(", "),
            // Display only Warranty & Conditions in 'itemsRaw' as requested
            itemsRaw: items.map((i: any) => {
                let s = `${i.name}:`;
                if (i.warrantyPeriod) s += ` ประกัน ${i.warrantyPeriod}`;
                if (i.warrantyConditions) s += ` (${i.warrantyConditions})`;
                if (!i.warrantyPeriod && !i.warrantyConditions) s += " ไม่มีประกัน";
                return s;
            }).join(" | "),
            // Store full data in 'itemsJson' for system logic
            itemsJson: JSON.stringify(items),
            paymentTerm,
            subtotal: parseFloat(subtotal),
            vatAmount: parseFloat(vatAmount),
            totalAmount: parseFloat(totalAmount),
            requestType,
            note: note || "",
            status: "รออนุมัติ",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        await addRow(REQUESTS_SHEET, newRequest);

        // Send Slack Notification
        await sendSlackRequestNotification(newRequest);

        return NextResponse.json(newRequest);
    } catch (error: any) {
        console.error("POST /api/requests error:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
