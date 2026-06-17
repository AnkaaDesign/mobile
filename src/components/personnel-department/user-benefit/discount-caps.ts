// discount-caps.ts (mobile)
// Espelho de web/src/components/personnel-department/benefit/discount-caps.ts.
//
// A REGRA de cálculo da divisão empresa × colaborador vive em
// mobile/src/utils/benefit-discount.ts (espelho de api/web). Este arquivo guarda
// apenas os tetos legais e textos de ajuda da UI.

import { BENEFIT_KIND } from "@/constants";

/**
 * Tetos legais/negociais do percentual de desconto do colaborador por tipo:
 * - Vale Transporte: máx. 6% do salário-base (Lei 7.418/85 / CLT)
 * - Vale Refeição / Vale Alimentação: máx. 20% do custo (PAT)
 * - Demais: máx. 100%
 */
export function getKindDiscountCap(kind?: string | null): number {
  if (kind === BENEFIT_KIND.TRANSPORT_VOUCHER) return 6;
  if (kind === BENEFIT_KIND.MEAL_VOUCHER || kind === BENEFIT_KIND.FOOD_VOUCHER) return 20;
  return 100;
}

export function getKindDiscountHelper(kind?: string | null): string {
  if (kind === BENEFIT_KIND.TRANSPORT_VOUCHER) return "Desconto limitado a 6% do salário-base do colaborador (CLT), nunca excedendo o custo do VT";
  if (kind === BENEFIT_KIND.MEAL_VOUCHER || kind === BENEFIT_KIND.FOOD_VOUCHER) return "Desconto limitado a 20% do custo do benefício (PAT)";
  return "Máx. 100% do custo";
}
