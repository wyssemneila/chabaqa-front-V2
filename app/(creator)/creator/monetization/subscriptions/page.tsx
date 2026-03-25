'use client'

import { PageShell } from "@/components/creator-dashboard"
import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Filter, Download, Plus, MoreHorizontal, CheckCircle, AlertCircle, Clock, RefreshCw, Loader2, ExternalLink } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
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
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api } from "@/lib/api"
import { subscriptionApi, CreatorSubscription, SubscriptionStats, SubscriptionStatus, PlanTier, CreatePlanData } from "@/lib/api/subscription.api"
import { format, parseISO } from 'date-fns';

const SubscriptionsPage = () => {
  const [subscriptions, setSubscriptions] = useState<CreatorSubscription[]>([]);
  const [stats, setStats] = useState<SubscriptionStats | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<SubscriptionStatus | 'all'>('all');
  const [showNewPlanDialog, setShowNewPlanDialog] = useState(false);
  const [newPlan, setNewPlan] = useState<Partial<CreatePlanData>>({
    tier: PlanTier.STARTER,
    name: "",
    priceDTPerMonth: 0,
    trialDays: 7
  });
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const loadSubscriptions = useCallback(async () => {
    setLoading(true);
    try {
      const filters = {
        status: activeTab === 'all' ? undefined : activeTab,
        page: pagination.page,
        limit: pagination.limit,
      };
      const response = await subscriptionApi.getAllSubscriptions(filters);
      setSubscriptions(response.data);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Failed to load subscriptions:', error);
      toast({
        title: "Error",
        description: "Failed to load subscriptions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [activeTab, pagination.page, pagination.limit]);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const response = await subscriptionApi.getSubscriptionStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
      toast({
        title: "Error",
        description: "Failed to load subscription statistics.",
        variant: "destructive",
      });
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSubscriptions();
    loadStats();
  }, [loadSubscriptions, loadStats]);

  const handleCreatePlan = async () => {
    if (!newPlan.name || !newPlan.priceDTPerMonth) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      await subscriptionApi.createPlan(newPlan as CreatePlanData);
      toast({
        title: "Plan Created",
        description: `New plan "${newPlan.name}" has been created successfully`,
      });
      setShowNewPlanDialog(false);
      setNewPlan({ tier: PlanTier.STARTER, name: "", priceDTPerMonth: 0 });
      // Refresh plans list if displayed on page
    } catch (error) {
      console.error('Failed to create plan:', error);
      toast({
        title: "Creation Failed",
        description: "Failed to create plan. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSubscriptionAction = async (action: 'view' | 'edit' | 'cancel' | 'delete', subscription: CreatorSubscription) => {
    try {
      switch (action) {
        case 'cancel':
          await subscriptionApi.cancelSubscription();
          toast({
            title: "Subscription Canceled",
            description: `Subscription for ${subscription.creatorId} will be canceled at the end of the period.`,
          });
          loadSubscriptions(); // Refresh list
          break;
        case 'delete':
          await subscriptionApi.deleteSubscription(subscription.id);
          toast({
            title: "Subscription Deleted",
            description: `Subscription for ${subscription.creatorId} has been deleted.`,
          });
          loadSubscriptions(); // Refresh list
          break;
        default:
          toast({
            title: "Action Not Implemented",
            description: "This action is not yet implemented.",
          });
          break;
      }
    } catch (error) {
      console.error(`Failed to ${action} subscription:`, error);
      toast({
        title: "Action Failed",
        description: `Failed to ${action} subscription. Please try again.`,
        variant: "destructive",
      });
    }
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const filteredSubscriptions = subscriptions.filter(sub => 
    sub.creatorId.toLowerCase().includes(searchQuery.toLowerCase()) || 
    sub.plan.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <PageShell>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Subscriptions</h1>
          <p className="text-gray-600 mt-1">Manage your recurring subscription plans and subscribers</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={loadStats} disabled={statsLoading}>
            {statsLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Refresh Stats
          </Button>
          <Dialog open={showNewPlanDialog} onOpenChange={setShowNewPlanDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" /> New Plan
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Subscription Plan</DialogTitle>
                <DialogDescription>Add a new subscription plan to offer to your customers.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="plan-name" className="text-right">Plan Name</Label>
                  <Input id="plan-name" value={newPlan.name} onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })} className="col-span-3" placeholder="e.g. Pro Plan" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="plan-tier" className="text-right">Plan Tier</Label>
                  <Select onValueChange={(value: PlanTier) => setNewPlan({ ...newPlan, tier: value })} defaultValue={PlanTier.STARTER}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select a tier" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(PlanTier).map(tier => <SelectItem key={tier} value={tier}>{tier}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="plan-price" className="text-right">Price (TND)</Label>
                  <Input id="plan-price" type="number" value={newPlan.priceDTPerMonth} onChange={(e) => setNewPlan({ ...newPlan, priceDTPerMonth: parseFloat(e.target.value) })} className="col-span-3" placeholder="e.g. 29.99" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="plan-trial" className="text-right">Trial Days</Label>
                  <Input id="plan-trial" type="number" value={newPlan.trialDays} onChange={(e) => setNewPlan({ ...newPlan, trialDays: parseInt(e.target.value) })} className="col-span-3" placeholder="e.g. 7" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowNewPlanDialog(false)}>Cancel</Button>
                <Button onClick={handleCreatePlan}>Create Plan</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.totalSubscribers ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscribers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.activeSubscribers ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : `${(stats?.monthlyRevenue ?? 0).toFixed(2)} TND`}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Subscription Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : `${(stats?.averageSubscriptionValue ?? 0).toFixed(2)} TND`}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Management */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription Management</CardTitle>
          <CardDescription>Manage your subscribers and subscription plans</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as SubscriptionStatus | 'all')}>
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value={SubscriptionStatus.ACTIVE}>Active</TabsTrigger>
                <TabsTrigger value={SubscriptionStatus.TRIALING}>Trialing</TabsTrigger>
                <TabsTrigger value={SubscriptionStatus.PAST_DUE}>Past Due</TabsTrigger>
                <TabsTrigger value={SubscriptionStatus.CANCELED}>Canceled</TabsTrigger>
              </TabsList>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input type="search" placeholder="Search subscriptions..." className="pl-8 w-[250px]" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
            </div>

            <TabsContent value={activeTab} className="m-0">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Next Billing</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-4"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                    ) : (
                      filteredSubscriptions.map((subscription) => (
                        <TableRow key={subscription.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{subscription.creatorId}</div>
                              {/* Add email here when available */}
                            </div>
                          </TableCell>
                          <TableCell>{subscription.plan}</TableCell>
                          <TableCell>
                            <Badge variant={
                                subscription.status === SubscriptionStatus.ACTIVE ? "default" :
                                subscription.status === SubscriptionStatus.PAST_DUE ? "destructive" : "outline"
                            } className="flex items-center gap-1 w-fit">
                              {subscription.status === SubscriptionStatus.ACTIVE && <CheckCircle className="h-3 w-3" />}
                              {subscription.status === SubscriptionStatus.PAST_DUE && <AlertCircle className="h-3 w-3" />}
                              {subscription.status === SubscriptionStatus.CANCELED && <Clock className="h-3 w-3" />}
                              <span className="capitalize">{subscription.status.replace("_", " ")}</span>
                            </Badge>
                          </TableCell>
                          <TableCell>{format(parseISO(subscription.currentPeriodEnd), 'yyyy-MM-dd')}</TableCell>
                          <TableCell>{format(parseISO(subscription.createdAt), 'yyyy-MM-dd')}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /><span className="sr-only">Open menu</span></Button></DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleSubscriptionAction('view', subscription)}>View details</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleSubscriptionAction('edit', subscription)}>Edit</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-yellow-600" onClick={() => handleSubscriptionAction('cancel', subscription)}>Cancel subscription</DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600" onClick={() => handleSubscriptionAction('delete', subscription)}>Delete subscription</DropdownMenuItem>
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
          </Tabs>
          <CardFooter className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing <strong>{filteredSubscriptions.length}</strong> of <strong>{pagination.total}</strong> subscriptions
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => handlePageChange(pagination.page - 1)}>Previous</Button>
              <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages} onClick={() => handlePageChange(pagination.page + 1)}>Next</Button>
            </div>
          </CardFooter>
        </CardContent>
      </Card>
    </PageShell>
  )
}

export default SubscriptionsPage;
