'use client'

import { PageShell } from "@/components/creator-dashboard"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, CheckCircle, XCircle, Clock, Loader2, RefreshCw, Eye, ExternalLink } from "lucide-react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { toast } from "@/components/ui/use-toast"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { manualPaymentsApi } from "@/lib/api/manual-payments"
import Image from "next/image"

interface PaymentRequest {
    _id: string;
    buyerId: {
        name: string;
        email: string;
        profile_picture?: string;
    };
    amountDT: number;
    promoCode?: string;
    paymentProof: string;
    createdAt: string;
    contentType: string;
    contentId?: string;
    contentTitle?: string | null;
    community?: {
        _id: string;
        name: string;
        slug?: string;
    } | null;
}

interface ManualPaymentHistoryItem extends PaymentRequest {
    status?: string;
    paymentMethod?: string;
    creatorNetDT?: number;
}

interface HistoryMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export default function ManualPaymentsPage() {
    const [payments, setPayments] = useState<PaymentRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [selectedProof, setSelectedProof] = useState<string | null>(null);

    const [history, setHistory] = useState<ManualPaymentHistoryItem[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyStatus, setHistoryStatus] = useState<string>('paid');
    const [historyPage, setHistoryPage] = useState<number>(1);
    const [historyMeta, setHistoryMeta] = useState<HistoryMeta>({ page: 1, limit: 20, total: 0, totalPages: 1 });

