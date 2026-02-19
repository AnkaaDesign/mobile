import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { formatCurrency, formatDate } from "./index";
import { generatePaymentText, generateGuaranteeText } from "./pricing-text-generators";
import type { TaskPricing } from "../types/task-pricing";
import { COMPANY_INFO, DIRECTOR_INFO } from "../config/company";
import { API_BASE_URL, WEB_BASE_URL } from "../config/urls";

interface BudgetPdfOptions {
  pricing: TaskPricing;
  customerName?: string;
  contactName?: string;
  termDate?: Date | string | null;
  // Vehicle identification
  serialNumber?: string | null;
  plate?: string | null;
  chassisNumber?: string | null;
}

// Constants for PDF layout calculations - EXACTLY matching web version
const PDF_CONFIG = {
  // A4 dimensions in mm
  pageWidth: 210,
  pageHeight: 297,
  // Margins
  marginTop: 12,
  marginBottom: 15,
  marginLeft: 25,
  marginRight: 25,
  // Content area
  get contentWidth() { return this.pageWidth - this.marginLeft - this.marginRight; },
  get contentHeight() { return this.pageHeight - this.marginTop - this.marginBottom; },
  // Section heights (approximate, in mm)
  headerHeight: 25,
  headerLineHeight: 2,
  titleSectionHeight: 15,
  customerSectionHeight: 25,
  sectionTitleHeight: 8,
  serviceItemHeight: 5.5,
  termsSectionHeight: 18,
  footerHeight: 22,
  signatureSectionHeight: 35,
  // Spacing
  sectionSpacing: 5,
  // Colors (deep forest green to match reference PDF)
  primaryGreen: '#0a5c1e',
  textDark: '#1a1a1a',
  textGray: '#666666',
  // Company info (from centralized config)
  companyName: COMPANY_INFO.name,
  companyAddress: COMPANY_INFO.address,
  companyPhone: COMPANY_INFO.phone,
  companyPhoneClean: COMPANY_INFO.phoneClean,
  companyWebsite: COMPANY_INFO.website,
  companyWebsiteUrl: COMPANY_INFO.websiteUrl,
  // Director info (from centralized config)
  directorName: DIRECTOR_INFO.name,
  directorTitle: DIRECTOR_INFO.title,
};

/**
 * BULLETPROOF Adaptive Layout Calculator for Budget PDF
 *
 * This calculator ensures ALL content ALWAYS fits on page 1 of an A4 page.
 * It uses precise measurements and proportional compression when needed.
 *
 * Strategy:
 * 1. Calculate exact total height needed at default sizes
 * 2. If overflow, calculate how much compression is needed
 * 3. Distribute compression across all compressible elements proportionally
 * 4. Each element has a default and minimum value - compression reduces towards minimum
 */

interface LayoutElement {
  default: number;
  min: number;
  current: number;
}

interface AdaptiveLayoutConfig {
  // Page margins (mm)
  marginTop: number;
  marginBottom: number;
  marginSide: number;
  // Header
  logoHeight: number;
  headerMarginBottom: number;
  headerLineMargin: number;
  budgetNumberFontSize: number;
  // Title
  titleFontSize: number;
  titleMarginBottom: number;
  // Customer section
  customerMarginBottom: number;
  customerNameMarginBottom: number;
  introFontSize: number;
  introLineHeight: number;
  // Services
  servicesTitleFontSize: number;
  servicesTitleMargin: number;
  serviceItemPadding: number;
  serviceFontSize: number;
  // Totals
  totalsMarginTop: number;
  totalRowPadding: number;
  totalFontSize: number;
  // Terms sections
  termsMarginBottom: number;
  termsTitleFontSize: number;
  termsTitleMargin: number;
  termsContentFontSize: number;
  termsLineHeight: number;
  // Footer
  footerPaddingTop: number;
}

