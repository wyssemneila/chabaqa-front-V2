"use client"

/**
 * Demo page for admin dashboard components
 * This file demonstrates the usage of all shared admin UI components
 * Remove this file in production
 */

import * as React from "react"
import { Users, Building2, FileText, Coins } from "lucide-react"
import { MetricCard } from "./metric-card"
import { StatusBadge } from "./status-badge"
import { ConfirmDialog } from "./confirm-dialog"
import { ExportDialog } from "./export-dialog"
import { Button } from "@/components/ui/button"

export function ComponentDemo() {
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [exportOpen, setExportOpen] = React.useState(false)

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Admin Components Demo</h1>
        <p className="text-muted-foreground">
          Demonstration of shared admin dashboard components
        </p>
      </div>

      {/* MetricCard Demo */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">MetricCard</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Users"
            value={12543}
            change={{ value: "+12%", trend: "up" }}
            icon={Users}
            color="primary"
          />
          <MetricCard
            title="Active Communities"
            value={342}
            change={{ value: "+8%", trend: "up" }}
            icon={Building2}
            color="success"
          />
          <MetricCard
            title="Pending Content"
            value={28}
            change={{ value: "-5%", trend: "down" }}
            icon={FileText}
            color="warning"
          />
          <MetricCard
            title="Total Revenue"
            value="45,231 TND"
            change={{ value: "+23%", trend: "up" }}
            icon={Coins}
            color="info"
          />
        </div>
      </section>

      {/* StatusBadge Demo */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">StatusBadge</h2>
        <div className="flex flex-wrap gap-3">
          <StatusBadge status="active" />
          <StatusBadge status="pending" />
          <StatusBadge status="suspended" />
          <StatusBadge status="approved" />
          <StatusBadge status="rejected" />
          <StatusBadge status="processing" />
          <StatusBadge status="completed" />
          <StatusBadge status="draft" />
        </div>
        <div className="flex flex-wrap gap-3">
          <StatusBadge status="Small" size="sm" />
          <StatusBadge status="Medium" size="md" />
          <StatusBadge status="Large" size="lg" />
        </div>
      </section>

      {/* Dialog Demos */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Dialogs</h2>
        <div className="flex gap-4">
          <Button onClick={() => setConfirmOpen(true)}>
            Open Confirm Dialog
          </Button>
          <Button onClick={() => setExportOpen(true)}>
            Open Export Dialog
          </Button>
        </div>
      </section>

      {/* ConfirmDialog */}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete User"
        description="Are you sure you want to delete this user? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        requiresInput={true}
        inputPlaceholder="Type DELETE to confirm"
        inputMatchText="DELETE"
        onConfirm={async () => {
          // Simulate async operation
          await new Promise(resolve => setTimeout(resolve, 1000))
          console.log('User deleted')
        }}
      />

      {/* ExportDialog */}
      <ExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        title="Export Data"
        description="Choose your export format and date range"
        availableFormats={['csv', 'json', 'pdf']}
        dateRangeRequired={true}
        onExport={async (format, options) => {
          // Simulate async export
          await new Promise(resolve => setTimeout(resolve, 1500))
          console.log('Exported:', format, options)
        }}
      />
    </div>
  )
}
