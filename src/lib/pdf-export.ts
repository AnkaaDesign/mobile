import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';

/**
 * Generate HTML table from data
 */
function generateHTMLTable<T extends Record<string, any>>(
  data: T[],
  headers: { key: keyof T; label: string }[],
  title: string
): string {
  const headerRow = headers.map((h) => `<th>${h.label}</th>`).join('');

  const dataRows = data
    .map((row) => {
      const cells = headers
        .map((header) => {
          const value = row[header.key];
          let displayValue = '';

          if (value === null || value === undefined) displayValue = '';
          else if (typeof value === 'boolean') displayValue = value ? 'Sim' : 'Não';
          else if (typeof value === 'number') displayValue = value.toString();
          else if (typeof value === 'object' && (value as object) instanceof Date) displayValue = (value as Date).toLocaleDateString('pt-BR');
          else displayValue = String(value);

          return `<td>${displayValue}</td>`;
        })
        .join('');
      return `<tr>${cells}</tr>`;
    })
    .join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            padding: 20px;
            color: #333;
          }
          h1 {
            font-size: 24px;
            margin-bottom: 10px;
            color: #1a1a1a;
          }
          .metadata {
            font-size: 12px;
            color: #666;
            margin-bottom: 20px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            font-size: 11px;
          }
          th {
            background-color: #f5f5f5;
            border: 1px solid #ddd;
            padding: 10px 8px;
            text-align: left;
            font-weight: 600;
            color: #1a1a1a;
          }
          td {
            border: 1px solid #ddd;
            padding: 8px;
            color: #333;
          }
          tr:nth-child(even) {
            background-color: #fafafa;
          }
          .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #ddd;
            font-size: 10px;
            color: #999;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <div class="metadata">
          <p>Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
          <p>Total de registros: ${data.length}</p>
        </div>
        <table>
          <thead>
            <tr>${headerRow}</tr>
          </thead>
          <tbody>
            ${dataRows}
          </tbody>
        </table>
        <div class="footer">
          <p>Relatório gerado automaticamente</p>
        </div>
      </body>
    </html>
  `;
}

/**
 * Export data as PDF file
 */
export async function exportToPDF<T extends Record<string, any>>(
  data: T[],
  headers: { key: keyof T; label: string }[],
  filename: string,
  title: string
): Promise<void> {
  try {
    if (data.length === 0) {
      Alert.alert('Aviso', 'Não há dados para exportar');
      return;
    }

    // Check if sharing is available
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert('Erro', 'Compartilhamento não está disponível neste dispositivo');
      return;
    }

    // Generate HTML content
    const htmlContent = generateHTMLTable(data, headers, title);

    // Generate PDF using Expo Print
    const { uri } = await Print.printToFileAsync({
      html: htmlContent,
      base64: false,
    });

    if (!uri) {
      throw new Error('Falha ao gerar PDF');
    }

    // Share PDF
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Exportar PDF',
      UTI: 'com.adobe.pdf',
    });

  } catch (error: any) {
    console.error('PDF Export Error:', error);
    Alert.alert('Erro', 'Falha ao exportar PDF: ' + error.message);
  }
}
