import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import { formatDate } from '@/utils';

/**
 * Company info and brand colors (matching web/src/config/company.ts)
 */
const COMPANY_INFO = {
  name: "Ankaa Design",
  address: "Rua: Luis Carlos Zani, 2493 - Santa Paula, Ibipora-PR",
  phone: "43 9 8428-3228",
  phoneClean: "5543984283228",
  website: "ankaadesign.com.br",
  websiteUrl: "https://ankaadesign.com.br",
} as const;

const BRAND_COLORS = {
  primaryGreen: "#0a5c1e",
  textDark: "#1a1a1a",
  textGray: "#666666",
} as const;

interface ServiceOrderForDossie {
  id: string;
  description: string;
  observation?: string | null;
  position?: number | null;
  checkinFiles?: Array<{ id: string; filename: string; originalName?: string }>;
  checkoutFiles?: Array<{ id: string; filename: string; originalName?: string }>;
}

interface DossieExportOptions {
  taskDisplayName: string;
  customerName?: string;
  serialNumber?: string | null;
  plate?: string | null;
  serviceOrders: ServiceOrderForDossie[];
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Build the HTML content for the dossie PDF.
 * Mirrors the web dossie-pdf-generator structure.
 */
function buildDossieHtml(options: DossieExportOptions): string {
  const { taskDisplayName, customerName, serialNumber, plate, serviceOrders } = options;
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || '';
  const currentDate = formatDate(new Date());
  const whatsappLink = `https://wa.me/${COMPANY_INFO.phoneClean}`;

  const vehicleInfo = [
    serialNumber ? `Serie: ${escapeHtml(serialNumber)}` : '',
    plate ? `Placa: ${escapeHtml(plate)}` : '',
  ].filter(Boolean).join(' | ');

  const buildPhotoRow = (files: Array<{ id: string; filename: string; originalName?: string }>) => {
    if (files.length === 0) return '';
    const cols = Math.max(3, files.length);
    const cells = files.map(file =>
      `<div class="photo-cell"><img src="${apiUrl}/files/serve/${file.id}" alt="${escapeHtml(file.originalName || file.filename)}" class="photo-img" /></div>`
    ).join('');
    const spacers = Array(cols - files.length).fill('<div class="photo-cell photo-cell-spacer"></div>').join('');
    return `<div class="photo-row" style="grid-template-columns: repeat(${cols}, 1fr);">${cells}${spacers}</div>`;
  };

  const buildServiceOrder = (so: ServiceOrderForDossie) => {
    const isOutrosWithObservation = so.description === 'Outros' && !!so.observation;
    const displayDescription = isOutrosWithObservation ? so.observation : so.description;
    const checkinFiles = so.checkinFiles || [];
    const checkoutFiles = so.checkoutFiles || [];

    return `
      <div class="service-order-block">
        <div class="so-header">
          <span class="so-title">${escapeHtml(displayDescription || 'Servico')}</span>
          ${!isOutrosWithObservation && so.observation ? `<span class="so-obs">${escapeHtml(so.observation)}</span>` : ''}
        </div>
        ${checkinFiles.length > 0 ? `
          <div class="section-label antes-label">Antes (Check-in)</div>
          ${buildPhotoRow(checkinFiles)}
        ` : ''}
        ${checkoutFiles.length > 0 ? `
          <div class="section-label depois-label">Depois (Check-out)</div>
          ${buildPhotoRow(checkoutFiles)}
        ` : ''}
      </div>
    `;
  };

  const buildHeader = (showTitle: boolean) => `
    <header class="header">
      <div class="header-brand">
        <div class="header-brand-name">${COMPANY_INFO.name}</div>
      </div>
      <div class="header-right">
        <div class="header-title">DOSSIE</div>
        <div class="header-info">
          <span class="header-info-label">Data:</span> ${currentDate}
        </div>
      </div>
    </header>
    <div class="header-line"></div>
    ${showTitle ? `
      <div class="document-title">${escapeHtml(taskDisplayName)}</div>
      ${customerName ? `<div class="document-subtitle">${escapeHtml(customerName)}</div>` : ''}
      ${vehicleInfo ? `<div class="vehicle-info"><strong>${vehicleInfo}</strong></div>` : ''}
    ` : ''}
  `;

  const footerHtml = `
    <footer class="footer">
      <div class="footer-company">${COMPANY_INFO.name}</div>
      <div class="footer-info">
        ${COMPANY_INFO.address}<br />
        <a href="${whatsappLink}" class="footer-link">${COMPANY_INFO.phone}</a> |
        <a href="${COMPANY_INFO.websiteUrl}" class="footer-link">${COMPANY_INFO.website}</a>
      </div>
    </footer>
  `;

  // Paginate: 2 service orders per page
  const pages: string[] = [];
  for (let i = 0; i < serviceOrders.length; i += 2) {
    const isFirstPage = i === 0;
    const soBlocks = serviceOrders.slice(i, i + 2).map(buildServiceOrder).join('');
    pages.push(`
      <div class="page">
        ${buildHeader(isFirstPage)}
        <div class="page-content">
          ${soBlocks}
        </div>
        ${footerHtml}
      </div>
    `);
  }

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dossie - ${escapeHtml(taskDisplayName)}</title>
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
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 10pt;
      line-height: 1.3;
      color: ${BRAND_COLORS.textDark};
      background: #fff;
    }

    a { color: inherit; text-decoration: none; }

