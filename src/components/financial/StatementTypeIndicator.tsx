/**
 * Statement Type Badge Component
 * Shows a neutral tag for financial statement types
 */

import type { StatementType } from '@/types/finance';
import { STATEMENT_TYPE_INFO } from '@/types/finance';
import { FileSpreadsheet } from '@/components/icons';

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
    <span
      className="inline-flex items-center gap-1.5 rounded-pill bg-surface-2 px-2.5 py-0.5 text-xs font-semibold text-text-secondary"
      title={info.description}
    >
      {showIcon && <FileSpreadsheet size={14} />}
      <span>{info.label}</span>
      {showDescription && <span className="font-normal">({info.description})</span>}
    </span>
  );
}
