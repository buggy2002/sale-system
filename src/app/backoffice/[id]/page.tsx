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
    ShieldCheck
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
    });

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
            const res = await fetch(`/api/slack/interact`, {
                method: "POST",
                body: JSON.stringify({
                    payload: JSON.stringify({
                        callback_id: `approve_request_${id}`,
                        actions: [{ value: "acknowledge" }],
                        user: { name: "Backoffice User" }
                    })
                })
            });
            if (res.ok) fetchRequest();
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFinish = async () => {
        if (!invoiceForm.invoiceNo) return alert("กรุณากรอกเลขที่ Invoice");

        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/invoices`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    quotationRequestId: id,
                    ...invoiceForm
                })
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
                                        "bg-green-100 text-green-700 border-green-200"
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
                        {request.status === "เปิดบิลแล้ว" && (
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
                                    <button
                                        onClick={handleAcknowledge}
                                        disabled={isSubmitting}
                                        className="btn-primary w-full py-3 flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Clock size={20} />}
                                        รับเรื่องแล้ว
                                    </button>
                                )}

                                {request.status === "รับเรื่องแล้ว" && (
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-400 uppercase">เลขที่ Invoice</label>
                                            <input
                                                type="text"
                                                className="input-field"
                                                placeholder="INV-XXXXX"
                                                value={invoiceForm.invoiceNo}
                                                onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceNo: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-400 uppercase">วันที่ออก Invoice</label>
                                            <input
                                                type="date"
                                                className="input-field"
                                                value={invoiceForm.invoiceDate}
                                                onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceDate: e.target.value })}
                                            />
                                        </div>
                                        <button
                                            onClick={handleFinish}
                                            disabled={isSubmitting}
                                            className="btn-primary w-full py-3 flex items-center justify-center gap-2"
                                        >
                                            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                                            ยืนยันออกบิลเรียบร้อย
                                        </button>
                                    </div>
                                )}

                                {request.status === "เปิดบิลแล้ว" && (
                                    <div className="text-center py-4 text-green-600 bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-900/30">
                                        <CheckCircle size={32} className="mx-auto mb-2" />
                                        <p className="font-bold">เสร็จสิ้นกระบวนการ</p>
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
