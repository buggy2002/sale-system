"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    Search,
    Filter,
    Download,
    ChevronRight,
    Clock,
    CheckCircle,
    FileText,
    Calendar,
    Loader2,
    RefreshCcw,
    ArrowLeft,
    Home,
    LayoutDashboard
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const STATUS_COLORS: Record<string, string> = {
    "รออนุมัติ": "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
    "รอหลังบ้านตรวจสอบ": "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
    "รับเรื่องแล้ว": "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
    "เปิดใบเสนอราคา": "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800",
    "เปิดบิล": "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
    "ไม่อนุมัติ": "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
    "ถูกปฏิเสธ": "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
};

export default function BackOfficeDashboard() {
    const [requests, setRequests] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState({
        status: "",
        from: "",
        to: "",
    });

    useEffect(() => {
        fetchRequests();
    }, [filters]);

    const fetchRequests = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.status) params.append("status", filters.status);
            if (filters.from) params.append("from", filters.from);
            if (filters.to) params.append("to", filters.to);

            const res = await fetch(`/api/requests?${params.toString()}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setRequests(data);
            } else {
                console.error("Requests data is not an array:", data);
                setRequests([]);
            }
        } catch (err) {
            console.error("Failed to fetch requests", err);
            setRequests([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleExport = () => {
        const params = new URLSearchParams();
        if (filters.status) params.append("status", filters.status);
        if (filters.from) params.append("from", filters.from);
        if (filters.to) params.append("to", filters.to);

        window.open(`/api/export?${params.toString()}`, "_blank");
    };

    return (
        <div className="min-h-screen p-4 md:p-8 bg-slate-50 dark:bg-slate-950">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <Link href="/" className="inline-flex items-center gap-1 text-slate-500 hover:text-primary-600 mb-2 transition-colors text-sm">
                            <ArrowLeft size={16} /> กลับหน้าหลัก
                        </Link>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">คิวงานหลังบ้าน</h1>
                        <p className="text-slate-500 dark:text-slate-400">จัดการคำขอเปิดบิลและอัปเดตสถานะ Invoice</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <Link href="/dashboard" className="btn-secondary flex items-center gap-2">
                            <LayoutDashboard size={18} />
                            รายงาน
                        </Link>
                        <button
                            onClick={handleExport}
                            className="btn-secondary flex items-center gap-2"
                        >
                            <Download size={18} />
                            Export Excel
                        </button>
                        <Link href="/backoffice/customers" className="btn-primary flex items-center gap-2">
                            จัดการลูกค้า
                        </Link>
                    </div>
                </div>

                {/* Filters */}
                <div className="glass p-6 rounded-2xl grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="space-y-1">
                        <label className="label">สถานะ</label>
                        <select
                            className="input-field"
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        >
                            <option value="">ทั้งหมด</option>
                            <option value="รออนุมัติ">รออนุมัติ (Slack)</option>
                            <option value="รอหลังบ้านตรวจสอบ">รอหลังบ้านตรวจสอบ</option>
                            <option value="รับเรื่องแล้ว">รับเรื่องแล้ว</option>
                            <option value="เปิดใบเสนอราคา">เปิดใบเสนอราคา</option>
                            <option value="เปิดบิล">เปิดบิล</option>
                            <option value="ไม่อนุมัติ">ไม่อนุมัติ</option>
                            <option value="ถูกปฏิเสธ">ถูกปฏิเสธ</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="label">ตั้งแต่วันที่</label>
                        <input
                            type="date"
                            className="input-field"
                            value={filters.from}
                            onChange={(e) => setFilters({ ...filters, from: e.target.value })}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="label">ถึงวันที่</label>
                        <input
                            type="date"
                            className="input-field"
                            value={filters.to}
                            onChange={(e) => setFilters({ ...filters, to: e.target.value })}
                        />
                    </div>
                    <button
                        onClick={fetchRequests}
                        className="btn-secondary flex items-center justify-center gap-2 h-[46px]"
                    >
                        <RefreshCcw size={18} className={isLoading ? "animate-spin" : ""} />
                        รีเฟรช
                    </button>
                </div>

                {/* Table */}
                <div className="glass rounded-2xl overflow-hidden overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-100/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">วันที่ทำรายการ</th>
                                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">วันที่ในเอกสาร</th>
                                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">ลูกค้า</th>
                                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">ยอดเงิน</th>
                                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">สถานะ</th>
                                <th className="px-6 py-4 text-center font-semibold text-slate-600 dark:text-slate-300">การกระทำ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center">
                                        <Loader2 className="animate-spin mx-auto text-primary-500 mb-2" size={32} />
                                        <p className="text-slate-500">กำลังโหลดข้อมูล...</p>
                                    </td>
                                </tr>
                            ) : requests.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center text-slate-500">
                                        ไม่พบข้อมูลคำขอ
                                    </td>
                                </tr>
                            ) : (
                                requests.map((req) => (
                                    <motion.tr
                                        key={req.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-medium">{format(new Date(req.createdAt), 'dd MMM yy', { locale: th })}</span>
                                                <span className="text-xs text-slate-400">{format(new Date(req.createdAt), 'HH:mm')}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                                            {format(new Date(req.quotationDate), 'dd/MM/yyyy', { locale: th })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-slate-900 dark:text-white">{req.customerName}</span>
                                                <span className="text-xs text-slate-400">โดย {req.salesName}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-primary-600 dark:text-primary-400">
                                            ฿{parseFloat(req.totalAmount).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                "px-3 py-1 rounded-full text-xs font-medium border",
                                                STATUS_COLORS[req.status] || "bg-slate-100"
                                            )}>
                                                {req.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <Link
                                                href={`/backoffice/${req.id}`}
                                                className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium"
                                            >
                                                รายละเอียด
                                                <ChevronRight size={16} />
                                            </Link>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
