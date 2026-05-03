// Mapping for the operational order tracking system.
// Internal status values are stored in the database; labels differ for staff vs patients.

export type PedidoStatus =
  | 'aguardando_pedido'
  | 'pedido_realizado'
  | 'em_separacao'
  | 'enviado'
  | 'em_transito'
  | 'entregue'
  | 'problema';

export const PEDIDO_STATUS_VALUES: PedidoStatus[] = [
  'aguardando_pedido',
  'pedido_realizado',
  'em_separacao',
  'enviado',
  'em_transito',
  'entregue',
  'problema',
];

// Internal staff labels + badge color tokens
export const STAFF_STATUS_META: Record<PedidoStatus, { label: string; badgeClass: string }> = {
  aguardando_pedido: { label: 'Aguardando pedido', badgeClass: 'bg-muted text-muted-foreground border-border' },
  pedido_realizado:  { label: 'Pedido realizado', badgeClass: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-200' },
  em_separacao:      { label: 'Em separação', badgeClass: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-200' },
  enviado:           { label: 'Enviado', badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-200' },
  em_transito:       { label: 'A caminho', badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-200' },
  entregue:          { label: 'Entregue', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200' },
  problema:          { label: 'Atenção', badgeClass: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-200' },
};

// Patient-friendly labels
export const PATIENT_STATUS_LABEL: Record<PedidoStatus, string> = {
  aguardando_pedido: 'Pedido em preparação',
  pedido_realizado:  'Pedido enviado à farmácia',
  em_separacao:      'Em separação na farmácia',
  enviado:           'Enviado',
  em_transito:       'A caminho',
  entregue:          'Entregue',
  problema:          'Atenção — entraremos em contato',
};

// 5-step patient progress bar
export const PATIENT_STAGES: { key: string; label: string; matches: PedidoStatus[] }[] = [
  { key: 'preparacao',     label: 'Preparação',         matches: ['aguardando_pedido'] },
  { key: 'farmacia',       label: 'Enviado à farmácia', matches: ['pedido_realizado'] },
  { key: 'separacao',      label: 'Em separação',       matches: ['em_separacao'] },
  { key: 'caminho',        label: 'A caminho',          matches: ['enviado', 'em_transito'] },
  { key: 'entregue',       label: 'Entregue',           matches: ['entregue'] },
];

export function getPatientStageIndex(status: PedidoStatus): number {
  return PATIENT_STAGES.findIndex((s) => s.matches.includes(status));
}
