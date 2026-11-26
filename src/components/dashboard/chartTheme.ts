/**
 * Shared Recharts styling (design system section 9). Series order is fixed, max four series.
 * Colours are CSS variables, so charts follow the paper and ink themes.
 */
import { createElement, type ReactNode } from 'react'

export const CHART_SERIES = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)'] as const

export const seriesColor = (index: number) => CHART_SERIES[index % CHART_SERIES.length]

export const axisProps = {
  tick: { fontSize: 12, fill: 'var(--chart-axis)' },
  axisLine: false,
  tickLine: false,
} as const

/** Dashed, horizontal only. */
export const gridProps = {
  strokeDasharray: '3 3',
  stroke: 'var(--chart-grid)',
  vertical: false,
} as const

export const tooltipProps = {
  contentStyle: {
    background: 'var(--surface-1)',
    border: '1px solid var(--line)',
    borderRadius: 12,
    boxShadow: 'var(--shadow-raised)',
    fontSize: 12,
  },
  labelStyle: { color: 'var(--text-secondary)' },
  itemStyle: { color: 'var(--text-primary)', fontFamily: '"JetBrains Mono", ui-monospace, monospace' },
}

/** Legend with words, in text colour so the label never relies on the series colour. */
export const legendProps = {
  iconType: 'circle' as const,
  iconSize: 8,
  wrapperStyle: { fontSize: 12 },
  formatter: (value: ReactNode) => createElement('span', { style: { color: 'var(--text-secondary)' } }, value),
}

export const barCursor = { fill: 'var(--surface-2)' }
export const lineCursor = { stroke: 'var(--line-strong)', strokeDasharray: '3 3' }

export const BAR_RADIUS: [number, number, number, number] = [4, 4, 0, 0]
export const BAR_RADIUS_HORIZONTAL: [number, number, number, number] = [0, 4, 4, 0]
export const MAX_BAR_SIZE = 44

export const valueLabelStyle = { fontSize: 12, fill: 'var(--text-secondary)' }