function calculateAdaptiveLayout(
  itemCount: number,
  hasDeliveryTerm: boolean,
  hasPaymentConditions: boolean,
  hasGuarantee: boolean,
  hasDiscount: boolean,
  hasInvoiceToCustomers: boolean = false
): AdaptiveLayoutConfig {
  // A4 page height = 297mm
  const PAGE_HEIGHT = 297;
  // IMPORTANT: Use larger safety buffer because browser text rendering varies
  // and text can wrap unexpectedly. This prevents overflow in edge cases.
  const SAFETY_BUFFER = 12; // mm safety margin - increased for reliability
  const AVAILABLE_HEIGHT = PAGE_HEIGHT - SAFETY_BUFFER;

  // Count terms sections (including invoice-to customers if present)
  const termsCount = (hasInvoiceToCustomers ? 1 : 0) + (hasDeliveryTerm ? 1 : 0) + (hasPaymentConditions ? 1 : 0) + (hasGuarantee ? 1 : 0);

  // Define all compressible elements with their DEFAULT and MINIMUM values
  // Heights are CONSERVATIVE estimates accounting for text wrapping
  // 1pt font ≈ 0.35mm, plus line-height multiplier and padding
  const elements: Record<string, LayoutElement> = {
    // Margins
    marginTop:           { default: 10, min: 4, current: 10 },
    marginBottom:        { default: 10, min: 4, current: 10 },
    marginSide:          { default: 22, min: 15, current: 22 },
    // Header section (logo + number + info)
    logoHeight:          { default: 14, min: 10, current: 14 },
    headerMarginBottom:  { default: 2, min: 1, current: 2 },
    headerLineMargin:    { default: 4, min: 2, current: 4 },
    // Title section
    titleHeight:         { default: 6, min: 5, current: 6 },
    titleMarginBottom:   { default: 3, min: 1, current: 3 },
    // Customer section - INCREASED to account for customer name + contact + intro text with serial/plate
    customerHeight:      { default: 28, min: 18, current: 28 },
    customerMarginBottom:{ default: 4, min: 1, current: 4 },
    // Services section
    servicesTitle:       { default: 5, min: 4, current: 5 },
    servicesTitleMargin: { default: 2, min: 1, current: 2 },
    // Service items - INCREASED to account for potential text wrapping
    serviceItemHeight:   { default: 5.5, min: 3.0, current: 5.5 },
    // Totals
    totalsMarginTop:     { default: 3, min: 1, current: 3 },
    totalsHeight:        { default: hasDiscount ? 16 : 10, min: hasDiscount ? 10 : 7, current: hasDiscount ? 16 : 10 },
    // Terms sections (per section) - INCREASED for guarantee text which can be 2-3 lines
    termsSectionHeight:  { default: 20, min: 12, current: 20 },
    // Footer
    footerHeight:        { default: 16, min: 12, current: 16 },
  };

  // Calculate total height at current values
  function calculateTotalHeight(): number {
    return (
      elements.marginTop.current +
      elements.marginBottom.current +
      elements.logoHeight.current +
      elements.headerMarginBottom.current +
      1 + // header line height
      elements.headerLineMargin.current +
      elements.titleHeight.current +
      elements.titleMarginBottom.current +
      elements.customerHeight.current +
      elements.customerMarginBottom.current +
      elements.servicesTitle.current +
      elements.servicesTitleMargin.current +
      (itemCount * elements.serviceItemHeight.current) +
      elements.totalsMarginTop.current +
      elements.totalsHeight.current +
      (termsCount * elements.termsSectionHeight.current) +
      elements.footerHeight.current
    );
  }

  // Calculate total "compressibility" (how much we CAN reduce in total)
  function calculateTotalCompressibility(): number {
    let total = 0;
    for (const key of Object.keys(elements)) {
      if (key === 'serviceItemHeight') {
        total += (elements[key].default - elements[key].min) * itemCount;
      } else if (key === 'termsSectionHeight') {
        total += (elements[key].default - elements[key].min) * termsCount;
      } else {
        total += elements[key].default - elements[key].min;
      }
    }
    return total;
  }

  // Calculate initial height
  let totalHeight = calculateTotalHeight();

  if (totalHeight <= AVAILABLE_HEIGHT) {
    // Content fits! Optionally expand service items if lots of extra space
    const extraSpace = AVAILABLE_HEIGHT - totalHeight;
    if (extraSpace > 20 && itemCount > 0) {
      // Only expand if we have significant extra space
      const extraPerItem = Math.min(extraSpace / itemCount * 0.3, 1.0);
      elements.serviceItemHeight.current = Math.min(6.5, elements.serviceItemHeight.default + extraPerItem);
    }
  } else {
    // Need to compress - calculate how much
    const overflow = totalHeight - AVAILABLE_HEIGHT;
    const totalCompressibility = calculateTotalCompressibility();

    if (overflow <= totalCompressibility) {
      // PHASE 1: Proportional compression with 20% extra aggressiveness
      // The extra aggressiveness ensures we don't barely fit and risk overflow
      const compressionRatio = Math.min(1, (overflow * 1.2) / totalCompressibility);

      for (const key of Object.keys(elements)) {
        const elem = elements[key];
        const compressibleAmount = elem.default - elem.min;
        const reduction = compressibleAmount * compressionRatio;
        elem.current = elem.default - reduction;
      }
    } else {
      // Even at minimum, might not fit - use all minimums
      for (const key of Object.keys(elements)) {
        elements[key].current = elements[key].min;
      }
    }
  }

  // PHASE 2: Recalculate and apply additional compression if needed
  totalHeight = calculateTotalHeight();

  // If still overflowing, aggressively compress service items first (they have most impact)
  if (totalHeight > AVAILABLE_HEIGHT && itemCount > 0) {
    const stillOverflow = totalHeight - AVAILABLE_HEIGHT;
    // Compress service items more aggressively - they're the most variable
    const additionalReduction = (stillOverflow / itemCount) * 1.5;
    elements.serviceItemHeight.current = Math.max(2.5, elements.serviceItemHeight.current - additionalReduction);

    // Recalculate
    totalHeight = calculateTotalHeight();
  }

  // PHASE 3: If STILL overflowing, compress everything to absolute minimum
  if (totalHeight > AVAILABLE_HEIGHT) {
    for (const key of Object.keys(elements)) {
      elements[key].current = elements[key].min;
    }
    // Extra compression on margins as last resort
    elements.marginTop.current = Math.max(3, elements.marginTop.min - 1);
    elements.marginBottom.current = Math.max(3, elements.marginBottom.min - 1);
    elements.headerLineMargin.current = Math.max(1, elements.headerLineMargin.min - 1);
    elements.customerMarginBottom.current = Math.max(0.5, elements.customerMarginBottom.min - 0.5);
  }

  // Calculate derived font sizes based on element heights
  const serviceItemHeight = elements.serviceItemHeight.current;
  const termsSectionHeight = elements.termsSectionHeight.current;
  const customerHeight = elements.customerHeight.current;

  // Map heights to font sizes (approximate: 1pt ≈ 0.35mm)
  // More aggressive compression for smaller heights
  const serviceFontSize = serviceItemHeight >= 5 ? 10 : serviceItemHeight >= 4 ? 9 : serviceItemHeight >= 3.5 ? 8 : 7;
  const termsTitleFontSize = termsSectionHeight >= 18 ? 11 : termsSectionHeight >= 15 ? 10 : 9;
  const termsContentFontSize = termsSectionHeight >= 18 ? 10 : termsSectionHeight >= 15 ? 9 : 8;
  const termsLineHeight = termsSectionHeight >= 18 ? 1.4 : termsSectionHeight >= 15 ? 1.3 : 1.15;
  const introFontSize = customerHeight >= 25 ? 10 : customerHeight >= 22 ? 9 : 8;
  const introLineHeight = customerHeight >= 25 ? 1.4 : customerHeight >= 22 ? 1.3 : 1.2;

  return {
    // Margins
    marginTop: elements.marginTop.current,
    marginBottom: elements.marginBottom.current,
    marginSide: elements.marginSide.current,
    // Header
    logoHeight: elements.logoHeight.current,
    headerMarginBottom: elements.headerMarginBottom.current,
    headerLineMargin: elements.headerLineMargin.current,
    budgetNumberFontSize: elements.logoHeight.current >= 12 ? 13 : 11,
    // Title
    titleFontSize: elements.titleHeight.current >= 6 ? 13 : 11,
    titleMarginBottom: elements.titleMarginBottom.current,
    // Customer
    customerMarginBottom: elements.customerMarginBottom.current,
    customerNameMarginBottom: Math.max(0.5, elements.customerMarginBottom.current / 2),
    introFontSize,
    introLineHeight,
    // Services
    servicesTitleFontSize: elements.servicesTitle.current >= 5 ? 11 : 10,
    servicesTitleMargin: elements.servicesTitleMargin.current,
    serviceItemPadding: Math.max(0.2, (serviceItemHeight - 2.5) / 2.5),
    serviceFontSize,
    // Totals
    totalsMarginTop: elements.totalsMarginTop.current,
    totalRowPadding: Math.max(0.2, elements.totalsHeight.current / (hasDiscount ? 7 : 5) - 1.5),
    totalFontSize: serviceFontSize,
    // Terms
    termsMarginBottom: Math.max(1.5, termsSectionHeight / 8),
    termsTitleFontSize,
    termsTitleMargin: Math.max(0.8, termsSectionHeight / 15),
    termsContentFontSize,
    termsLineHeight,
    // Footer
    footerPaddingTop: Math.max(1.5, elements.footerHeight.current / 8),
  };
}

