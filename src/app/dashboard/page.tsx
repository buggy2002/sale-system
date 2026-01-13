"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    BarChart3,
    Clock,
    CheckCircle,
    FileText,
    TrendingUp,
    Users,
    Package,
    ArrowUpRight,
    ArrowDownRight,
    Loader2,
    Search,
    ChevronRight,
    LayoutDashboard
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { th } from "date-fns/locale";

export default function DashboardPage() {
    const [stats, setStats] = useState<any>(null);
    const [recentRequests, setRecentRequests] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/requests");
            const requests = await res.json();

            // Calculate stats
            const total = requests.length;
            const pending = requests.filter((r: any) => r.status === "รออนุมัติ").length;
            const checking = requests.filter((r: any) => r.status === "รอหลังบ้านตรวจสอบ").length;
            const quotation = requests.filter((r: any) => r.status === "เปิดใบเสนอราคา").length;
            const invoiced = requests.filter((r: any) => r.status === "เปิดบิล").length;
            const rejected = requests.filter((r: any) => r.status === "ไม่อนุมัติ" || r.status === "ถูกปฏิเสธ").length;
            const totalAmount = requests.reduce((sum: number, r: any) => sum + parseFloat(r.totalAmount || 0), 0);

            setStats({
                total,
                pending,
                checking,
                quotation,
                invoiced,
                rejected,
                totalAmount
            });

            setRecentRequests(requests.slice(0, 5));
        } catch (error) {
            console.error("Dashboard fetch error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
            <div className="text-center space-y-4">
                <Loader2 className="animate-spin text-primary-500 mx-auto" size={48} />
                <p className="text-slate-500 font-medium">กำลังเตรียมข้อมูลรายงาน...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen p-4 md:p-8 bg-slate-50 dark:bg-slate-950">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-500/20">
                            <LayoutDashboard size={26} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Status Insight</h1>
                            <p className="text-slate-500 text-sm">ภาพรวมความก้าวหน้าและการเติบโตของยอดขาย</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href="/" className="btn-secondary text-sm">หน้าหลัก</Link>
                        <Link href="/backoffice" className="btn-primary text-sm flex items-center gap-2">
                            จัดการคำขอ
                            <ChevronRight size={16} />
                        </Link>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="รวมคำขอทั้งหมด"
                        value={stats?.total || 0}
                        icon={<FileText className="text-blue-500" />}
                        trend="+12%"
                        isUp={true}
                    />
                    <StatCard
                        title="รอการอนุมัติ (Slack)"
                        value={stats?.pending || 0}
                        icon={<Clock className="text-amber-500" />}
                        color="amber"
                    />
                    <StatCard
                        title="เปิดบิลเรียบร้อย"
                        value={stats?.invoiced || 0}
                        icon={<CheckCircle className="text-green-500" />}
                        color="green"
                    />
                    <StatCard
                        title="ยอดขายรวมสุทธิ"
                        value={`฿${(stats?.totalAmount || 0).toLocaleString()}`}
                        icon={<TrendingUp className="text-primary-500" />}
                        trend="+5.4%"
                        isUp={true}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Recent Requests */}
                    <div className="lg:col-span-2 glass-card p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold">รายการล่าสุด</h2>
                            <Link href="/backoffice" className="text-primary-600 dark:text-primary-400 text-sm font-medium hover:underline">ดูทั้งหมด</Link>
                        </div>
                        <div className="space-y-4">
                            {recentRequests.map((req, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 hover:shadow-md transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${req.status === "รออนุมัติ" ? "bg-amber-100 text-amber-600" :
                                            req.status === "เปิดบิล" ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"
                                            }`}>
                                            {req.status === "รออนุมัติ" ? <Clock size={20} /> : <FileText size={20} />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-white">{req.customerName}</p>
                                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                                <span>{format(new Date(req.createdAt), 'dd MMM yyyy HH:mm', { locale: th })}</span>
                                                <span>•</span>
                                                <span className="text-primary-500 font-medium">โดย {req.salesName}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-slate-900 dark:text-white">฿{parseFloat(req.totalAmount).toLocaleString()}</p>
                                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${req.status === "รออนุมัติ" ? "bg-amber-100 text-amber-700" :
                                            req.status === "เปิดบิล" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                                            }`}>
                                            {req.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Status Distribution (Placeholder Visual) */}
                    <div className="glass-card p-6">
                        <h2 className="text-lg font-bold mb-6">สัดส่วนสถานะงาน</h2>
                        <div className="space-y-6">
                            <StatusProgress label="เปิดบิล" count={stats?.invoiced} total={stats?.total} color="bg-green-500" />
                            <StatusProgress label="เปิดใบเสนอราคา" count={stats?.quotation} total={stats?.total} color="bg-indigo-500" />
                            <StatusProgress label="รออนุมัติ (Slack)" count={stats?.pending} total={stats?.total} color="bg-amber-500" />
                            <StatusProgress label="รอตรวจสอบ" count={stats?.checking} total={stats?.total} color="bg-blue-500" />
                            <StatusProgress label="ไม่อนุมัติ / ถูกปฏิเสธ" count={stats?.rejected} total={stats?.total} color="bg-red-500" />
                        </div>

                        <div className="mt-10 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-2xl border border-primary-100 dark:border-primary-800">
                            <p className="text-xs text-primary-600 dark:text-primary-400 font-bold mb-1 uppercase tracking-wider">Quick Action</p>
                            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">ระบบกำลังทำงานปกติ ข้อมูลซิงค์ล่าสุดเมื่อไม่กี่วินาทีที่ผ่านมา</p>
                            <Link href="/sales" className="block w-full text-center py-2 bg-primary-600 text-white rounded-lg text-sm font-bold shadow-lg shadow-primary-500/20 hover:bg-primary-700 transition-colors">
                                สร้างคำขอใหม่
                            </Link>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

function StatCard({ title, value, icon, trend, isUp, color = "blue" }: any) {
    return (
        <motion.div
            whileHover={{ y: -4 }}
            className="glass-card p-6 border-b-4 border-transparent hover:border-primary-500 transition-all"
        >
            <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-center`}>
                    {icon}
                </div>
                {trend && (
                    <div className={`flex items-center text-xs font-bold ${isUp ? "text-green-500" : "text-red-500"}`}>
                        {isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        {trend}
                    </div>
                )}
            </div>
            <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">{title}</p>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums">{value}</h3>
        </motion.div>
    );
}

function StatusProgress({ label, count, total, color }: any) {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    return (
        <div className="space-y-2">
            <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400 font-medium">{label}</span>
                <span className="font-bold">{count} ({Math.round(percentage)}%)</span>
            </div>
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-full ${color}`}
                />
            </div>
        </div>
    );
}