    const loadPayments = async () => {
        setLoading(true);
        try {
            const response = await manualPaymentsApi.getPendingPayments();
            // API shape: { success: true, data: PaymentRequest[] }
            const items = (response as any)?.data?.data || (response as any)?.data || [];
            setPayments(items as PaymentRequest[]);
        } catch (error) {
            console.error('Failed to load payments:', error);
            toast({
                title: "Error",
                description: "Failed to load pending payments.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const loadHistory = async (opts?: { status?: string; page?: number }) => {
        setHistoryLoading(true);
        try {
            const response = await manualPaymentsApi.getHistory({
                status: opts?.status ?? historyStatus,
                page: opts?.page ?? historyPage,
                limit: historyMeta.limit,
            });
            const items = (response as any)?.data?.data || (response as any)?.data || [];
            const meta = (response as any)?.data?.meta;
            setHistory(items as ManualPaymentHistoryItem[]);
            if (meta) {
                setHistoryMeta(meta as HistoryMeta);
            }
        } catch (error) {
            console.error('Failed to load manual payments history:', error);
            toast({
                title: "Error",
                description: "Failed to load payments history.",
                variant: "destructive",
            });
        } finally {
            setHistoryLoading(false);
        }
    };

    useEffect(() => {
        loadPayments();
        loadHistory({ status: 'paid', page: 1 });
    }, []);

    const handleAction = async (orderId: string, action: 'approve' | 'reject') => {
        setProcessingId(orderId);
        try {
            await manualPaymentsApi.verifyPayment(orderId, action);

            toast({
                title: action === 'approve' ? "Payment Approved" : "Payment Rejected",
                description: `The payment has been ${action}d successfully.`,
            });

            // Remove from list or refresh
            setPayments(prev => prev.filter(p => p._id !== orderId));
            loadHistory({ page: 1 });
        } catch (error) {
            console.error(`Failed to ${action} payment:`, error);
            toast({
                title: "Action Failed",
                description: `Failed to ${action} payment. Please try again.`,
                variant: "destructive",
            });
        } finally {
            setProcessingId(null);
        }
    };

    const filteredPayments = payments.filter(p =>
        p.buyerId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.buyerId?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.contentTitle || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.contentType || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.community?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredHistory = history.filter(p =>
        p.buyerId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.buyerId?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.contentTitle || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.contentType || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.community?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getFullImageUrl = (path: string) => {
        if (!path) return '';
        // If already absolute, return as-is
        if (path.startsWith('http')) return path;

        // Backend runs on port 3001 by default (check your setup)
        // Fallback to localhost:3001 if NEXT_PUBLIC_API_URL is not set or is pointing to frontend port
        const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
        let backendOrigin = 'http://localhost:3000'; // Default backend port

        if (apiBase) {
            try {
                const url = new URL(apiBase);
                backendOrigin = `${url.protocol}//${url.hostname}:${url.port || 3000}`;
            } catch {
                backendOrigin = 'http://localhost:3000';
            }
        }

        // Relative path (e.g., /uploads/image/filename.jpg)
        const normalized = path.startsWith('/') ? path : `/${path}`;
        return `${backendOrigin}${normalized}`;
    };

    return (
        <PageShell>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Manual Payments</h1>
                    <p className="text-gray-600 mt-1">Verify and approve manual payment requests</p>
                </div>
                <Button variant="outline" size="sm" onClick={loadPayments} disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                    Refresh
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Pending Requests</CardTitle>
                    <CardDescription>Review proof of payments uploaded by users</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between mb-4">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search user..."
                                className="pl-8"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Badge variant="secondary" className="ml-2">
                            {filteredPayments.length} Pending
                        </Badge>
                    </div>

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Community</TableHead>
                                    <TableHead>Content</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Proof</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-8">
                                            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                                            <p className="mt-2 text-sm text-muted-foreground">Loading specific requests...</p>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredPayments.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-8">
                                            <CheckCircle className="h-8 w-8 mx-auto text-green-500 mb-2" />
                                            <p className="text-lg font-medium">All caught up!</p>
                                            <p className="text-sm text-muted-foreground">No pending manual payments found.</p>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredPayments.map((payment) => (
                                        <TableRow key={payment._id}>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{payment.buyerId?.name || 'Unknown'}</span>
                                                    <span className="text-xs text-muted-foreground">{payment.buyerId?.email}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {payment.community?.name ? (
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{payment.community.name}</span>
                                                        {payment.community.slug && (
                                                            <span className="text-xs text-muted-foreground">{payment.community.slug}</span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{payment.contentTitle || '—'}</span>
                                                    {payment.contentId && (
                                                        <span className="text-xs text-muted-foreground">{payment.contentId}</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="capitalize">
                                                    {payment.contentType}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-bold">
                                                {payment.amountDT.toFixed(2)} TND
                                                {payment.promoCode && (
                                                    <span className="block text-xs text-green-600">Promo: {payment.promoCode}</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {new Date(payment.createdAt).toLocaleDateString()}
                                                <span className="block text-xs text-muted-foreground">
                                                    {new Date(payment.createdAt).toLocaleTimeString()}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 gap-1"
                                                    onClick={() => setSelectedProof(getFullImageUrl(payment.paymentProof))}
                                                >
                                                    <Eye className="h-3.5 w-3.5" />
                                                    View Proof
                                                </Button>
                                            </TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => handleAction(payment._id, 'reject')}
                                                    disabled={processingId === payment._id}
                                                >
                                                    {processingId === payment._id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reject"}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    className="bg-green-600 hover:bg-green-700"
                                                    onClick={() => handleAction(payment._id, 'approve')}
                                                    disabled={processingId === payment._id}
                                                >
                                                    {processingId === payment._id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Approve"}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Payment Proofs History</CardTitle>
                    <CardDescription>All manual payment proofs with status and details</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                variant={historyStatus === 'paid' ? 'default' : 'outline'}
                                onClick={() => {
                                    setHistoryStatus('paid')
                                    setHistoryPage(1)
                                    loadHistory({ status: 'paid', page: 1 })
                                }}
                            >
                                Approved
                            </Button>
                            <Button
                                size="sm"
                                variant={historyStatus === 'cancelled' ? 'default' : 'outline'}
                                onClick={() => {
                                    setHistoryStatus('cancelled')
                                    setHistoryPage(1)
                                    loadHistory({ status: 'cancelled', page: 1 })
                                }}
                            >
                                Rejected
                            </Button>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary">
                                {filteredHistory.length} Items
                            </Badge>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => loadHistory({ page: historyPage })}
                                disabled={historyLoading}
                            >
                                {historyLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                                Refresh
                            </Button>
                        </div>
                    </div>

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Community</TableHead>
                                    <TableHead>Content</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Proof</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {historyLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-8">
                                            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                                            <p className="mt-2 text-sm text-muted-foreground">Loading history...</p>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredHistory.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-8">
                                            <Clock className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                            <p className="text-lg font-medium">No history yet</p>
                                            <p className="text-sm text-muted-foreground">Manual payment proofs will appear here.</p>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredHistory.map((payment) => (
                                        <TableRow key={payment._id}>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{payment.buyerId?.name || 'Unknown'}</span>
                                                    <span className="text-xs text-muted-foreground">{payment.buyerId?.email}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {payment.community?.name ? (
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{payment.community.name}</span>
                                                        {payment.community.slug && (
                                                            <span className="text-xs text-muted-foreground">{payment.community.slug}</span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{payment.contentTitle || '—'}</span>
                                                    {payment.contentId && (
                                                        <span className="text-xs text-muted-foreground">{payment.contentId}</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="capitalize">
                                                    {payment.contentType}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-bold">
                                                {payment.amountDT.toFixed(2)} TND
                                                {payment.promoCode && (
                                                    <span className="block text-xs text-green-600">Promo: {payment.promoCode}</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        payment.status === 'paid'
                                                            ? 'default'
                                                            : payment.status === 'cancelled'
                                                                ? 'destructive'
                                                                : 'secondary'
                                                    }
                                                    className="capitalize"
                                                >
                                                    {payment.status || 'unknown'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {new Date(payment.createdAt).toLocaleDateString()}
                                                <span className="block text-xs text-muted-foreground">
                                                    {new Date(payment.createdAt).toLocaleTimeString()}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 gap-1"
                                                    onClick={() => setSelectedProof(getFullImageUrl(payment.paymentProof))}
                                                >
                                                    <Eye className="h-3.5 w-3.5" />
                                                    View Proof
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                        <p className="text-xs text-muted-foreground">
                            Page {historyMeta.page} of {historyMeta.totalPages} ({historyMeta.total} total)
                        </p>
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                disabled={historyMeta.page <= 1 || historyLoading}
                                onClick={() => {
                                    const nextPage = Math.max(1, historyMeta.page - 1)
                                    setHistoryPage(nextPage)
                                    loadHistory({ page: nextPage })
                                }}
                            >
                                Prev
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                disabled={historyMeta.page >= historyMeta.totalPages || historyLoading}
                                onClick={() => {
                                    const nextPage = Math.min(historyMeta.totalPages, historyMeta.page + 1)
                                    setHistoryPage(nextPage)
                                    loadHistory({ page: nextPage })
                                }}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={!!selectedProof} onOpenChange={(open) => !open && setSelectedProof(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Payment Proof</DialogTitle>
                        <DialogDescription>
                            Review the uploaded proof of payment.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4 flex flex-col items-center justify-center min-h-[300px] bg-slate-50 rounded-lg p-4">
                        {selectedProof && (
                            <div className="relative w-full h-[500px] flex items-center justify-center">
                                <img
                                    src={selectedProof}
                                    alt="Payment Proof"
                                    className="max-h-[500px] max-w-full object-contain rounded"
                                    referrerPolicy="no-referrer"
                                    crossOrigin="anonymous"
                                    onError={(e) => {
                                        // fall back to showing raw URL if image fails
                                        (e.currentTarget as HTMLImageElement).style.display = 'none'
                                    }}
                                />
                            </div>
                        )}
                        <div className="mt-4 flex gap-2">
                            {selectedProof && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    asChild
                                >
                                    <a href={selectedProof || '#'} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="h-4 w-4 mr-2" />
                                        Open Original in New Tab
                                    </a>
                                </Button>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </PageShell>
    )
}
