import React from 'react';
import { Button } from '@/components/ui/button';
import { Wallet, ArrowRight, AlertCircle } from 'lucide-react';

export interface BalanceCardProps {
  availableBalance: number;
  pendingBalance: number;
  currencySymbol?: string;
  onWithdraw?: () => void;
  isBankAccountLinked?: boolean;
}

export function BalanceCard({ availableBalance, pendingBalance, currencySymbol = '$', onWithdraw, isBankAccountLinked = true }: BalanceCardProps) {
  return (
    <div className="rounded-xl border bg-white overflow-hidden shadow-sm">
      <div className="p-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Wallet className="h-5 w-5 text-gray-500" />
            Available for Payout
          </h2>
        </div>
        <div className="flex items-baseline mt-4">
          <span className="text-4xl font-bold text-gray-900">{currencySymbol}{(availableBalance / 100).toFixed(2)}</span>
        </div>
        <div className="mt-2 text-sm text-gray-500">{currencySymbol}{(pendingBalance / 100).toFixed(2)} pending clearance</div>
        {!isBankAccountLinked && (
          <div className="mt-4 p-3 bg-amber-50 rounded-lg flex items-start gap-3 border border-amber-200">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-900">
              <p className="font-medium">Bank account required</p>
              <p className="mt-1">Add a payout method to receive your earnings.</p>
            </div>
          </div>
        )}
      </div>
      <div className="bg-gray-50 px-6 py-4 border-t flex justify-end">
        <Button onClick={onWithdraw} disabled={availableBalance <= 0 || !isBankAccountLinked} className="w-full sm:w-auto flex items-center gap-2">
          Request Payout<ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