    .page {
      width: 210mm;
      min-height: 297mm;
      padding: 10mm 20mm 12mm 20mm;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      page-break-after: always;
    }

    .page:last-child {
      page-break-after: auto;
    }

    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2mm;
      flex-shrink: 0;
    }

    .header-brand-name {
      font-size: 16pt;
      font-weight: bold;
      color: ${BRAND_COLORS.primaryGreen};
    }

    .header-right {
      text-align: right;
    }

    .header-title {
      font-size: 13pt;
      font-weight: bold;
      color: ${BRAND_COLORS.textDark};
      margin-bottom: 1mm;
    }

    .header-info {
      font-size: 9pt;
      color: #333;
      line-height: 1.4;
    }

    .header-info-label {
      font-weight: bold;
    }

    .header-line {
      height: 1px;
      background: linear-gradient(to right, #888 0%, ${BRAND_COLORS.primaryGreen} 30%);
      margin-bottom: 4mm;
      flex-shrink: 0;
    }

    /* Document title */
    .document-title {
      font-size: 14pt;
      font-weight: bold;
      color: ${BRAND_COLORS.primaryGreen};
      margin-bottom: 1mm;
    }

    .document-subtitle {
      font-size: 10pt;
      color: ${BRAND_COLORS.textGray};
      margin-bottom: 2mm;
    }

    .vehicle-info {
      font-size: 9pt;
      color: ${BRAND_COLORS.textDark};
      margin-bottom: 5mm;
    }

    .vehicle-info strong {
      font-weight: 600;
    }

    /* Content */
    .page-content {
      flex: 1;
    }

    /* Service order block */
    .service-order-block {
      margin-bottom: 5mm;
    }

    .so-header {
      background: ${BRAND_COLORS.primaryGreen};
      color: #fff;
      padding: 2mm 3mm;
      border-radius: 1.5mm 1.5mm 0 0;
      display: flex;
      align-items: center;
      gap: 3mm;
    }

    .so-title {
      font-size: 10pt;
      font-weight: 600;
    }

    .so-obs {
      font-size: 8pt;
      opacity: 0.85;
      font-style: italic;
    }

    .section-label {
      font-size: 8.5pt;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      margin-bottom: 1.5mm;
      margin-top: 2mm;
    }

    .antes-label {
      color: #2563eb;
    }

    .depois-label {
      color: #16a34a;
    }

    /* Photo row: CSS grid */
    .photo-row {
      display: grid;
      gap: 1.5mm;
      margin-bottom: 1.5mm;
    }

    .photo-cell {
      aspect-ratio: 4/3;
      overflow: hidden;
      border-radius: 1mm;
      border: 0.5px solid #e0e0e0;
      background: #f9f9f9;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .photo-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .photo-cell-spacer {
      border: none;
      background: transparent;
    }

    /* Footer */
    .footer {
      padding-top: 2mm;
      border-top: 1px solid ${BRAND_COLORS.primaryGreen};
      flex-shrink: 0;
      margin-top: auto;
    }

    .footer-company {
      font-size: 10pt;
      font-weight: bold;
      color: ${BRAND_COLORS.primaryGreen};
      margin-bottom: 1mm;
    }

    .footer-info {
      font-size: 8pt;
      color: #333;
      line-height: 1.5;
    }

    .footer-link {
      color: ${BRAND_COLORS.primaryGreen};
    }

    @media print {
      html, body {
        width: 210mm;
        height: auto;
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  ${pages.join('')}
</body>
</html>
  `;
}

/**
 * Export a task's dossie as a shareable PDF.
 * Uses expo-print to generate a PDF from HTML, then expo-sharing to share it.
 *
 * @param task - The task object with serviceOrders containing checkinFiles/checkoutFiles
 */
export async function exportDossie(task: any): Promise<void> {
  try {
    // Filter service orders that have files
    const serviceOrdersWithFiles = (task.serviceOrders || [])
      .filter((so: any) =>
        so.type === 'PRODUCTION' &&
        ((so.checkinFiles?.length || 0) > 0 || (so.checkoutFiles?.length || 0) > 0)
      )
      .sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0));

    if (serviceOrdersWithFiles.length === 0) {
      Alert.alert('Aviso', 'Nenhum registro fotografico encontrado no dossie.');
      return;
    }

    // Build display name (same logic as the detail screen)
    const taskDisplayName = task.name
      || task.customer?.fantasyName
      || (task.serialNumber ? `Serie ${task.serialNumber}` : null)
      || task.truck?.plate
      || 'Sem nome';

    const htmlContent = buildDossieHtml({
      taskDisplayName,
      customerName: task.customer?.fantasyName,
      serialNumber: task.serialNumber,
      plate: task.truck?.plate,
      serviceOrders: serviceOrdersWithFiles,
    });

    // Check if sharing is available
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      // Fallback: use Print.printAsync to open the system print dialog
      await Print.printAsync({ html: htmlContent });
      return;
    }

    // Generate PDF file
    const { uri } = await Print.printToFileAsync({
      html: htmlContent,
      base64: false,
    });

    if (!uri) {
      throw new Error('Falha ao gerar PDF');
    }

    // Share the generated PDF
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Exportar Dossie',
      UTI: 'com.adobe.pdf',
    });
  } catch (error: any) {
    console.error('Dossie Export Error:', error);
    Alert.alert('Erro', 'Falha ao exportar dossie: ' + (error.message || 'Erro desconhecido'));
  }
}
