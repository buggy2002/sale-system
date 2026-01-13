"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    Clock,
    CheckCircle,
    FileText,
    Building2,
    User,
    DollarSign,
    Calendar,
    AlertCircle,
    Loader2,
    Save,
    CheckCircle2,
    Hash,
    MapPin,
    CreditCard,
    ShieldCheck,
    FileUp,
    Upload,
    Trash2,
    Download,
    Truck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { th } from "date-fns/locale";

function InfoItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
    return (
        <div className="flex items-start gap-3">
            <div className="w-9 h-9 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500">
                {icon}
            </div>
            <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{label}</p>
                <p className="text-slate-700 dark:text-slate-200 font-semibold">{value}</p>
            </div>
        </div>
    );
}

export default function RequestDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id;

    const [request, setRequest] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [invoiceForm, setInvoiceForm] = useState({
        invoiceNo: "",
        invoiceDate: new Date().toISOString().split('T')[0],
        deliveryDate: "",
    });
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        if (id) fetchRequest();
    }, [id]);

    const fetchRequest = async () => {
        try {
            const res = await fetch(`/api/requests`);
            const data = await res.json();
            const found = data.find((r: any) => r.id === id);

            if (found) {
                setRequest(found);
                if (found.invoiceNo) {
                    setInvoiceForm({
                        invoiceNo: found.invoiceNo,
                        invoiceDate: found.invoiceDate || new Date().toISOString().split('T')[0],
                        deliveryDate: found.deliveryDate || "",
                    });
                }
            }
        } catch (err) {
            console.error("Failed to fetch request", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAcknowledge = async () => {
        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/requests/${id}/ack`, {
                method: "POST"
            });
            if (res.ok) fetchRequest();
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleQuotation = async () => {
        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/requests/${id}/quotation`, {
                method: "POST"
            });
            if (res.ok) fetchRequest();
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReject = async () => {
        if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการปฏิเสธคำขอนี้?")) return;
        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/requests/${id}/reject`, {
                method: "POST"
            });
            if (res.ok) fetchRequest();
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleStatusChange = async (newStatus: string) => {
        if (newStatus === "เปิดบิล") {
            // Need to use the invoice form instead
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/requests/${id}/status`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) fetchRequest();
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            return alert("ขนาดไฟล์ต้องไม่เกิน 10MB");
        }

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch(`/api/requests/${id}/upload`, {
                method: "POST",
                body: formData,
            });

            if (res.ok) {
                fetchRequest();
            } else {
                alert("เกิดข้อผิดพลาดในการอัปโหลด");
            }
        } catch (err) {
            console.error(err);
            alert("เกิดข้อผิดพลาดในการอัปโหลด");
        } finally {
            setIsUploading(false);
        }
    };

    const handleFinish = async () => {
        if (!invoiceForm.invoiceNo) return alert("กรุณากรอกเลขที่ Invoice");

        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/requests/${id}/invoice`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(invoiceForm)
            });
            if (res.ok) fetchRequest();
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <Loader2 className="animate-spin text-primary-500" size={40} />
            </div>
        );
    }

    if (!request) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <div className="text-center space-y-4">
                    <AlertCircle size={48} className="mx-auto text-slate-300" />
                    <p className="text-slate-500">ไม่พบข้อมูลคำขอนี้</p>
                    <Link href="/backoffice" className="btn-primary">กลับไปแดชบอร์ด</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 md:p-8 bg-slate-50 dark:bg-slate-950">
            <div className="max-w-6xl mx-auto space-y-6">

                {/* Top Nav */}
                <div className="flex items-center justify-between">
                    <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors">
                        <ArrowLeft size={20} /> กลับ
                    </button>
                    <div className="text-xs text-slate-400 font-mono">ID: {request.id}</div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass-card"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-1">รายละเอียดคำขอ</h2>
                                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                                        เอกสารวันที่ {format(new Date(request.quotationDate), 'dd/MM/yyyy', { locale: th })}
                                    </h1>
                                </div>
                                <span className={`px-4 py-1.5 rounded-full text-sm font-semibold border ${request.status === "รอหลังบ้านตรวจสอบ" ? "bg-amber-100 text-amber-700 border-amber-200" :
                                    request.status === "รับเรื่องแล้ว" ? "bg-blue-100 text-blue-700 border-blue-200" :
                                        request.status === "เปิดใบเสนอราคา" ? "bg-indigo-100 text-indigo-700 border-indigo-200" :
                                            request.status === "เปิดบิล" ? "bg-green-100 text-green-700 border-green-200" :
                                                "bg-red-100 text-red-700 border-red-200"
                                    }`}>
                                    {request.status}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4 mb-8">
                                <InfoItem icon={<Building2 size={18} />} label="ลูกค้า" value={request.customerName} />
                                <InfoItem icon={<Hash size={18} />} label="เลขผู้เสียภาษี" value={request.customerTaxId || "-"} />
                                <InfoItem icon={<User size={18} />} label="เซลล์ผู้แจ้ง" value={request.salesName} />
                                <InfoItem icon={<CreditCard size={18} />} label="เงื่อนไขการชำระเงิน" value={request.paymentTerm || "-"} />
                                <InfoItem icon={<FileText size={18} />} label="ประเภทเอกสาร" value={request.requestType} />
                                <div className="sm:col-span-2">
                                    <InfoItem icon={<MapPin size={18} />} label="ที่อยู่สำหรับออกเอกสาร" value={request.customerAddress || "-"} />
                                </div>
                            </div>

                            {/* Items Table */}
                            <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden mb-8">
                                <table className="w-full text-sm text-left">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800">
                                            <th className="px-4 py-3">รายละเอียดสินค้า & การรับประกัน</th>
                                            <th className="px-4 py-3 text-center w-20">จำนวน</th>
                                            <th className="px-4 py-3 text-right w-28">ราคา/หน่วย</th>
                                            <th className="px-4 py-3 text-right w-28" >รวม</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800" >
                                        {request.items?.map((item: any, idx: number) => (
                                            <tr key={idx} className="align-top">
                                                <td className="px-4 py-3">
                                                    <div className="font-semibold text-slate-700 dark:text-slate-200 mb-1">{item.name}</div>
                                                    {(item.warrantyPeriod || item.warrantyConditions) && (
                                                        <div className="flex flex-wrap gap-2 mt-1">
                                                            {item.warrantyPeriod && (
                                                                <span className="inline-flex items-center gap-1 text-[10px] bg-primary-50 dark:bg-primary-900/20 text-primary-600 px-1.5 py-0.5 rounded border border-primary-100">
                                                                    <ShieldCheck size={10} /> {item.warrantyPeriod}
                                                                </span>
                                                            )}
                                                            {item.warrantyConditions && (
                                                                <span className="text-[10px] text-slate-400 italic">
                                                                    เงื่อนไข: {item.warrantyConditions}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-center" > {item.qty} </td>
                                                <td className="px-4 py-3 text-right" > ฿{parseFloat(item.price).toLocaleString()} </td>
                                                <td className="px-4 py-3 text-right font-bold" > ฿{(item.qty * item.price).toLocaleString()} </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800">
                                            <td colSpan={3} className="px-4 py-2 text-right text-slate-500">รวมเป็นเงิน (Subtotal)</td>
                                            <td className="px-4 py-2 text-right font-medium">
                                                ฿{parseFloat(request.subtotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                        <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                                            <td colSpan={3} className="px-4 py-2 text-right text-slate-500">ภาษีมูลค่าเพิ่ม (VAT 7%)</td>
                                            <td className="px-4 py-2 text-right font-medium">
                                                ฿{parseFloat(request.vatAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                        <tr className="bg-primary-50/30 dark:bg-primary-900/10 font-bold border-t border-primary-100/50 dark:border-primary-900/50">
                                            <td colSpan={3} className="px-4 py-4 text-right">ยอดรวมสุทธิ (Grand Total)</td>
                                            <td className="px-4 py-4 text-right text-primary-600 dark:text-primary-400 text-lg">
                                                ฿{parseFloat(request.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4">
                                <InfoItem icon={<Calendar size={18} />} label="วันที่แจ้งทำรายการ" value={format(new Date(request.createdAt), 'PPpp', { locale: th })} />
                                {request.note && (
                                    <div className="sm:col-span-2 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                        <p className="text-xs text-slate-400 mb-1 font-medium">หมายเหตุจากเซลล์:</p>
                                        <p className="text-slate-600 dark:text-slate-300">{request.note}</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {/* Invoiced Details Display */}
                        {request.status === "เปิดบิล" && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="glass-card border-green-500/20 bg-green-50/10"
                            >
                                <div className="flex items-center gap-3 mb-4 text-green-600">
                                    <CheckCircle2 size={24} />
                                    <h3 className="text-lg font-bold">ข้อมูลการเปิดบิลเรียบร้อยแล้ว</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-slate-400">เลขที่ Invoice</p>
                                        <p className="text-lg font-mono font-bold">{request.invoiceNo || "-"}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-400">วันที่ออก Invoice</p>
                                        <p className="text-lg font-bold">
                                            {request.invoiceDate ? format(new Date(request.invoiceDate), 'dd MMM yyyy', { locale: th }) : "-"}
                                        </p>
                                    </div>
                                    <div className="col-span-2 pt-2 border-t border-green-100 dark:border-green-900/30 flex items-center gap-2">
                                        <Truck size={18} className="text-green-500" />
                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                            วันที่ส่งสินค้า: <span className="font-bold text-slate-900 dark:text-white">
                                                {request.deliveryDate ? format(new Date(request.deliveryDate), 'dd MMM yyyy', { locale: th }) : "ไม่ได้ระบุ"}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Actions Sidebar */}
                    <div className="space-y-6">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="glass-card sticky top-8"
                        >
                            <h3 className="text-lg font-bold mb-4">ดำเนินการ</h3>

                            <div className="space-y-4">
                                {request.status === "รอหลังบ้านตรวจสอบ" && (
                                    <div className="space-y-3">
                                        <button
                                            onClick={handleAcknowledge}
                                            disabled={isSubmitting}
                                            className="btn-primary w-full py-3 flex items-center justify-center gap-2"
                                        >
                                            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Clock size={20} />}
                                            รับเรื่องดำเนินการ
                                        </button>
                                        <button
                                            onClick={handleReject}
                                            disabled={isSubmitting}
                                            className="w-full py-2 text-red-600 font-medium hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                        >
                                            ปฏิเสธคำขอ
                                        </button>
                                    </div>
                                )}

                                {request.status !== "รอหลังบ้านตรวจสอบ" && request.status !== "เปิดบิล" && request.status !== "ไม่อนุมัติ" && request.status !== "ถูกปฏิเสธ" && (
                                    <div className="space-y-6">
                                        {/* Status Picker for flexibility */}
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-400 uppercase">เปลี่ยนสถานะปัจจุบัน</label>
                                            <div className="flex flex-col gap-2">
                                                <button
                                                    onClick={() => handleQuotation()}
                                                    disabled={isSubmitting || request.status === "เปิดใบเสนอราคา"}
                                                    className={`w-full py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 border ${request.status === "เปิดใบเสนอราคา"
                                                        ? "bg-indigo-50 text-indigo-600 border-indigo-200"
                                                        : "bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50"
                                                        }`}
                                                >
                                                    <FileText size={18} />
                                                    เปิดใบเสนอราคาเรียบร้อย
                                                </button>

                                                <select
                                                    className="input-field text-sm"
                                                    value={request.status}
                                                    onChange={(e) => handleStatusChange(e.target.value)}
                                                    disabled={isSubmitting}
                                                >
                                                    <option value="รับเรื่องแล้ว">สถานะ: รับเรื่องแล้ว</option>
                                                    <option value="เปิดใบเสนอราคา">สถานะ: เปิดใบเสนอราคา</option>
                                                    <option value="เปิดบิล">สถานะ: เปิดบิล (กรอกข้อมูลด้านล่าง)</option>
                                                    <option value="รอหลังบ้านตรวจสอบ">สถานะ: ย้อนกลับไปรอตรวจสอบ</option>
                                                    <option value="ไม่อนุมัติ">สถานะ: ไม่อนุมัติ</option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* Final Billing Step */}
                                        <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                                            <div className="flex items-center gap-2 mb-4">
                                                <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 flex items-center justify-center font-bold text-sm">3</div>
                                                <p className="text-sm font-bold text-slate-900 dark:text-white">ขั้นตอนส่งบิล (Invoice)</p>
                                            </div>

                                            <div className="space-y-4 bg-slate-50/50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase">เลขที่ Invoice</label>
                                                    <input
                                                        type="text"
                                                        className="input-field bg-white"
                                                        placeholder="INV-XXXXX"
                                                        value={invoiceForm.invoiceNo}
                                                        onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceNo: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase">วันที่ออก Invoice</label>
                                                    <input
                                                        type="date"
                                                        className="input-field bg-white"
                                                        value={invoiceForm.invoiceDate}
                                                        onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceDate: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                                        <Truck size={12} /> วันที่ส่งสินค้า
                                                    </label>
                                                    <input
                                                        type="date"
                                                        className="input-field bg-white"
                                                        value={invoiceForm.deliveryDate}
                                                        onChange={(e) => setInvoiceForm({ ...invoiceForm, deliveryDate: e.target.value })}
                                                    />
                                                </div>
                                                <button
                                                    onClick={handleFinish}
                                                    disabled={isSubmitting}
                                                    className="btn-primary w-full py-3 flex items-center justify-center gap-2 shadow-lg shadow-primary-500/25"
                                                >
                                                    {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />}
                                                    ปิดงาน & ส่งบิลเรียบร้อย
                                                </button>
                                            </div>
                                        </div>

                                        {/* File Upload Section */}
                                        <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                                            <p className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                                <FileUp size={18} className="text-slate-400" />
                                                ไฟล์ใบเสนอราคา (PDF)
                                            </p>

                                            {request.quotationFile ? (
                                                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                                                    <div className="flex items-center justify-between gap-3">
                                                        <div className="flex items-center gap-2 overflow-hidden">
                                                            <div className="w-8 h-8 flex-shrink-0 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center text-indigo-600 shadow-sm">
                                                                <FileText size={18} />
                                                            </div>
                                                            <div className="overflow-hidden">
                                                                <p className="text-xs font-bold text-indigo-900 dark:text-indigo-300 truncate">
                                                                    {request.quotationFile.split('/').pop()}
                                                                </p>
                                                                <a
                                                                    href={request.quotationFile}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-[10px] text-indigo-500 hover:underline"
                                                                >
                                                                    คลิกเพื่อดูไฟล์
                                                                </a>
                                                            </div>
                                                        </div>
                                                        <label className="flex-shrink-0 cursor-pointer p-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-indigo-600">
                                                            <Upload size={16} />
                                                            <input type="file" className="hidden" accept=".pdf" onChange={handleFileUpload} disabled={isUploading} />
                                                        </label>
                                                    </div>
                                                </div>
                                            ) : (
                                                <label className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all group">
                                                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-primary-50 group-hover:text-primary-500 transition-colors">
                                                        {isUploading ? <Loader2 className="animate-spin" size={24} /> : <Upload size={24} />}
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-sm font-bold text-slate-600 dark:text-slate-400">คลิกเพื่ออัปโหลดไฟล์</p>
                                                        <p className="text-xs text-slate-400">PDF เท่านั้น (สูงสุด 10MB)</p>
                                                    </div>
                                                    <input type="file" className="hidden" accept=".pdf" onChange={handleFileUpload} disabled={isUploading} />
                                                </label>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {request.status === "เปิดบิล" && (
                                    <div className="text-center py-6 text-green-600 bg-green-50 dark:bg-green-900/10 rounded-2xl border border-green-100 dark:border-green-900/30">
                                        <CheckCircle size={40} className="mx-auto mb-2" />
                                        <p className="font-bold text-lg">ดำเนินการเสร็จสมบูรณ์</p>
                                        <p className="text-xs text-green-600/70">เอกสารชุดนี้ได้รับการบันทึกเข้าระบบเรียบร้อย</p>
                                    </div>
                                )}

                                {(request.status === "ไม่อนุมัติ" || request.status === "ถูกปฏิเสธ") && (
                                    <div className="text-center py-6 text-red-600 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/30">
                                        <AlertCircle size={40} className="mx-auto mb-2" />
                                        <p className="font-bold text-lg">คำขอนี้ถูกปฏิเสธ</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}
