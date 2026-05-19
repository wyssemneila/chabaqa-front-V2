'use client'

import { useState, useEffect } from "react"
import { useCommunityGuard } from "@/hooks/use-community-guard"
import { PageShell } from "@/components/creator-dashboard"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Filter, Download, Plus, MoreHorizontal, CheckCircle, AlertCircle, Clock, TrendingUp, RefreshCw, Loader2, Edit3, Lock } from "lucide-react"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { api } from "@/lib/api"

interface PayoutData {
  id: string;
  date: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed' | 'cancelled' | 'scheduled';
  method: string;
  reference: string;
  items: number;
  currency?: string;
}

export default function PayoutsPage() {
  const { guard, selectedCommunityId, isLoading: communityLoading } = useCommunityGuard()
  const [payouts, setPayouts] = useState<PayoutData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [newPayout, setNewPayout] = useState({
    amount: "",
    method: "bank_transfer"
  });
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [stats, setStats] = useState<any | null>(null);
  const [availableBalance, setAvailableBalance] = useState<number | null>(null);
  const [bankCredentials, setBankCredentials] = useState({
    ownerName: "",
    bankName: "",
    rib: "",
  });
  const [bankCredentialsSnapshot, setBankCredentialsSnapshot] = useState({
    ownerName: "",
    bankName: "",
    rib: "",
  });
  const [bankConfigured, setBankConfigured] = useState(false);
  const [bankLoading, setBankLoading] = useState(false);
  const [bankSaving, setBankSaving] = useState(false);
  const [isBankEditing, setIsBankEditing] = useState(false);
  const [isBankPanelOpen, setIsBankPanelOpen] = useState(false);

  const loadPayouts = async () => {
    setLoading(true);
    setBankLoading(true);
    try {
      if (!selectedCommunityId) {
        setPayouts([]);
        setStats(null);
        setAvailableBalance(null);
        setLoading(false);
        return;
      }
      const res = await api.creatorAnalytics.getPayouts({ page: 1, limit: 50, communityId: selectedCommunityId }).catch(() => null as any);
      const list = res?.data?.payouts || res?.payouts || [];

      const normalized: PayoutData[] = (Array.isArray(list) ? list : []).map((p: any) => ({
        id: p._id || p.id,
        date: p.createdAt ? new Date(p.createdAt).toISOString().split("T")[0] : "",
        amount: Number(p.amount) || 0,
        status: p.status || "pending",
        method: p.method ? p.method.replace("_", " ") : "Bank Transfer",
        reference: p.reference || "",
        items: p.itemsCount || p.items || 0,
        currency: p.currency || 'TND',
      }));
      setPayouts(normalized);

      const statsRes = await api.creatorAnalytics.getPayoutStats({ communityId: selectedCommunityId }).catch(() => null as any);
      const balRes = await api.creatorAnalytics.getAvailableBalance({ communityId: selectedCommunityId }).catch(() => null as any);
      const bankRes = await api.creatorAnalytics.getBankCredentials().catch(() => null as any);

      setStats(statsRes?.data || statsRes || null);
      setAvailableBalance((balRes?.data?.availableBalance) ?? (balRes?.availableBalance) ?? null);
      const bankData = bankRes?.data || bankRes || null;
      setBankConfigured(Boolean(bankData?.isConfigured));
      setBankCredentials({
        ownerName: bankData?.bankDetails?.ownerName || "",
        bankName: bankData?.bankDetails?.bankName || "",
        rib: bankData?.bankDetails?.rib || "",
      });
      setBankCredentialsSnapshot({
        ownerName: bankData?.bankDetails?.ownerName || "",
        bankName: bankData?.bankDetails?.bankName || "",
        rib: bankData?.bankDetails?.rib || "",
      });
      setIsBankEditing(!Boolean(bankData?.isConfigured));
      setIsBankPanelOpen(!Boolean(bankData?.isConfigured));
    } catch (error) {
      console.error('Failed to load payouts:', error);
      toast({
        title: "Error",
        description: "Failed to load payout data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setBankLoading(false);
    }
  };

  // Load payouts from API
  useEffect(() => {
    if (communityLoading) return;
    if (!selectedCommunityId) {
      toast({
        title: "Select a community",
        description: "Choose a community to view payouts.",
        variant: "destructive",
      });
      setPayouts([]);
      setStats(null);
      setAvailableBalance(null);
      setLoading(false);
      return;
    }
    loadPayouts();
  }, [selectedCommunityId, communityLoading]);

  // Load payout stats from API
  const loadStats = async () => {
    setStatsLoading(true);
    try {
      if (!selectedCommunityId) return;
      const statsRes = await api.creatorAnalytics.getPayoutStats({ communityId: selectedCommunityId });
      const balRes = await api.creatorAnalytics.getAvailableBalance({ communityId: selectedCommunityId }).catch(() => null as any);

      setStats(statsRes?.data || statsRes || null);
      setAvailableBalance((balRes?.data?.availableBalance) ?? (balRes?.availableBalance) ?? null);
      toast({ title: "Stats Updated", description: "Payout statistics have been refreshed." });
    } catch (error) {
      console.error('Failed to load stats:', error);
      toast({
        title: "Error",
        description: "Failed to load payout statistics.",
        variant: "destructive",
      });
    } finally {
      setStatsLoading(false);
    }
  };

  // Filter payouts based on search query and active tab
  const filteredPayouts = payouts.filter(payout => {
    const haystack = `${payout.reference} ${payout.method} ${payout.currency || ''} ${payout.amount}`.toLowerCase();
    const matchesSearch = haystack.includes(searchQuery.toLowerCase());
    
    if (activeTab === "all") return matchesSearch;
    return matchesSearch && payout.status === activeTab;
  });

  const formatAmount = (p: PayoutData) => {
    const currency = p.currency || 'TND';
    return `${currency} ${p.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatMoney = (amount: number | null | undefined, currency = 'TND') => {
    const parsed = Number(amount ?? 0);
    const safeAmount = Number.isFinite(parsed) ? parsed : 0;
    return `${currency} ${safeAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const pendingAmountRaw = Number(stats?.pendingAmount ?? payouts.filter((p) => p.status === "pending" || p.status === "scheduled").reduce((sum, payout) => sum + payout.amount, 0));
  const paidOutAmountRaw = Number(stats?.totalPaid ?? payouts.filter((p) => p.status === "completed").reduce((sum, payout) => sum + payout.amount, 0));
  const successRateRaw = Number(stats?.successRate ?? 0);
  const failedPayouts = payouts.filter((p) => p.status === "failed" || p.status === "cancelled");
  const pendingAmount = Number.isFinite(pendingAmountRaw) ? pendingAmountRaw : 0;
  const paidOutAmount = Number.isFinite(paidOutAmountRaw) ? paidOutAmountRaw : 0;
  const successRate = Math.round(Number.isFinite(successRateRaw) ? successRateRaw : 0);

  const normalizeRib = (value: string) => value.replace(/\s+/g, "");

  const handleSaveBankCredentials = async () => {
    const rib = normalizeRib(bankCredentials.rib);
    if (!bankCredentials.ownerName.trim() || !bankCredentials.bankName.trim()) {
      toast({
        title: "Missing fields",
        description: "Account holder name and bank name are required.",
        variant: "destructive",
      });
      return;
    }
    if (!/^\d{20}$/.test(rib)) {
      toast({
        title: "Invalid RIB",
        description: "Tunisian RIB must contain exactly 20 digits.",
        variant: "destructive",
      });
      return;
    }

    setBankSaving(true);
    try {
      const response = await api.creatorAnalytics.updateBankCredentials({
        ownerName: bankCredentials.ownerName.trim(),
        bankName: bankCredentials.bankName.trim(),
        rib,
      });
      const data = (response as any)?.data || response;
      setBankConfigured(Boolean(data?.isConfigured));
      setBankCredentials({
        ownerName: data?.bankDetails?.ownerName || bankCredentials.ownerName.trim(),
        bankName: data?.bankDetails?.bankName || bankCredentials.bankName.trim(),
        rib: data?.bankDetails?.rib || rib,
      });
      setBankCredentialsSnapshot({
        ownerName: data?.bankDetails?.ownerName || bankCredentials.ownerName.trim(),
        bankName: data?.bankDetails?.bankName || bankCredentials.bankName.trim(),
        rib: data?.bankDetails?.rib || rib,
      });
      setIsBankEditing(false);
      toast({
        title: "Bank credentials saved",
        description: "Your Tunisian banking credentials are ready for payouts.",
      });
    } catch (error) {
      console.error('Failed to save bank credentials:', error);
      toast({
        title: "Save failed",
        description: "Could not save bank credentials. Please try again.",
        variant: "destructive",
      });
    } finally {
      setBankSaving(false);
    }
  };

  const handleStartBankEdit = () => {
    setIsBankEditing(true);
  };

  const handleCancelBankEdit = () => {
    setBankCredentials(bankCredentialsSnapshot);
    setIsBankEditing(false);
  };

  // Handle requesting a new payout
  const handleRequestPayout = async () => {
    if (!selectedCommunityId) {
      toast({ title: "Select a community", description: "Choose a community before requesting a payout.", variant: "destructive" });
      return;
    }
    if (!newPayout.amount || isNaN(Number(newPayout.amount))) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid payout amount",
        variant: "destructive"
      });
      return;
    }
    if (newPayout.method === 'bank_transfer' && !bankConfigured) {
      toast({
        title: "Bank credentials required",
        description: "Set your Tunisian banking credentials before requesting bank transfer payouts.",
        variant: "destructive",
      });
      return;
    }

    try {
      await api.creatorAnalytics.requestPayout({
        amount: Number(newPayout.amount),
        method: newPayout.method,
        communityId: selectedCommunityId,
      });

      await loadPayouts();
      setNewPayout({ amount: "", method: "bank_transfer" });
      setShowRequestDialog(false);

      toast({
        title: "Payout Requested",
        description: `Your payout request for $${Number(newPayout.amount).toLocaleString()} has been submitted`,
      });
    } catch (error) {
      console.error('Failed to request payout:', error);
      toast({
        title: "Request Failed",
        description: "Failed to submit payout request. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle payout actions
  const handlePayoutAction = async (action: string, payout: PayoutData) => {
    try {
      switch(action) {
        case "view":
          toast({
            title: "Viewing Details",
            description: `Viewing details for payout ${payout.reference}`,
          });
          break;
        case "download":
          toast({ title: "Download Started", description: `Downloading receipt for payout ${payout.reference}` });
          break;
        case "cancel":
          await api.creatorAnalytics.cancelPayout(payout.id, 'Cancelled by user');
          await loadPayouts();
          toast({ title: "Payout Cancelled", description: `Payout ${payout.reference} has been cancelled` });
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Failed to perform payout action:', error);
      toast({
        title: "Action Failed",
        description: "Failed to perform the requested action. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle export
  const handleExport = async () => {
    try {
      // In a real implementation, this would call: await api.payments.exportPayouts();
      toast({
        title: "Export Started",
        description: "Your payout data is being exported to CSV",
      });
    } catch (error) {
      console.error('Failed to export payouts:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export payout data. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (guard) return guard

  return (
    <PageShell>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payouts</h1>
          <p className="text-gray-600 mt-1">Available, pending, and paid out earnings for this community.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={loadStats} disabled={statsLoading}>
            {statsLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="hidden md:inline-flex">
                <Plus className="h-4 w-4 mr-2" />
                Request Payout
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Request Payout</DialogTitle>
                <DialogDescription>
                  Request a payout of your available earnings to your bank account or PayPal.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="payout-amount" className="text-right">
                    Amount
                  </Label>
                  <Input
                    id="payout-amount"
                    type="number"
                    value={newPayout.amount}
                    onChange={(e) => setNewPayout({...newPayout, amount: e.target.value})}
                    className="col-span-3"
                    placeholder="1000"
                    min="1"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="payout-method" className="text-right">
                    Method
                  </Label>
                  <Select value={newPayout.method} onValueChange={(value) => setNewPayout({...newPayout, method: value})}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select payout method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="paypal">PayPal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowRequestDialog(false)}>Cancel</Button>
                <Button onClick={handleRequestPayout}>Request Payout</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Money overview */}
      <div className="rounded-lg border bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Payout status</h2>
            <p className="text-xs text-muted-foreground">
              {bankConfigured
                ? "Bank details are ready. Review pending and failed payouts before requesting more."
                : "Set up bank details before requesting bank transfer payouts."}
            </p>
          </div>
          <Badge variant={bankConfigured ? "default" : "outline"}>
            {bankLoading ? "Checking" : bankConfigured ? "Ready for payouts" : "Setup needed"}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatMoney(availableBalance)}
            </div>
            <p className="text-xs text-muted-foreground">Ready to request</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatMoney(pendingAmount)}
            </div>
            <p className="text-xs text-muted-foreground">Requested or scheduled</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Out</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatMoney(paidOutAmount)}
            </div>
            <p className="text-xs text-muted-foreground">Completed payouts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {successRate}%
            </div>
            <p className="text-xs text-muted-foreground">Successful payouts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{failedPayouts.length}</div>
            <p className="text-xs text-muted-foreground">Needs review</p>
          </CardContent>
        </Card>
      </div>

      <Collapsible open={isBankPanelOpen} onOpenChange={setIsBankPanelOpen} className="hidden md:block">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Bank Setup</CardTitle>
                <CardDescription>Only open this when you need to add or update payout details.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={bankConfigured ? "default" : "outline"}>
                  {bankLoading ? "Checking..." : bankConfigured ? "Ready" : "Needed"}
                </Badge>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" size="sm">
                    {isBankPanelOpen ? "Hide" : bankConfigured ? "Edit Bank" : "Set Up Bank"}
                  </Button>
                </CollapsibleTrigger>
              </div>
            </div>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              {!isBankEditing && (
                <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Banking credentials are locked. Click Edit to update them.
                </div>
              )}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="bank-owner-name">Account holder name</Label>
                  <Input
                    id="bank-owner-name"
                    value={bankCredentials.ownerName}
                    onChange={(e) => setBankCredentials(prev => ({ ...prev, ownerName: e.target.value }))}
                    placeholder="Full legal name"
                    disabled={bankSaving || bankLoading || !isBankEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bank-name">Bank name</Label>
                  <Input
                    id="bank-name"
                    value={bankCredentials.bankName}
                    onChange={(e) => setBankCredentials(prev => ({ ...prev, bankName: e.target.value }))}
                    placeholder="Banque de Tunisie..."
                    disabled={bankSaving || bankLoading || !isBankEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bank-rib">RIB (20 digits)</Label>
                  <Input
                    id="bank-rib"
                    value={bankCredentials.rib}
                    onChange={(e) => setBankCredentials(prev => ({ ...prev, rib: e.target.value.replace(/[^\d\s]/g, '') }))}
                    placeholder="12345678901234567890"
                    disabled={bankSaving || bankLoading || !isBankEditing}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                {isBankEditing ? (
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={handleCancelBankEdit} disabled={bankSaving}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveBankCredentials} disabled={bankSaving}>
                      {bankSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : "Save banking credentials"}
                    </Button>
                  </div>
                ) : (
                  <Button onClick={handleStartBankEdit} disabled={bankLoading}>
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Payout Management */}
      <Card className="hidden md:block">
        <CardHeader>
          <CardTitle>Payout Management</CardTitle>
          <CardDescription>View and manage your payout history and requests</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" onValueChange={setActiveTab}>
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
                <TabsTrigger value="failed">Failed</TabsTrigger>
              </TabsList>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search payouts..."
                    className="pl-8 w-[250px]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    toast({
                      title: "Filter Applied",
                      description: "Payout list has been filtered",
                    });
                  }}
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                </Button>
              </div>
            </div>

            <TabsContent value="all" className="m-0">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPayouts.map((payout) => (
                        <TableRow key={payout.id}>
                          <TableCell>{payout.date}</TableCell>
                          <TableCell className="font-medium">{formatAmount(payout)}</TableCell>

                          <TableCell>
                            <Badge 
                              variant={
                                payout.status === "completed" ? "default" : 
                                payout.status === "failed" ? "destructive" : 
                                "outline"
                              }
                              className="flex items-center gap-1 w-fit"
                            >
                              {payout.status === "completed" && <CheckCircle className="h-3 w-3" />}
                              {payout.status === "pending" && <Clock className="h-3 w-3" />}
                              {payout.status === "scheduled" && <Clock className="h-3 w-3" />}
                              {payout.status === "failed" && <AlertCircle className="h-3 w-3" />}
                              {payout.status === "cancelled" && <AlertCircle className="h-3 w-3" />}
                              <span className="capitalize">{payout.status.replace("_", " ")}</span>
                            </Badge>
                          </TableCell>
                          <TableCell>{payout.method}</TableCell>
                          <TableCell>{payout.reference}</TableCell>
                          <TableCell>{payout.items}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Open menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handlePayoutAction("view", payout)}>View details</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handlePayoutAction("download", payout)}>Download receipt</DropdownMenuItem>
                                {payout.status === "pending" && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      className="text-red-600" 
                                      onClick={() => handlePayoutAction("cancel", payout)}
                                    >
                                      Cancel payout
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            
            <TabsContent value="completed" className="m-0">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayouts
                      .filter(p => p.status === "completed")
                      .map((payout) => (
                        <TableRow key={payout.id}>
                          <TableCell>{payout.date}</TableCell>
                          <TableCell className="font-medium">{formatAmount(payout)}</TableCell>
                          <TableCell>
                            <Badge className="flex items-center gap-1 w-fit">
                              <CheckCircle className="h-3 w-3" />
                              <span className="capitalize">{payout.status}</span>
                            </Badge>
                          </TableCell>
                          <TableCell>{payout.method}</TableCell>
                          <TableCell>{payout.reference}</TableCell>
                          <TableCell>{payout.items}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Open menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handlePayoutAction("view", payout)}>View details</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handlePayoutAction("download", payout)}>Download receipt</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            
            <TabsContent value="pending" className="m-0">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayouts
                      .filter(p => p.status === "pending")
                      .map((payout) => (
                        <TableRow key={payout.id}>
                          <TableCell>{payout.date}</TableCell>
                          <TableCell className="font-medium">{formatAmount(payout)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="flex items-center gap-1 w-fit">
                              <Clock className="h-3 w-3" />
                              <span className="capitalize">{payout.status}</span>
                            </Badge>
                          </TableCell>
                          <TableCell>{payout.method}</TableCell>
                          <TableCell>{payout.reference}</TableCell>
                          <TableCell>{payout.items}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Open menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handlePayoutAction("view", payout)}>View details</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handlePayoutAction("download", payout)}>Download receipt</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-red-600" 
                                  onClick={() => handlePayoutAction("cancel", payout)}
                                >
                                  Cancel payout
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            
            <TabsContent value="scheduled" className="m-0">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayouts
                      .filter(p => p.status === "scheduled")
                      .map((payout) => (
                        <TableRow key={payout.id}>
                          <TableCell>{payout.date}</TableCell>
                          <TableCell className="font-medium">{formatAmount(payout)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="flex items-center gap-1 w-fit">
                              <Clock className="h-3 w-3" />
                              <span className="capitalize">{payout.status.replace("_", " ")}</span>
                            </Badge>
                          </TableCell>
                          <TableCell>{payout.method}</TableCell>
                          <TableCell>{payout.reference}</TableCell>
                          <TableCell>{payout.items}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Open menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handlePayoutAction("view", payout)}>View details</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handlePayoutAction("download", payout)}>Download receipt</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            
            <TabsContent value="failed" className="m-0">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayouts
                      .filter(p => p.status === "failed")
                      .map((payout) => (
                        <TableRow key={payout.id}>
                          <TableCell>{payout.date}</TableCell>
                          <TableCell className="font-medium">{formatAmount(payout)}</TableCell>
                          <TableCell>
                            <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                              <AlertCircle className="h-3 w-3" />
                              <span className="capitalize">{payout.status}</span>
                            </Badge>
                          </TableCell>
                          <TableCell>{payout.method}</TableCell>
                          <TableCell>{payout.reference}</TableCell>
                          <TableCell>{payout.items}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Open menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handlePayoutAction("view", payout)}>View details</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handlePayoutAction("download", payout)}>Download receipt</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
          <CardFooter className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing <strong>{filteredPayouts.length}</strong> of <strong>{payouts.length}</strong> payouts
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                disabled
                onClick={() => {
                  toast({
                    title: "Previous Page",
                    description: "Navigating to previous page",
                  });
                }}
              >
                Previous
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  toast({
                    title: "Next Page",
                    description: "Navigating to next page",
                  });
                }}
              >
                Next
              </Button>
            </div>
          </CardFooter>
        </CardContent>
      </Card>
    </PageShell>
  )
}
