import React from 'react';
import { Lock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface PermissionGuardProps {
  hasPermission: boolean;
  requiredRole?: string;
  featureName: string;
  children: React.ReactNode;
  fallbackType?: 'hide' | 'disabled' | 'lock-screen' | 'inline-alert';
  explanationText?: string;
  onUpgradeClick?: () => void;
}

export function PermissionGuard({ hasPermission, requiredRole, featureName, children, fallbackType = 'hide', explanationText, onUpgradeClick }: PermissionGuardProps) {
  if (hasPermission) return <>{children}</>;

  const defaultExplanation = `You need ${requiredRole ? requiredRole + ' role' : 'higher permissions'} to access ${featureName}.`;
  const infoText = explanationText || defaultExplanation;

  switch (fallbackType) {
    case 'hide': return null;
    case 'disabled':
      return (
        <div className="relative group opacity-60 pointer-events-none">
          {children}
          <div className="absolute inset-0 z-10 hidden group-hover:flex items-center justify-center pointer-events-auto">
            <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg flex items-center gap-2">
              <Lock className="h-3 w-3" />{infoText}
            </div>
          </div>
        </div>
      );
    case 'inline-alert':
      return (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="ms-3">
              <h3 className="text-sm font-medium text-amber-800">Permission Required</h3>
              <p className="mt-1 text-sm text-amber-700">{infoText}</p>
            </div>
          </div>
        </div>
      );
    case 'lock-screen':
    default:
      return (
        <div className="min-h-[300px] flex flex-col items-center justify-center p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4"><Lock className="h-6 w-6 text-gray-400" /></div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{featureName} Restricted</h3>
          <p className="text-sm text-gray-500 max-w-sm mb-6">{infoText}</p>
          {onUpgradeClick && <Button onClick={onUpgradeClick} variant="outline">Request Access</Button>}
        </div>
      );
  }
}

export function RoleBadge({ role }: { role: string }) {
  const getRoleColor = (role: string) => {
    const roles: Record<string, string> = {
      'owner': 'bg-purple-100 text-purple-800 border-purple-200',
      'admin': 'bg-blue-100 text-blue-800 border-blue-200',
      'moderator': 'bg-green-100 text-green-800 border-green-200',
      'editor': 'bg-orange-100 text-orange-800 border-orange-200',
      'viewer': 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return roles[role.toLowerCase()] || roles['viewer'];
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border uppercase tracking-wider ${getRoleColor(role)}`}>{role}</span>;
}
