import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Alert } from "react-native";
import { COMPANY_INFO, BRAND_COLORS } from "@/config/company";
import { formatCurrency, formatDate } from "@/utils";

/**
 * Branded order PDF generator for mobile — a faithful port of the web generator
 * (web/src/utils/order-pdf-generator.ts) so the document looks identical across
 * platforms. The only difference is the header: mobile renders the company name as
 * styled text (the static /logo.png the web build serves isn't reachable from the
 * on-device print HTML), mirroring how the mobile dossiê PDF is branded.
 *
 * The HTML is rendered to a file with expo-print and then handed to the OS share
 * sheet via expo-sharing — that's how "Enviar no WhatsApp" works: the user picks
 * WhatsApp in the sheet, selects the contact, and sends the attached PDF.
 */

export interface OrderPdfLineItem {
  code: string;
  name: string;
  brand?: string;
  measures?: string;
  quantity: number;
  /** Unit price. When every item has price 0/undefined the price columns are hidden. */
  unitPrice?: number;
  /** ICMS percentage (e.g. 18 for 18%). */
  icms?: number;
  /** IPI percentage. */
  ipi?: number;
}

export interface OrderPdfData {
  /**
   * Document title. Pass the order code built by `buildOrderCode()` here
   * (e.g. "Pedido 0001-01.1 - Bases"). Defaults to "Pedido de Compra".
   */
  title?: string;
  /** Secondary label under the title (e.g. "Pedido de Compra" / "Solicitação de Orçamento"). */
  documentType?: string;
  /** Order description / subtitle. */
  description?: string;
  supplierName?: string;
  orderDate?: Date | string | null;
  forecastDate?: Date | string | null;
  items: OrderPdfLineItem[];
  freight?: number;
  discount?: number;
  /** Manual grand-total override (Valor Total). null/absent = use the computed total. */
  totalOverride?: number | null;
  notes?: string | null;
  /** When false, prices/taxes/totals are hidden (the supplier "budget request" version). */
  includePricing?: boolean;
}

/** Escape user-provided text before injecting into the print HTML. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function toDate(value?: Date | string | null): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

/** Format a Brazilian phone like "43 9 8428-3228" → "(43) 9 8428-3228". */
function formatPhoneWithDDD(phone: string): string {
  if (!phone) return "";
  if (phone.startsWith("(")) return phone;
  const m = phone.match(/^(\d{2})\s+(.+)$/);
  return m ? `(${m[1]}) ${m[2]}` : phone;
}

