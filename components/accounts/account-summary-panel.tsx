'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { formatPKR } from '@/lib/utils/format';
import type { AccountSummary } from '@/types/database';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface AccountSummaryPanelProps {
  summary: AccountSummary;
}

export function AccountSummaryPanel({ summary }: AccountSummaryPanelProps) {
  return (
    <div className="space-y-6">
      {/* Investors Table */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-sm">
            Investors —{' '}
            {summary.account_type === 'COMBINED'
              ? 'Both Accounts'
              : `${summary.account_type} Account`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg overflow-hidden border border-border/50">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/30">
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Investor</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Account</th>
                  <th className="text-right px-4 py-2 font-medium text-muted-foreground">Contribution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {summary.investors.map((inv) => (
                  <tr key={inv.id} className="hover:bg-muted/20">
                    <td className="px-4 py-2.5 font-medium">{inv.name}</td>
                    <td className="px-4 py-2.5">
                      <Badge variant="secondary" className="text-xs">
                        {inv.account_type}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono">
                      {formatPKR(inv.contribution)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-muted/30 font-semibold">
                  <td className="px-4 py-2.5" colSpan={2}>Total Investment</td>
                  <td className="px-4 py-2.5 text-right font-mono text-primary">
                    {formatPKR(summary.total_investment)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Summary Breakdown */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-sm">Financial Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {summary.lines.map((line, index) => {
              const isTotal = ['C', 'I'].includes(line.key);
              const isNegative = line.value < 0;
              const isPositive = line.value > 0;

              return (
                <div key={line.key}>
                  {(line.key === 'C' || line.key === 'I' || line.key === 'K') && (
                    <Separator className="my-3" />
                  )}
                  <div
                    className={cn(
                      'flex items-center justify-between py-2.5 px-3 rounded-lg',
                      isTotal && 'bg-muted/50 font-semibold'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          'flex h-6 w-6 items-center justify-center rounded text-xs font-bold shrink-0',
                          isTotal
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {line.key}
                      </span>
                      <div>
                        <p className="text-sm">{line.label}</p>
                        {line.formula && (
                          <p className="text-xs text-muted-foreground">{line.formula}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isNegative ? (
                        <TrendingDown className="h-3 w-3 text-red-500" />
                      ) : isPositive && isTotal ? (
                        <TrendingUp className="h-3 w-3 text-green-500" />
                      ) : null}
                      <span
                        className={cn(
                          'font-mono text-sm font-medium',
                          line.key === 'I' && line.value > 0 && 'text-green-500',
                          line.key === 'I' && line.value < 0 && 'text-red-500',
                          line.key === 'K' && 'text-amber-500'
                        )}
                      >
                        {formatPKR(line.value)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
