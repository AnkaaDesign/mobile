// config/list/hr/thirteenths.ts
// 13º salário (gratificação natalina) — Part D — Admin/HR list config.
//
// NOTE: the thirteenth foundation exposes the plain `useThirteenths` query hook
// (no `*InfiniteMobile` hook), so the config-driven `Layout` (which resolves an
// infinite hook by name from `@/hooks`) is NOT used here.
//
// The standalone 13º MANAGEMENT list screen was removed (owner decision: the 13º
// is an "engine, not a page" — the api generator + the per-employee detail
// (`/recursos-humanos/decimo-terceiro/[id]`) and the self-service "Meu 13º"
// (`/pessoal/meu-decimo-terceiro`) remain). This config is still consumed by the
// detail screen (`getNumericValue`) and kept as the canonical column/badge spec.

import { THIRTEENTH_STATUS, THIRTEENTH_STATUS_LABELS } from '@/constants'
import type { BadgeProps } from '@/components/ui/badge'
import type { Thirteenth } from '@/types'
import { formatCurrency } from '@/utils'

// Status → badge variant. badge-colors has no THIRTEENTH entity entry, so map locally.
export const thirteenthStatusBadgeVariant: Record<THIRTEENTH_STATUS, BadgeProps['variant']> = {
  [THIRTEENTH_STATUS.OPEN]: 'pending',
  [THIRTEENTH_STATUS.FIRST_PAID]: 'partial',
  [THIRTEENTH_STATUS.SECOND_PAID]: 'processing',
  [THIRTEENTH_STATUS.PAID]: 'completed',
  [THIRTEENTH_STATUS.CANCELLED]: 'cancelled',
}

export const getThirteenthStatusLabel = (status: THIRTEENTH_STATUS | string): string =>
  THIRTEENTH_STATUS_LABELS[status as THIRTEENTH_STATUS] ?? String(status)

// Decimal | string | number → number
export const getNumericValue = (value: any): number => {
  if (value === null || value === undefined) return 0
  if (typeof value === 'number') return value
  if (typeof value === 'string') return parseFloat(value) || 0
  if (value?.toNumber) return value.toNumber()
  return 0
}

export interface ThirteenthColumn {
  key: string
  label: string
  align?: 'left' | 'right' | 'center'
  width?: number
  render: (t: Thirteenth) => string
}

// Canonical column spec (avos, base, 1ª/2ª parcela, status).
export const thirteenthColumns: ThirteenthColumn[] = [
  {
    key: 'user.name',
    label: 'Colaborador',
    align: 'left',
    width: 2,
    render: (t) => t.user?.name || '—',
  },
  {
    key: 'year',
    label: 'Ano',
    align: 'center',
    width: 0.8,
    render: (t) => String(t.year),
  },
  {
    key: 'avos',
    label: 'Avos',
    align: 'center',
    width: 0.7,
    render: (t) => `${t.avos}/12`,
  },
  {
    key: 'baseRemuneration',
    label: 'Base média',
    align: 'right',
    width: 1.3,
    render: (t) => (t.baseRemuneration != null ? formatCurrency(getNumericValue(t.baseRemuneration)) : '—'),
  },
  {
    key: 'firstInstallment',
    label: '1ª parcela',
    align: 'right',
    width: 1.3,
    render: (t) => (t.firstInstallment != null ? formatCurrency(getNumericValue(t.firstInstallment)) : '—'),
  },
  {
    key: 'secondInstallment',
    label: '2ª parcela',
    align: 'right',
    width: 1.3,
    render: (t) => (t.secondInstallment != null ? formatCurrency(getNumericValue(t.secondInstallment)) : '—'),
  },
  {
    key: 'status',
    label: 'Status',
    align: 'center',
    width: 1.2,
    render: (t) => getThirteenthStatusLabel(t.status),
  },
]

// Year filter options (current year .. current-5).
export const thirteenthYearOptions = (() => {
  const current = new Date().getFullYear()
  const years: { label: string; value: string }[] = []
  for (let y = current; y >= current - 5; y--) years.push({ label: String(y), value: String(y) })
  return years
})()

export const thirteenthStatusOptions = Object.values(THIRTEENTH_STATUS).map((s) => ({
  label: getThirteenthStatusLabel(s),
  value: s,
}))
