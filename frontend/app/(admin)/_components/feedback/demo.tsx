/**
 * Demo page showcasing all feedback components
 * This file is for development/testing purposes only
 */

"use client"

import { useState } from 'react'
import { Users, Building2, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Import all feedback components
import { toast } from '@/lib/toast'
import { MetricCardSkeleton } from '../metric-card-skeleton'
import { DataTableSkeleton } from '../data-table-skeleton'
import { LoadingButton } from '../loading-button'
import { LoadingOverlay, LoadingSpinner } from '../loading-overlay'
import { PageLoading } from '../page-loading'
import { EmptyState } from '../empty-state'
import {
  EmptyUsers,
  EmptyCommunities,
  EmptyPendingApprovals,
  EmptyModerationQueue,
  EmptyTransactions,
  EmptyPayouts,
  EmptyCampaigns,
  EmptyTemplates,
  EmptyAuditLogs,
  EmptySecurityEvents,
  EmptySearchResults,
  EmptyFilteredResults,
} from '../empty-states'

export function FeedbackDemo() {
  const [loading, setLoading] = useState(false)
  const [buttonLoading, setButtonLoading] = useState(false)

  const handleToastSuccess = () => {
    toast.success('Operation successful!', {
      description: 'Your changes have been saved.',
    })
  }

  const handleToastError = () => {
    toast.error('Operation failed', {
      description: 'An error occurred while processing your request.',
      action: {
        label: 'Retry',
        onClick: () => toast.info('Retrying...'),
      },
    })
  }

  const handleToastInfo = () => {
    toast.info('New update available', {
      description: 'A new version of the dashboard is ready.',
    })
  }

  const handleToastWarning = () => {
    toast.warning('This action cannot be undone', {
      description: 'Please confirm before proceeding.',
    })
  }

  const handleToastLoading = () => {
    const id = toast.loading('Processing request...')
    setTimeout(() => {
      toast.dismiss(id)
      toast.success('Request completed!')
    }, 3000)
  }

  const handleToastPromise = () => {
    const promise = new Promise((resolve, reject) => {
      setTimeout(() => {
        Math.random() > 0.5 ? resolve('Success!') : reject(new Error('Failed!'))
      }, 2000)
    })

    toast.promise(promise, {
      loading: 'Processing...',
      success: 'Operation completed successfully!',
      error: 'Operation failed. Please try again.',
    })
  }

  const handleButtonClick = () => {
    setButtonLoading(true)
    setTimeout(() => {
      setButtonLoading(false)
      toast.success('Action completed!')
    }, 2000)
  }

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Feedback Components Demo</h1>
        <p className="text-muted-foreground">
          Demonstration of all user feedback components for the admin dashboard
        </p>
      </div>

      <Tabs defaultValue="toasts">
        <TabsList>
          <TabsTrigger value="toasts">Toast Notifications</TabsTrigger>
          <TabsTrigger value="loading">Loading States</TabsTrigger>
          <TabsTrigger value="empty">Empty States</TabsTrigger>
        </TabsList>

        {/* Toast Notifications Tab */}
        <TabsContent value="toasts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Toast Notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <Button onClick={handleToastSuccess} variant="default">
                  Success Toast
                </Button>
                <Button onClick={handleToastError} variant="destructive">
                  Error Toast
                </Button>
                <Button onClick={handleToastInfo} variant="secondary">
                  Info Toast
                </Button>
                <Button onClick={handleToastWarning} variant="outline">
                  Warning Toast
                </Button>
                <Button onClick={handleToastLoading} variant="outline">
                  Loading Toast
                </Button>
                <Button onClick={handleToastPromise} variant="outline">
                  Promise Toast
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Loading States Tab */}
        <TabsContent value="loading" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Loading States</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Metric Card Skeleton */}
              <div>
                <h3 className="text-sm font-medium mb-3">Metric Card Skeleton</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <MetricCardSkeleton />
                  <MetricCardSkeleton />
                  <MetricCardSkeleton />
                </div>
              </div>

              {/* Data Table Skeleton */}
              <div>
                <h3 className="text-sm font-medium mb-3">Data Table Skeleton</h3>
                <DataTableSkeleton rows={5} columns={4} />
              </div>

              {/* Loading Button */}
              <div>
                <h3 className="text-sm font-medium mb-3">Loading Button</h3>
                <LoadingButton
                  loading={buttonLoading}
                  loadingText="Processing..."
                  onClick={handleButtonClick}
                >
                  Click Me
                </LoadingButton>
              </div>

              {/* Loading Spinners */}
              <div>
                <h3 className="text-sm font-medium mb-3">Loading Spinners</h3>
                <div className="flex gap-8 items-center">
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Small</p>
                    <LoadingSpinner size="sm" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Default</p>
                    <LoadingSpinner size="default" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Large</p>
                    <LoadingSpinner size="lg" />
                  </div>
                </div>
              </div>

              {/* Loading Overlay */}
              <div>
                <h3 className="text-sm font-medium mb-3">Loading Overlay</h3>
                <Button onClick={() => setLoading(!loading)}>
                  Toggle Overlay
                </Button>
                {loading && (
                  <div className="relative h-48 mt-4">
                    <LoadingOverlay message="Loading data..." />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Empty States Tab */}
        <TabsContent value="empty" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Generic Empty State */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Generic Empty State</CardTitle>
              </CardHeader>
              <CardContent>
                <EmptyState
                  icon={Users}
                  title="No items found"
                  description="Get started by creating your first item."
                  action={{
                    label: 'Create Item',
                    onClick: () => toast.info('Create clicked'),
                  }}
                  compact
                />
              </CardContent>
            </Card>

            {/* Empty Users */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Empty Users</CardTitle>
              </CardHeader>
              <CardContent>
                <EmptyUsers onCreate={() => toast.info('Create user clicked')} />
              </CardContent>
            </Card>

            {/* Empty Communities */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Empty Communities</CardTitle>
              </CardHeader>
              <CardContent>
                <EmptyCommunities />
              </CardContent>
            </Card>

            {/* Empty Pending Approvals */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Empty Pending Approvals</CardTitle>
              </CardHeader>
              <CardContent>
                <EmptyPendingApprovals />
              </CardContent>
            </Card>

            {/* Empty Moderation Queue */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Empty Moderation Queue</CardTitle>
              </CardHeader>
              <CardContent>
                <EmptyModerationQueue />
              </CardContent>
            </Card>

            {/* Empty Transactions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Empty Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <EmptyTransactions />
              </CardContent>
            </Card>

            {/* Empty Payouts */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Empty Payouts</CardTitle>
              </CardHeader>
              <CardContent>
                <EmptyPayouts onCalculate={() => toast.info('Calculate clicked')} />
              </CardContent>
            </Card>

            {/* Empty Campaigns */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Empty Campaigns</CardTitle>
              </CardHeader>
              <CardContent>
                <EmptyCampaigns onCreate={() => toast.info('Create campaign clicked')} />
              </CardContent>
            </Card>

            {/* Empty Templates */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Empty Templates</CardTitle>
              </CardHeader>
              <CardContent>
                <EmptyTemplates onCreate={() => toast.info('Create template clicked')} />
              </CardContent>
            </Card>

            {/* Empty Audit Logs */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Empty Audit Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <EmptyAuditLogs />
              </CardContent>
            </Card>

            {/* Empty Security Events */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Empty Security Events</CardTitle>
              </CardHeader>
              <CardContent>
                <EmptySecurityEvents />
              </CardContent>
            </Card>

            {/* Empty Search Results */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Empty Search Results</CardTitle>
              </CardHeader>
              <CardContent>
                <EmptySearchResults
                  searchTerm="test query"
                  onClear={() => toast.info('Clear search clicked')}
                />
              </CardContent>
            </Card>

            {/* Empty Filtered Results */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Empty Filtered Results</CardTitle>
              </CardHeader>
              <CardContent>
                <EmptyFilteredResults
                  onClearFilters={() => toast.info('Clear filters clicked')}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
