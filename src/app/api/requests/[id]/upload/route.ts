import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import { updateRowByValue, REQUESTS_SHEET } from "@/lib/google-sheets";
import { sendSlackQuotationFileNotification } from "@/lib/slack";

export async function POST(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ message: "ไม่พบไฟล์ที่อัปโหลด" }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Create a unique filename
        const filename = `${id}_${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
        const uploadDir = path.join(process.cwd(), "public/uploads");
        const filePath = path.join(uploadDir, filename);

        // Write the file
        await writeFile(filePath, buffer);
        const fileUrl = `/uploads/${filename}`;

        // Update Google Sheets
        const updated = await updateRowByValue(REQUESTS_SHEET, "id", id, {
            quotationFile: fileUrl,
            updatedAt: new Date().toISOString(),
        });

        if (!updated) {
            return NextResponse.json({ message: "ไม่พบคำขอนี้ยในระบบ" }, { status: 404 });
        }

        // Notify Slack
        const updatedRequest = (updated as any).toObject();
        await sendSlackQuotationFileNotification(updatedRequest);

        return NextResponse.json({
            success: true,
            fileUrl
        });
    } catch (error: any) {
        console.error("POST /api/requests/:id/upload error:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