// Portuguese words that should remain lowercase in title case
const PORTUGUESE_LOWERCASE_WORDS = new Set([
  'a', 'à', 'as', 'às', 'ao', 'aos',
  'o', 'os',
  'de', 'da', 'das', 'do', 'dos',
  'e', 'em', 'na', 'nas', 'no', 'nos',
  'para', 'por', 'pela', 'pelas', 'pelo', 'pelos',
  'com', 'sem',
  'que', 'se',
  'um', 'uma', 'uns', 'umas',
]);

/**
 * Convert string to title case (matching web implementation)
 */
function toTitleCase(str: string): string {
  if (!str) return "";
  return str
    .split(" ")
    .map((word, index) => {
      if (word.length === 0) return word;

      const lowerWord = word.toLowerCase();

      // Keep Portuguese prepositions/articles lowercase (except first word)
      if (index > 0 && PORTUGUESE_LOWERCASE_WORDS.has(lowerWord)) {
        return lowerWord;
      }

      // Words with 2-3 characters become entirely uppercase (likely acronyms/abbreviations)
      if (word.length >= 2 && word.length <= 3) {
        // Check if it's already all caps or a known word
        if (word === word.toUpperCase()) {
          return word;
        }
      }

      // Capitalize first letter, lowercase the rest
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

/**
 * Format corporate name - add brackets if not already present
 */
function formatCorporateName(name: string): string {
  if (name.startsWith('[') && name.endsWith(']')) {
    return name;
  }
  return name;
}

/**
 * Escapes HTML special characters (mobile-safe version without DOM)
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Formats guarantee text with bold years
 * Looks for patterns like "X anos" and wraps them in <strong>
 */
function formatGuaranteeHtml(text: string): string {
  const escaped = escapeHtml(text);
  return escaped.replace(/(\d+)\s*(anos?)/gi, '<strong>$1 $2</strong>');
}

/**
 * Generates and exports a budget PDF for mobile
 * Uses expo-print to generate the PDF and expo-sharing to share it
 * EXACTLY matching the web version output
 */
export async function exportBudgetPdf({ pricing, customerName, contactName, termDate, serialNumber, plate, chassisNumber }: BudgetPdfOptions): Promise<void> {
  if (!pricing || !pricing.items || pricing.items.length === 0) {
    throw new Error("Nenhum item de precificação encontrado");
  }

  // Get dates
  const currentDate = formatDate(new Date());
  const formattedTermDate = termDate ? formatDate(new Date(termDate)) : "";

  // Calculate validity in days (budget expiration, NOT delivery time)
  const validityDays = pricing.expiresAt
    ? (() => {
        const today = new Date();
        const expires = new Date(pricing.expiresAt);
        today.setHours(0, 0, 0, 0);
        expires.setHours(0, 0, 0, 0);
        return Math.round((expires.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      })()
    : 30;

  // Custom delivery days (production time) - used when no term date is set
  const customDeliveryDays = pricing.customForecastDays || null;

  // Format budget number with leading zeros (e.g., "0042")
  const budgetNumber = pricing.budgetNumber
    ? String(pricing.budgetNumber).padStart(4, '0')
    : "0000";

  // Generate payment and guarantee text
  const paymentText = generatePaymentText(pricing);
  const guaranteeText = generateGuaranteeText(pricing);

  // Get layout and signature URLs from centralized config
  const apiBaseUrl = API_BASE_URL;
  // Use WEB_BASE_URL for static files (logo, signature)
  const webBaseUrl = WEB_BASE_URL;

  const layoutImageUrl = pricing.layoutFile?.id
    ? `${apiBaseUrl}/files/serve/${pricing.layoutFile.id}`
    : null;

  const signatureImageUrl = pricing.customerSignature?.id
    ? `${apiBaseUrl}/files/serve/${pricing.customerSignature.id}`
    : null;

  // Logo and director signature URLs from web public folder
  const logoUrl = `${webBaseUrl}/logo.png`;
  const directorSignatureUrl = `${webBaseUrl}/sergio-signature.webp`;

  const htmlContent = generateBudgetHtml({
    corporateName: customerName || "Cliente",
    contactName: contactName || "",
    currentDate,
    validityDays,
    budgetNumber,
    items: pricing.items,
    subtotal: pricing.subtotal,
    discountType: pricing.discountType,
    discountValue: pricing.discountValue,
    total: pricing.total,
    termDate: formattedTermDate,
    customDeliveryDays,
    paymentText,
    guaranteeText,
    layoutImageUrl,
    customerSignatureUrl: signatureImageUrl,
    logoUrl,
    directorSignatureUrl,
    // Vehicle identification
    serialNumber: serialNumber || null,
    plate: plate || null,
    chassisNumber: chassisNumber || null,
    // NEW FIELDS: Multi-customer invoicing and advanced pricing
    invoicesToCustomers: pricing.invoicesToCustomers || null,
    simultaneousTasks: pricing.simultaneousTasks || null,
    discountReference: pricing.discountReference || null,
  });

  // Generate PDF
  const { uri } = await Print.printToFileAsync({
    html: htmlContent,
    base64: false,
  });

  // Share the PDF
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: "application/pdf",
      dialogTitle: `Orçamento Nº ${budgetNumber}`,
      UTI: "com.adobe.pdf",
    });
  } else {
    throw new Error("Compartilhamento não disponível neste dispositivo");
  }
}

interface BudgetHtmlData {
  corporateName: string;
  contactName: string;
  currentDate: string;
  validityDays: number;
  budgetNumber: string;
  items: any[];
  subtotal: number;
  discountType: string;
  discountValue: number | null;
  total: number;
  termDate: string;
  customDeliveryDays: number | null; // Custom delivery time in working days
  paymentText: string;
  guaranteeText: string;
  layoutImageUrl: string | null;
  customerSignatureUrl: string | null;
  logoUrl: string;
  directorSignatureUrl: string;
  // Vehicle identification
  serialNumber: string | null;
  plate: string | null;
  chassisNumber: string | null;
  // NEW FIELDS: Multi-customer invoicing and advanced pricing
  invoicesToCustomers: Array<{ fantasyName: string; corporateName: string }> | null;
  simultaneousTasks: number | null;
  discountReference: string | null;
}

/**
 * Generates the HTML content for the budget PDF (2 pages)
 * EXACTLY matching the web version
 */
function generateBudgetHtml(data: BudgetHtmlData): string {
  // Calculate adaptive layout based on content
  const hasDiscount = data.discountType !== 'NONE' && !!data.discountValue && data.discountValue > 0;
  const hasDeliveryTerm = !!(data.customDeliveryDays || data.termDate);
  const hasInvoiceToCustomers = !!(data.invoicesToCustomers && data.invoicesToCustomers.length > 0);

  const layout = calculateAdaptiveLayout(
    data.items.length,
    hasDeliveryTerm,
    !!data.paymentText,
    !!data.guaranteeText,
    hasDiscount,
    hasInvoiceToCustomers
  );

  // Apply layout values - use L as shorthand for cleaner CSS
  const L = layout;

  // Generate invoice-to customers list (if multiple customers)
  const invoiceToCustomersHtml = data.invoicesToCustomers && data.invoicesToCustomers.length > 0
    ? `
      <section class="terms-section">
        <h2 class="terms-title">Faturar para</h2>
        <p class="terms-content">${data.invoicesToCustomers.map(c => escapeHtml(c.fantasyName || c.corporateName)).join(', ')}</p>
      </section>
    `
    : "";

  // Generate simultaneousTasks note (if multiple tasks quoted together)
  const simultaneousTasksHtml = data.simultaneousTasks && data.simultaneousTasks > 1
    ? `
      <p class="intro-text" style="margin-top: ${L.customerNameMarginBottom}mm; font-style: italic; color: ${PDF_CONFIG.textGray};">
        Orçamento para ${data.simultaneousTasks} implementos.
      </p>
    `
    : "";

  // Generate discount reference (if provided)
  const discountReferenceHtml = data.discountReference
    ? `
      <p class="intro-text" style="margin-top: ${L.customerNameMarginBottom}mm; font-style: italic; color: ${PDF_CONFIG.textGray};">
        ${escapeHtml(data.discountReference)}
      </p>
    `
    : "";

  // Generate services list with numbers
  // Description + observation shown inline (e.g., "Pintura Geral Azul Firenze")
  // All text is displayed in Title Case
  const servicesHtml = data.items
    .map((item, index) => {
      const amount = typeof item.amount === "number" ? item.amount : Number(item.amount) || 0;
      const valueDisplay = formatCurrency(amount);
      // Combine description and observation inline (Title Case)
      const description = toTitleCase(item.description || "Serviço");
      const observation = item.observation ? toTitleCase(item.observation) : "";
      const descriptionWithObs = observation ? `${description} ${observation}` : description;
      return `
        <div class="service-item">
          <span class="service-desc">${index + 1} - ${escapeHtml(descriptionWithObs)}</span>
          <span class="service-value">${valueDisplay}</span>
        </div>
      `;
    })
    .join("");

  // Generate totals section
  const discountLabel = data.discountType === 'PERCENTAGE'
    ? `Desconto (${data.discountValue}%)`
    : 'Desconto';
  const discountAmount = data.discountType === 'PERCENTAGE'
    ? (data.subtotal * (data.discountValue || 0) / 100)
    : (data.discountValue || 0);

  // Always show total, only show subtotal/discount rows when there's a discount
  const totalsHtml = hasDiscount ? `
    <div class="totals-section">
      <div class="total-row subtotal-row">
        <span class="total-label">Subtotal</span>
        <span class="total-value">${formatCurrency(data.subtotal)}</span>
      </div>
      <div class="total-row discount-row">
        <span class="total-label">${discountLabel}</span>
        <span class="total-value discount-value">- ${formatCurrency(discountAmount)}</span>
      </div>
      <div class="total-row final-total-row">
        <span class="total-label">Total</span>
        <span class="total-value total-final">${formatCurrency(data.total)}</span>
      </div>
    </div>
  ` : `
    <div class="totals-section">
      <div class="total-row final-total-row">
        <span class="total-label">Total</span>
        <span class="total-value total-final">${formatCurrency(data.total)}</span>
      </div>
    </div>
  `;

  // Layout section for page 2 (only if layout exists)
  const layoutHtml = data.layoutImageUrl
    ? `
      <section class="layout-section">
        <h2 class="section-title-green">Layout aprovado</h2>
        <div class="layout-image-container">
          <img src="${data.layoutImageUrl}" alt="Layout aprovado" class="layout-image" />
        </div>
      </section>
    `
    : "";

  // Customer signature image
  const customerSignatureHtml = data.customerSignatureUrl
    ? `<img src="${data.customerSignatureUrl}" alt="Assinatura do Cliente" class="signature-image" />`
    : '';

  // WhatsApp link
  const whatsappLink = `https://wa.me/${PDF_CONFIG.companyPhoneClean}`;

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Orçamento Nº ${data.budgetNumber} - ${data.corporateName}</title>
  <style>
    @page {
      size: A4;
      margin: 0;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    html, body {
      width: 210mm;
      height: 297mm;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: ${L.serviceFontSize}pt;
      line-height: 1.3;
      color: ${PDF_CONFIG.textDark};
      background: #fff;
    }

    a {
      color: inherit;
      text-decoration: none;
    }

    a:hover {
      text-decoration: underline;
    }

    .page {
      width: 210mm;
      height: 297mm;
      max-height: 297mm;
      padding: ${L.marginTop}mm ${L.marginSide}mm ${L.marginBottom}mm ${L.marginSide}mm;
      display: flex;
      flex-direction: column;
      page-break-after: always;
      page-break-inside: avoid;
      overflow: hidden;
      position: relative;
    }

    .page:last-child {
      page-break-after: auto;
    }

    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: ${L.headerMarginBottom}mm;
      flex-shrink: 0;
    }

    .logo {
      height: ${L.logoHeight}mm;
      width: auto;
    }

    .header-right {
      text-align: right;
    }

    .budget-number {
      font-size: ${L.budgetNumberFontSize}pt;
      font-weight: bold;
      color: ${PDF_CONFIG.textDark};
      margin-bottom: 1mm;
    }

    .header-info {
      font-size: ${L.serviceFontSize - 1}pt;
      color: #333;
      line-height: 1.4;
    }

    .header-info-label {
      font-weight: bold;
    }

    .header-line {
      height: 1px;
      background: linear-gradient(to right, #888 0%, ${PDF_CONFIG.primaryGreen} 30%);
      margin-bottom: ${L.headerLineMargin}mm;
      flex-shrink: 0;
    }

    /* Document Title */
    .document-title {
      font-size: ${L.titleFontSize}pt;
      font-weight: bold;
      color: ${PDF_CONFIG.primaryGreen};
      text-decoration: underline;
      text-underline-offset: 2px;
      margin-bottom: ${L.titleMarginBottom}mm;
      flex-shrink: 0;
    }

    /* Customer Info */
    .customer-section {
      margin-bottom: ${L.customerMarginBottom}mm;
      flex-shrink: 0;
    }

    .customer-name {
      font-size: ${L.introFontSize}pt;
      font-weight: bold;
      color: ${PDF_CONFIG.primaryGreen};
      margin-bottom: ${L.customerNameMarginBottom}mm;
    }

    .contact-line {
      font-size: ${L.introFontSize}pt;
      color: ${PDF_CONFIG.textDark};
      margin-bottom: ${L.customerNameMarginBottom}mm;
    }

    .intro-text {
      font-size: ${L.introFontSize}pt;
      color: ${PDF_CONFIG.textDark};
      line-height: ${L.introLineHeight};
    }

    /* Services Section */
    .services-section {
      margin-bottom: ${L.termsMarginBottom}mm;
      flex-shrink: 0;
    }

    .section-title-green {
      font-size: ${L.servicesTitleFontSize}pt;
      font-weight: bold;
      color: ${PDF_CONFIG.primaryGreen};
      margin-bottom: ${L.servicesTitleMargin}mm;
    }

    .services-list {
      padding-left: 4mm;
    }

    .service-item {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      padding: ${L.serviceItemPadding}mm 0;
      font-size: ${L.serviceFontSize}pt;
      line-height: 1.2;
    }

    .service-desc {
      color: ${PDF_CONFIG.textDark};
      flex: 1;
      padding-right: 8mm;
    }

    .service-value {
      color: ${PDF_CONFIG.textDark};
      font-weight: normal;
      white-space: nowrap;
      min-width: 70px;
      text-align: right;
    }

    /* Totals Section */
    .totals-section {
      margin-top: ${L.totalsMarginTop}mm;
      padding-left: 4mm;
      flex-shrink: 0;
    }

    .total-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      padding: ${L.totalRowPadding}mm 0;
      font-size: ${L.totalFontSize}pt;
    }

    .total-label {
      color: ${PDF_CONFIG.textDark};
    }

    .total-value {
      color: ${PDF_CONFIG.textDark};
      font-weight: normal;
      white-space: nowrap;
      min-width: 80px;
      text-align: right;
    }

    .discount-value {
      color: #c00;
    }

    .final-total-row {
      margin-top: 2mm;
      padding-top: 2mm;
      border-top: 1px solid #ddd;
    }

    .final-total-row .total-label {
      font-weight: bold;
    }

    .total-final {
      font-weight: bold;
      font-size: ${L.totalFontSize + 1}pt;
      color: ${PDF_CONFIG.primaryGreen};
    }

    /* Terms Sections */
    .terms-section {
      margin-bottom: ${L.termsMarginBottom}mm;
      flex-shrink: 0;
    }

    .terms-title {
      font-size: ${L.termsTitleFontSize}pt;
      font-weight: bold;
      color: ${PDF_CONFIG.primaryGreen};
      margin-bottom: ${L.termsTitleMargin}mm;
    }

    .terms-content {
      font-size: ${L.termsContentFontSize}pt;
      color: ${PDF_CONFIG.textDark};
      line-height: ${L.termsLineHeight};
    }

    .terms-content strong {
      font-weight: bold;
    }

    /* Content area - flex to fill available space, overflow hidden to contain content */
    .page-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
      overflow: hidden;
    }

    /* Footer - always at bottom, never overlaps content */
    .footer {
      padding-top: ${L.footerPaddingTop}mm;
      border-top: 1px solid;
      border-image: linear-gradient(to right, #888 0%, ${PDF_CONFIG.primaryGreen} 30%) 1;
      flex-shrink: 0;
      margin-top: auto;
      background: white;
      position: relative;
      z-index: 10;
    }

    .footer-company {
      font-size: ${L.termsTitleFontSize}pt;
      font-weight: bold;
      color: ${PDF_CONFIG.primaryGreen};
      margin-bottom: 1mm;
    }

    .footer-info {
      font-size: ${L.termsContentFontSize - 1}pt;
      color: #333;
      line-height: 1.5;
    }

    .footer-link {
      color: ${PDF_CONFIG.primaryGreen};
    }

    /* Page 2 - Layout Section */
    .layout-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
      overflow: hidden;
      margin-bottom: 5mm;
    }

    .layout-image-container {
      flex: 1;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      margin-top: 4mm;
      width: 100%;
      min-height: 0;
      overflow: hidden;
    }

    .layout-image {
      width: 100%;
      height: auto;
      max-height: 100%;
      object-fit: contain;
      object-position: center top;
    }

    /* Signature Section */
    .signature-section {
      margin-top: 10mm;
      margin-bottom: 10mm;
      display: flex;
      justify-content: space-between;
      gap: 30mm;
      flex-shrink: 0;
    }

    .signature-box {
      flex: 1;
      text-align: center;
    }

    .signature-image-container {
      height: 15mm;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      margin-bottom: 2mm;
    }

    .signature-image {
      max-height: 15mm;
      max-width: 50mm;
      object-fit: contain;
    }

    .signature-line {
      border-top: 1px solid ${PDF_CONFIG.textDark};
      padding-top: 3mm;
    }

    .signature-name {
      font-size: 10pt;
      color: ${PDF_CONFIG.textDark};
      margin-bottom: 1mm;
    }

    .signature-title {
      font-size: 9pt;
      color: ${PDF_CONFIG.textGray};
    }

    @media print {
      html, body {
        width: 210mm;
        height: auto;
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }

      .page {
        width: 210mm;
        height: 297mm;
        max-height: 297mm;
        page-break-after: always;
        page-break-inside: avoid;
        overflow: hidden;
      }

      .page:last-child {
        page-break-after: auto;
      }

      a {
        color: inherit !important;
        text-decoration: none !important;
      }
    }
  </style>
</head>
<body>
  <!-- Page 1 - Front -->
  <div class="page">
    <!-- Header -->
    <header class="header">
      <img src="${data.logoUrl}" alt="Ankaa Design" class="logo" />
      <div class="header-right">
        <div class="budget-number">Orçamento Nº ${escapeHtml(data.budgetNumber)}</div>
        <div class="header-info">
          <span class="header-info-label">Emissão:</span> ${data.currentDate}<br />
          <span class="header-info-label">Validade:</span> ${data.validityDays} dias
        </div>
      </div>
    </header>
    <div class="header-line"></div>

    <!-- Content Area -->
    <div class="page-content">
      <!-- Document Title -->
      <h1 class="document-title">ORÇAMENTO</h1>

      <!-- Customer Info -->
      <div class="customer-section">
        <div class="customer-name">À ${escapeHtml(formatCorporateName(data.corporateName))}</div>
        ${data.contactName ? `<div class="contact-line">Caro ${escapeHtml(data.contactName)}</div>` : ""}
        <p class="intro-text">Conforme solicitado, apresentamos nossa proposta de preço para execução dos serviços abaixo descriminados${data.serialNumber || data.plate || data.chassisNumber ? ` no veículo${data.serialNumber ? ` nº série: <strong>${escapeHtml(data.serialNumber)}</strong>` : ''}${data.serialNumber && (data.plate || data.chassisNumber) ? ',' : ''}${data.plate ? ` placa: <strong style="font-weight: 600;">${escapeHtml(data.plate)}</strong>` : ''}${data.plate && data.chassisNumber ? ',' : ''}${data.chassisNumber ? ` chassi: <strong style="font-weight: 600;">${escapeHtml(data.chassisNumber)}</strong>` : ''}` : ''}.</p>
        ${simultaneousTasksHtml}
        ${discountReferenceHtml}
      </div>

      <!-- Services -->
      <section class="services-section">
        <h2 class="section-title-green">Serviços</h2>
        <div class="services-list">
          ${servicesHtml}
        </div>
        ${totalsHtml}
      </section>

      <!-- Invoice To Customers (if multiple customers) -->
      ${invoiceToCustomersHtml}

      <!-- Delivery Term - customDeliveryDays takes priority over termDate -->
      ${data.customDeliveryDays ? `
      <section class="terms-section">
        <h2 class="terms-title">Prazo de entrega</h2>
        <p class="terms-content">O prazo de entrega é de ${data.customDeliveryDays} dias úteis a partir da data de liberação.</p>
      </section>
      ` : data.termDate ? `
      <section class="terms-section">
        <h2 class="terms-title">Prazo de entrega</h2>
        <p class="terms-content">O prazo de entrega é de ${data.termDate}, desde que o implemento esteja nas condições previamente informada e não haja alterações nos serviços descritos.</p>
      </section>
      ` : ""}

      <!-- Payment Terms -->
      ${data.paymentText ? `
      <section class="terms-section">
        <h2 class="terms-title">Condições de pagamento</h2>
        <p class="terms-content">${escapeHtml(data.paymentText)}</p>
      </section>
      ` : ""}

      <!-- Guarantee -->
      ${data.guaranteeText ? `
      <section class="terms-section">
        <h2 class="terms-title">Garantias</h2>
        <p class="terms-content">${formatGuaranteeHtml(data.guaranteeText)}</p>
      </section>
      ` : ""}
    </div>

    <!-- Footer -->
    <footer class="footer">
      <div class="footer-company">${PDF_CONFIG.companyName}</div>
      <div class="footer-info">
        ${PDF_CONFIG.companyAddress}<br />
        <a href="${whatsappLink}" class="footer-link">${PDF_CONFIG.companyPhone}</a><br />
        <a href="${PDF_CONFIG.companyWebsiteUrl}" class="footer-link">${PDF_CONFIG.companyWebsite}</a>
      </div>
    </footer>
  </div>

  <!-- Page 2 - Back (Layout + Signatures) -->
  <div class="page">
    <!-- Header -->
    <header class="header">
      <img src="${data.logoUrl}" alt="Ankaa Design" class="logo" />
      <div class="header-right">
        <div class="budget-number">Orçamento Nº ${escapeHtml(data.budgetNumber)}</div>
        <div class="header-info">
          <span class="header-info-label">Emissão:</span> ${data.currentDate}<br />
          <span class="header-info-label">Validade:</span> ${data.validityDays} dias
        </div>
      </div>
    </header>
    <div class="header-line"></div>

    <!-- Content Area -->
    <div class="page-content">
      <!-- Layout Section -->
      ${layoutHtml}
    </div>

    <!-- Signature Section -->
    <div class="signature-section">
      <div class="signature-box">
        <div class="signature-image-container">
          <img src="${data.directorSignatureUrl}" alt="Assinatura Sergio Rodrigues" class="signature-image" style="margin-top: 12mm;" />
        </div>
        <div class="signature-line">
          <div class="signature-name">${PDF_CONFIG.directorName}</div>
          <div class="signature-title">${PDF_CONFIG.directorTitle}</div>
        </div>
      </div>
      <div class="signature-box">
        <div class="signature-image-container">
          ${customerSignatureHtml}
        </div>
        <div class="signature-line">
          <div class="signature-name">Responsável CLIENTE</div>
          <div class="signature-title"></div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <footer class="footer">
      <div class="footer-company">${PDF_CONFIG.companyName}</div>
      <div class="footer-info">
        ${PDF_CONFIG.companyAddress}<br />
        <a href="${whatsappLink}" class="footer-link">${PDF_CONFIG.companyPhone}</a><br />
        <a href="${PDF_CONFIG.companyWebsiteUrl}" class="footer-link">${PDF_CONFIG.companyWebsite}</a>
      </div>
    </footer>
  </div>
</body>
</html>
  `;
}