/** Build the branded HTML document for an order and return it as a string. */
export function buildOrderPdfHtml(data: OrderPdfData): string {
  const title = data.title || "Pedido de Compra";
  const items = data.items || [];

  const rows = items.map((item) => {
    const quantity = Number(item.quantity) || 0;
    const unitPrice = Number(item.unitPrice) || 0;
    const icms = Number(item.icms) || 0;
    const ipi = Number(item.ipi) || 0;
    const subtotal = quantity * unitPrice;
    const taxAmount = subtotal * (icms / 100) + subtotal * (ipi / 100);
    return { ...item, quantity, unitPrice, icms, ipi, subtotal, taxAmount, total: subtotal + taxAmount };
  });

  const goodsSubtotal = rows.reduce((sum, r) => sum + r.subtotal, 0);
  const taxTotal = rows.reduce((sum, r) => sum + r.taxAmount, 0);
  const includePricing = data.includePricing !== false;
  const hasPricing = includePricing && rows.some((r) => r.unitPrice > 0);

  const discountPercent = Number(data.discount) || 0;
  const discountAmount = discountPercent > 0 ? goodsSubtotal * (discountPercent / 100) : 0;
  const freight = Number(data.freight) || 0;
  const computedGrandTotal = goodsSubtotal + taxTotal - discountAmount + freight;
  // A manual override (Valor Total) wins over the computed grand total.
  const grandTotal =
    data.totalOverride != null ? Math.max(0, Math.round(data.totalOverride * 100) / 100) : computedGrandTotal;

  const orderDate = toDate(data.orderDate);
  const forecastDate = toDate(data.forecastDate);
  const now = new Date();

  const metaParts: string[] = [];
  if (orderDate) metaParts.push(`<strong>Data do Pedido:</strong> ${formatDate(orderDate)}`);
  // The delivery forecast ("Entrega") only belongs on an actual purchase order.
  // A budget/quote request (includePricing=false) has no committed delivery date
  // yet — matches the web generator (order-pdf-generator.ts).
  if (forecastDate && includePricing) metaParts.push(`<strong>Entrega:</strong> ${formatDate(forecastDate)}`);
  metaParts.push(`<strong>Fornecedor:</strong> ${escapeHtml(data.supplierName || "-")}`);

  const itemRowsHtml = rows
    .map(
      (r, index) => `
      <tr class="${index % 2 === 1 ? "row-alt" : ""}">
        <td class="mono">${escapeHtml(r.code || "-")}</td>
        <td class="strong">${escapeHtml(r.name || "-")}</td>
        <td>${escapeHtml(r.brand || "-")}</td>
        <td>${escapeHtml(r.measures || "-")}</td>
        <td class="center">${r.quantity.toLocaleString("pt-BR")}</td>
        ${hasPricing ? `<td class="right">${formatCurrency(r.unitPrice)}</td>` : ""}
        ${hasPricing ? `<td class="right">${r.taxAmount > 0 ? formatCurrency(r.taxAmount) : "-"}</td>` : ""}
        ${hasPricing ? `<td class="right strong">${formatCurrency(r.total)}</td>` : ""}
      </tr>`,
    )
    .join("");

  const totalsRows: string[] = [];
  if (hasPricing) {
    totalsRows.push(`
      <div class="total-row">
        <span class="total-label">Subtotal</span>
        <span class="total-value">${formatCurrency(goodsSubtotal)}</span>
      </div>`);
    if (taxTotal > 0) {
      totalsRows.push(`
      <div class="total-row">
        <span class="total-label">Impostos (ICMS/IPI)</span>
        <span class="total-value">${formatCurrency(taxTotal)}</span>
      </div>`);
    }
    if (discountAmount > 0) {
      totalsRows.push(`
      <div class="total-row">
        <span class="total-label">Desconto (${discountPercent}%)</span>
        <span class="total-value discount-value">- ${formatCurrency(discountAmount)}</span>
      </div>`);
    }
    if (freight > 0) {
      totalsRows.push(`
      <div class="total-row">
        <span class="total-label">Frete</span>
        <span class="total-value">${formatCurrency(freight)}</span>
      </div>`);
    }
    totalsRows.push(`
      <div class="total-row final-total-row">
        <span class="total-label">Total</span>
        <span class="total-value total-final">${formatCurrency(grandTotal)}</span>
      </div>`);
  }

  const totalsHtml = totalsRows.length
    ? `<div class="totals-section">${totalsRows.join("")}</div>`
    : "";

  const notesHtml = data.notes
    ? `
      <div class="notes-section">
        <div class="notes-title">Observações</div>
        <div class="notes-body">${escapeHtml(data.notes)}</div>
      </div>`
    : "";

  const subtitle = [data.documentType, data.description].filter(Boolean).join(" — ");

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <style>
    @page { size: A4; margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }

    html, body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 11px;
      line-height: 1.4;
      color: ${BRAND_COLORS.textDark};
      background: #fff;
    }

    .sheet { padding: 14mm 14mm 12mm 14mm; min-height: 297mm; display: flex; flex-direction: column; }
    .content { flex: 1 0 auto; }

    .header { display: flex; align-items: flex-start; padding-bottom: 8px; }
    .brand-name { font-size: 22px; font-weight: bold; color: ${BRAND_COLORS.primaryGreen}; letter-spacing: 0.01em; }

    .header-line {
      height: 2px;
      background: linear-gradient(to right, #888 0%, ${BRAND_COLORS.primaryGreen} 35%);
      margin: 4px 0 12px 0;
    }

    .doc-title { font-size: 16px; font-weight: bold; color: ${BRAND_COLORS.primaryGreen}; margin-bottom: 2px; }
    .doc-subtitle { font-size: 12px; color: ${BRAND_COLORS.textDark}; margin-bottom: 6px; }
    .doc-meta { font-size: 10px; color: ${BRAND_COLORS.textGray}; margin-bottom: 12px; }
    .doc-meta strong { color: ${BRAND_COLORS.textDark}; }

    table { width: 100%; border-collapse: collapse; font-size: 10.5px; }
    thead th {
      background: ${BRAND_COLORS.primaryGreen};
      color: #fff;
      font-weight: 600;
      text-align: left;
      padding: 7px 6px;
      text-transform: uppercase;
      font-size: 9px;
      letter-spacing: 0.03em;
    }
    tbody td { padding: 6px; border-bottom: 1px solid #eee; vertical-align: top; }
    tbody tr.row-alt { background: #f6f8f6; }
    .mono { font-family: 'SFMono-Regular', Consolas, monospace; font-size: 10px; }
    .strong { font-weight: 600; }
    .center { text-align: center; }
    .right { text-align: right; white-space: nowrap; }

    .totals-section { margin-top: 10px; margin-left: auto; width: 62mm; }
    .total-row { display: flex; justify-content: space-between; align-items: baseline; padding: 2px 0; font-size: 11px; }
    .total-label { color: ${BRAND_COLORS.textDark}; }
    .total-value { font-weight: normal; white-space: nowrap; text-align: right; }
    .discount-value { color: #c00; }
    .final-total-row { margin-top: 3px; padding-top: 4px; border-top: 1px solid #ddd; }
    .final-total-row .total-label { font-weight: bold; }
    .total-final { font-weight: bold; font-size: 13px; color: ${BRAND_COLORS.primaryGreen}; }

    .notes-section {
      margin-top: 16px;
      padding: 10px 12px;
      background: #f6f8f6;
      border-left: 3px solid ${BRAND_COLORS.primaryGreen};
      border-radius: 4px;
    }
    .notes-title { font-weight: bold; color: ${BRAND_COLORS.primaryGreen}; margin-bottom: 3px; font-size: 11px; }
    .notes-body { white-space: pre-wrap; font-size: 10.5px; color: ${BRAND_COLORS.textDark}; }

    .footer {
      margin-top: 22px;
      padding-top: 10px;
      border-top: 2px solid ${BRAND_COLORS.primaryGreen};
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .footer-contact { font-size: 9px; line-height: 1.7; }
    .footer-name { font-weight: bold; color: ${BRAND_COLORS.primaryGreen}; font-size: 11px; }
    .footer-address { color: ${BRAND_COLORS.textGray}; }
    .footer-phone, .footer-site { color: ${BRAND_COLORS.primaryGreen}; }
    .footer-generated { font-size: 8px; color: ${BRAND_COLORS.textGray}; text-align: right; }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="header">
      <div class="brand-name">${escapeHtml(COMPANY_INFO.name)}</div>
    </div>
    <div class="header-line"></div>

    <div class="content">
    <div class="doc-title">${escapeHtml(title)}</div>
    ${subtitle ? `<div class="doc-subtitle">${escapeHtml(subtitle)}</div>` : ""}
    <div class="doc-meta">${metaParts.join(" &nbsp;|&nbsp; ")}</div>

    <table>
      <thead>
        <tr>
          <th>Código</th>
          <th>Nome</th>
          <th>Marca</th>
          <th>Medidas</th>
          <th class="center">Qtd.</th>
          ${hasPricing ? `<th class="right">Preço Unit.</th>` : ""}
          ${hasPricing ? `<th class="right">Impostos</th>` : ""}
          ${hasPricing ? `<th class="right">Total</th>` : ""}
        </tr>
      </thead>
      <tbody>
        ${itemRowsHtml || `<tr><td colspan="8" class="center" style="padding:16px;color:#999;">Nenhum item</td></tr>`}
      </tbody>
    </table>

    ${totalsHtml}
    ${notesHtml}
    </div>

    <div class="footer">
      <div class="footer-contact">
        <div class="footer-name">${escapeHtml(COMPANY_INFO.name)}</div>
        <div class="footer-address">${escapeHtml(COMPANY_INFO.address)}</div>
        <div class="footer-phone">${escapeHtml(formatPhoneWithDDD(COMPANY_INFO.phone))}</div>
        <div class="footer-site">${escapeHtml(COMPANY_INFO.websiteUrl || COMPANY_INFO.website)}</div>
      </div>
      <div class="footer-generated">Gerado em ${formatDate(now)} ${now.toLocaleTimeString("pt-BR")}</div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Render the order to a PDF file and open the OS share sheet. Picking WhatsApp in
 * the sheet (then a contact) attaches and sends the PDF — that is the "Enviar no
 * WhatsApp" flow. `dialogTitle` lets callers label the sheet accordingly.
 */
export async function exportOrderPdf(
  data: OrderPdfData,
  options?: { dialogTitle?: string },
): Promise<void> {
  try {
    const html = buildOrderPdfHtml(data);
    const { uri } = await Print.printToFileAsync({ html });
    if (!uri) throw new Error("Falha ao gerar PDF");

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: options?.dialogTitle ?? "Exportar PDF",
        UTI: "com.adobe.pdf",
      });
    } else {
      Alert.alert("Sucesso", "PDF gerado com sucesso");
    }
  } catch (error: any) {
    Alert.alert("Erro", "Não foi possível gerar o PDF: " + (error?.message ?? ""));
  }
}
