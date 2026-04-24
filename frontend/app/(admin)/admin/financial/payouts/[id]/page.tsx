"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAdminAuth } from "@/app/(admin)/providers/admin-auth-provider"
import { adminApi, ProcessPayoutDto, UpdatePayoutStatusDto, AdminPayoutDetails } from "@/lib/api/admin-api"
import { StatusBadge } from "@/app/(admin)/_components/status-badge"
import { ConfirmDialog } from "@/app/(admin)/_components/confirm-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ArrowLeft, Check, X, Edit, Copy } from "lucide-react"
import { toast } from "sonner"

type PayoutDetails = AdminPayoutDetails

export default function PayoutDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const payoutId = params.id as string
  const { isAuthenticated, loading: authLoading } = useAdminAuth()
  
  const [loading, setLoading] = useState(true)
  const [payout, setPayout] = useState<PayoutDetails | null>(null)
  const [processDialogOpen, setProcessDialogOpen] = useState(false)
  const [updateStatusDialogOpen, setUpdateStatusDialogOpen] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  // Form states
  const [processForm, setProcessForm] = useState<ProcessPayoutDto>({
    transactionReference: '',
    notes: ''
  })
  const [updateStatusForm, setUpdateStatusForm] = useState<UpdatePayoutStatusDto>({
    status: 'pending',
    notes: ''
  })
  const [cancelReason, setCancelReason] = useState('')

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/admin/login')
    }
  }, [authLoading, isAuthenticated, router])

  // Fetch payout details
  useEffect(() => {
    if (!isAuthenticated || authLoading || !payoutId) return

    const fetchPayout = async () => {
      setLoading(true)
      try {
        const response = await adminApi.financial.getPayoutById(payoutId)
        const data = response?.data || response
        setPayout(data)
        setUpdateStatusForm(prev => ({ ...prev, status: data?.status || 'pending' }))
      } catch (error) {
        console.error('[Payout Details] Error:', error)
        toast.error('Failed to load payout details')
      } finally {
        setLoading(false)
      }
    }

    fetchPayout()
  }, [isAuthenticated, authLoading, payoutId])

  const handleProcessPayout = async () => {
    setProcessing(true)
    try {
      await adminApi.financial.processPayout(payoutId, processForm)
      toast.success('Payout processed successfully')
      setProcessDialogOpen(false)
      // Refresh payout details
      const response = await adminApi.financial.getPayoutById(payoutId)
      setPayout(response?.data || response)
    } catch (error) {
      console.error('[Process Payout] Error:', error)
      toast.error('Failed to process payout')
    } finally {
      setProcessing(false)
    }
  }

  const handleUpdateStatus = async () => {
    setUpdating(true)
    try {
      await adminApi.financial.updatePayoutStatus(payoutId, updateStatusForm)
      toast.success('Payout status updated successfully')
      setUpdateStatusDialogOpen(false)
      // Refresh payout details
      const response = await adminApi.financial.getPayoutById(payoutId)
      setPayout(response?.data || response)
    } catch (error) {
      console.error('[Update Status] Error:', error)
      toast.error('Failed to update payout status')
    } finally {
      setUpdating(false)
    }
  }

  const handleCancelPayout = async () => {
    if (!cancelReason.trim()) {
      toast.error('Please provide a cancellation reason')
      return
    }

    setCancelling(true)
    try {
      await adminApi.financial.cancelPayout(payoutId, cancelReason)
      toast.success('Payout cancelled successfully')
      setCancelDialogOpen(false)
      // Refresh payout details
      const response = await adminApi.financial.getPayoutById(payoutId)
      setPayout(response?.data || response)
    } catch (error) {
      console.error('[Cancel Payout] Error:', error)
      toast.error('Failed to cancel payout')
    } finally {
      setCancelling(false)
    }
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: currency || 'TND'
    }).format(amount || 0)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString()
  }

  const copyToClipboard = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value)
      toast.success(`${label} copied`)
    } catch {
      toast.error(`Failed to copy ${label.toLowerCase()}`)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading payout details...</p>
        </div>
      </div>
    )
  }

  if (!payout) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Payout not found</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.push('/admin/financial/payouts')}
          >
            Back to Payouts
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/admin/financial/payouts')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Payout Details</h1>
            <p className="text-muted-foreground mt-1">
              ID: {payout._id}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {payout.status === 'pending' && (
            <>
              <Button
                variant="outline"
                onClick={() => setUpdateStatusDialogOpen(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Update Status
              </Button>
              <Button
                onClick={() => setProcessDialogOpen(true)}
              >
                <Check className="h-4 w-4 mr-2" />
                Process Payout
              </Button>
              <Button
                variant="destructive"
                onClick={() => setCancelDialogOpen(true)}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </>
          )}
          {payout.status === 'processing' && (
            <Button
              variant="outline"
              onClick={() => setUpdateStatusDialogOpen(true)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Update Status
            </Button>
          )}
        </div>
      </div>

      {/* Payout Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Payout Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-muted-foreground">Amount</Label>
              <div className="text-2xl font-bold">
                {formatCurrency(payout.amount, payout.currency)}
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">Status</Label>
              <div className="mt-1">
                <StatusBadge status={payout.status} size="lg" />
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">Payment Method</Label>
              <div className="font-medium capitalize">
                {payout.method.replace('_', ' ')}
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">Transaction Reference</Label>
              <div className="font-mono text-sm">
                {payout.transactionReference || 'Not available'}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Creator Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-muted-foreground">Username</Label>
              <div className="font-medium">{payout.creator.username}</div>
            </div>
            <div>
              <Label className="text-muted-foreground">Email</Label>
              <div className="font-medium">{payout.creator.email}</div>
            </div>
            <div>
              <Label className="text-muted-foreground">Creator ID</Label>
              <div className="font-mono text-sm">{payout.creator._id}</div>
            </div>
          </CardContent>
        </Card>

        {payout.method === 'bank_transfer' && (
          <Card>
            <CardHeader>
              <CardTitle>Bank Transfer Details</CardTitle>
              <CardDescription>Use these credentials to send the payout.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Account Holder</Label>
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium">
                    {payout.bankCredentials?.ownerName || payout.bankAccount?.ownerName || 'Not available'}
                  </div>
                  {(payout.bankCredentials?.ownerName || payout.bankAccount?.ownerName) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(
                        String(payout.bankCredentials?.ownerName || payout.bankAccount?.ownerName),
                        'Account holder'
                      )}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Bank Name</Label>
                <div className="font-medium">
                  {payout.bankCredentials?.bankName || payout.bankAccount?.bankName || 'Not available'}
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">RIB</Label>
                <div className="flex items-center justify-between gap-2">
                  <div className="font-mono text-sm">
                    {payout.bankCredentials?.rib || payout.bankAccount?.rib || 'Not available'}
                  </div>
                  {(payout.bankCredentials?.rib || payout.bankAccount?.rib) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(
                        String(payout.bankCredentials?.rib || payout.bankAccount?.rib),
                        'RIB'
                      )}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Community Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-muted-foreground">Community Name</Label>
              <div className="font-medium">{payout.community.name}</div>
            </div>
            <div>
              <Label className="text-muted-foreground">Slug</Label>
              <div className="font-medium">{payout.community.slug}</div>
            </div>
            <div>
              <Label className="text-muted-foreground">Community ID</Label>
              <div className="font-mono text-sm">{payout.community._id}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-muted-foreground">Initiated At</Label>
              <div className="font-medium">{formatDate(payout.initiatedAt)}</div>
            </div>
            {payout.processedAt && (
              <div>
                <Label className="text-muted-foreground">Processed At</Label>
                <div className="font-medium">{formatDate(payout.processedAt)}</div>
              </div>
            )}
            {payout.createdBy && (
              <div>
                <Label className="text-muted-foreground">Created By</Label>
                <div className="font-medium">{payout.createdBy.name}</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      {payout.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{payout.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Process Payout Dialog */}
      <Dialog open={processDialogOpen} onOpenChange={setProcessDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Payout</DialogTitle>
            <DialogDescription>
              Mark this payout as processed and add transaction details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="transaction-ref">Transaction Reference</Label>
              <Input
                id="transaction-ref"
                value={processForm.transactionReference}
                onChange={(e) => setProcessForm(prev => ({ ...prev, transactionReference: e.target.value }))}
                placeholder="Enter transaction reference"
              />
            </div>
            <div>
              <Label htmlFor="process-notes">Notes (Optional)</Label>
              <Textarea
                id="process-notes"
                value={processForm.notes}
                onChange={(e) => setProcessForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Add processing notes..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProcessDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleProcessPayout} disabled={processing}>
              {processing ? 'Processing...' : 'Process Payout'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={updateStatusDialogOpen} onOpenChange={setUpdateStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Payout Status</DialogTitle>
            <DialogDescription>
              Change the status of this payout
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={updateStatusForm.status}
                onValueChange={(value: any) => setUpdateStatusForm(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status-notes">Notes (Optional)</Label>
              <Textarea
                id="status-notes"
                value={updateStatusForm.notes}
                onChange={(e) => setUpdateStatusForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Add status update notes..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdateStatusDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateStatus} disabled={updating}>
              {updating ? 'Updating...' : 'Update Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Payout Dialog */}
      <ConfirmDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        title="Cancel Payout"
        description="Are you sure you want to cancel this payout? This action cannot be undone."
        confirmLabel="Cancel Payout"
        onConfirm={handleCancelPayout}
        variant="destructive"
        requiresInput={true}
        inputPlaceholder="Enter cancellation reason..."
      />
    </div>
  )
}
