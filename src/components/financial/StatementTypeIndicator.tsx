/**
 * Statement Type Badge Component
 * Shows a colored badge for financial statement types
 */

import type { StatementType } from '@/types/finance';
import { STATEMENT_TYPE_INFO } from '@/types/finance';

interface StatementTypeIndicatorProps {
  type: StatementType;
  showIcon?: boolean;
  showDescription?: boolean;
}

export function StatementTypeIndicator({
  type,
  showIcon = true,
  showDescription = false,
}: StatementTypeIndicatorProps) {
  const info = STATEMENT_TYPE_INFO[type];

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${info.color}`}
      title={info.description}
    >
      {showIcon && <span className="text-base">{info.icon}</span>}
      <span>{info.label}</span>
      {showDescription && <span className="text-xs opacity-75">({info.description})</span>}
    </div>
  );
}
