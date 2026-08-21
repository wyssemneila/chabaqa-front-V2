"use client"

import React, { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function PayoutRequestForm({
  minAmount,
  maxAmount,
  loading,
  onSubmit,
}: {
  minAmount: number
  maxAmount: number
  loading?: boolean
  onSubmit: (payload: { amountDT: number; method: 'bank_transfer' | 'paypal' | 'stripe'; metadata: Record<string, any> }) => Promise<void>
}) {
  const [amount, setAmount] = useState("")
  const [method, setMethod] = useState<'bank_transfer' | 'paypal' | 'stripe'>('bank_transfer')
  const [details, setDetails] = useState("")

  const amountValue = Number(amount)
  const error = useMemo(() => {
    if (!amount) return ""
    if (!Number.isFinite(amountValue) || amountValue <= 0) return "Enter a valid amount"
    if (amountValue < minAmount) return `Minimum payout is ${minAmount} DT`
    if (amountValue > maxAmount) return `Amount cannot exceed approved balance (${maxAmount.toFixed(2)} DT)`
    return ""
  }, [amount, amountValue, maxAmount, minAmount])

  const disabled = loading || !!error || !amount

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Request payout</CardTitle>
        <CardDescription>Hold period must finish before commissions become available for payout.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-4">
        <div className="space-y-2 md:col-span-1">
          <Label htmlFor="payout-amount">Amount (DT)</Label>
          <Input
            id="payout-amount"
            type="number"
            min={0}
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder={`min ${minAmount}`}
          />
          {error ? <p className="text-xs text-rose-600">{error}</p> : null}
        </div>

        <div className="space-y-2 md:col-span-1">
          <Label>Method</Label>
          <Select value={method} onValueChange={(value) => setMethod(value as any)}>
            <SelectTrigger aria-label="Payout method">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bank_transfer">Bank transfer</SelectItem>
              <SelectItem value="paypal">PayPal</SelectItem>
              <SelectItem value="stripe">Stripe</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 md:col-span-1">
          <Label htmlFor="payout-details">Details</Label>
          <Input
            id="payout-details"
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            placeholder="IBAN, PayPal email, or Stripe account"
          />
        </div>

        <div className="flex items-end md:col-span-1">
          <Button
            className="w-full"
            disabled={disabled}
            onClick={() => onSubmit({ amountDT: Number(amount), method, metadata: { details } })}
          >
            {loading ? "Submitting..." : "Submit request"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
