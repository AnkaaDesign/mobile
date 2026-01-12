/**
 * Network Diagnostics Utility
 *
 * Provides tools to diagnose network connectivity issues
 * between the mobile app and the API server.
 */

import { Alert } from 'react-native';
import Constants from 'expo-constants';

interface DiagnosticResult {
  success: boolean;
  message: string;
  details: Record<string, any>;
}

/**
 * Get API URL using the same priority as the app
 */
function getApiUrl(): string | null {
  // Priority 1: Check app.json (works in production builds)
  if (Constants?.expoConfig?.extra?.apiUrl) {
    console.log('[Diagnostics] Using API URL from app.json:', Constants.expoConfig.extra.apiUrl);
    return Constants.expoConfig.extra.apiUrl;
  }

  // Priority 2: Check environment variable (dev mode only)
  if (process.env.EXPO_PUBLIC_API_URL) {
    console.log('[Diagnostics] Using API URL from env:', process.env.EXPO_PUBLIC_API_URL);
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Priority 3: Check global
  if ((global as any).__ANKAA_API_URL__) {
    console.log('[Diagnostics] Using API URL from global:', (global as any).__ANKAA_API_URL__);
    return (global as any).__ANKAA_API_URL__;
  }

  console.error('[Diagnostics] No API URL configured!');
  return null;
}

/**
 * Test basic connectivity to the API server
 */
export async function testApiConnection(): Promise<DiagnosticResult> {
  const apiUrl = getApiUrl();

  if (!apiUrl) {
    return {
      success: false,
      message: 'API URL não configurada',
      details: {
        'app.json': Constants?.expoConfig?.extra?.apiUrl || 'não definida',
        'EXPO_PUBLIC_API_URL': process.env.EXPO_PUBLIC_API_URL || 'não definida',
        'global.__ANKAA_API_URL__': (global as any).__ANKAA_API_URL__ || 'não definida',
      }
    };
  }

  try {
    console.log('[Network Diagnostics] Testing connection to:', apiUrl);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const startTime = Date.now();
    const response = await fetch(`${apiUrl}/`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const responseTime = Date.now() - startTime;
    const responseText = await response.text();

    return {
      success: true,
      message: 'Conexão bem-sucedida!',
      details: {
        apiUrl,
        status: response.status,
        statusText: response.statusText,
        responseTime: `${responseTime}ms`,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseText.substring(0, 200),
      }
    };
  } catch (error: any) {
    console.error('[Network Diagnostics] Connection test failed:', error);

    return {
      success: false,
      message: 'Falha na conexão',
      details: {
        apiUrl,
        errorName: error.name,
        errorMessage: error.message,
        errorCode: error.code,
        isTimeout: error.name === 'AbortError',
        isNetworkError: error.message?.includes('Network') || error.message?.includes('Failed to fetch'),
      }
    };
  }
}

/**
 * Test authentication endpoint specifically
 */
export async function testAuthEndpoint(): Promise<DiagnosticResult> {
  const apiUrl = getApiUrl();

  if (!apiUrl) {
    return {
      success: false,
      message: 'API URL não configurada',
      details: {}
    };
  }

  try {
    console.log('[Network Diagnostics] Testing auth endpoint:', `${apiUrl}/auth/login`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const startTime = Date.now();
    // Send invalid data to just test connectivity (will return 400 but that's OK)
    const response = await fetch(`${apiUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ contact: 'test', password: 'test' }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const responseTime = Date.now() - startTime;
    const responseText = await response.text();

    // 400 is expected with test data, so that's actually good!
    const isReachable = response.status === 400 || response.status === 401 || response.status === 200;

    return {
      success: isReachable,
      message: isReachable ? 'Endpoint de login acessível!' : 'Endpoint retornou erro inesperado',
      details: {
        endpoint: `${apiUrl}/auth/login`,
        status: response.status,
        statusText: response.statusText,
        responseTime: `${responseTime}ms`,
        body: responseText.substring(0, 300),
      }
    };
  } catch (error: any) {
    console.error('[Network Diagnostics] Auth endpoint test failed:', error);

    return {
      success: false,
      message: 'Falha ao acessar endpoint de login',
      details: {
        endpoint: `${apiUrl}/auth/login`,
        errorName: error.name,
        errorMessage: error.message,
        errorCode: error.code,
      }
    };
  }
}

/**
 * Run full diagnostic suite and show results in an alert
 */
export async function runFullDiagnostics(): Promise<void> {
  Alert.alert('Diagnóstico de Rede', 'Iniciando testes de conectividade...', [{ text: 'OK' }]);

  console.log('[Network Diagnostics] Starting full diagnostic suite');

  // Test 1: Basic connectivity
  const basicTest = await testApiConnection();
  console.log('[Network Diagnostics] Basic test:', basicTest);

  // Test 2: Auth endpoint
  const authTest = await testAuthEndpoint();
  console.log('[Network Diagnostics] Auth test:', authTest);

  // Prepare results
  const results = [
    `=== TESTE DE CONECTIVIDADE ===`,
    `API URL: ${basicTest.details.apiUrl || 'NÃO CONFIGURADA'}`,
    ``,
    `--- Teste Básico ---`,
    `Status: ${basicTest.success ? '✅ SUCESSO' : '❌ FALHOU'}`,
    `Mensagem: ${basicTest.message}`,
    basicTest.details.responseTime ? `Tempo: ${basicTest.details.responseTime}` : '',
    basicTest.details.status ? `HTTP Status: ${basicTest.details.status}` : '',
    basicTest.details.errorMessage ? `Erro: ${basicTest.details.errorMessage}` : '',
    ``,
    `--- Teste de Login ---`,
    `Status: ${authTest.success ? '✅ SUCESSO' : '❌ FALHOU'}`,
    `Mensagem: ${authTest.message}`,
    authTest.details.responseTime ? `Tempo: ${authTest.details.responseTime}` : '',
    authTest.details.status ? `HTTP Status: ${authTest.details.status}` : '',
    authTest.details.errorMessage ? `Erro: ${authTest.details.errorMessage}` : '',
    ``,
    `=== DIAGNÓSTICO ===`,
  ];

  // Add diagnostic suggestions
  if (!basicTest.success || !authTest.success) {
    if (basicTest.details.isTimeout || authTest.details.isTimeout) {
      results.push('⚠️ Timeout detectado - API pode estar lenta ou inacessível');
    }
    if (basicTest.details.isNetworkError || authTest.details.isNetworkError) {
      results.push('⚠️ Erro de rede - verifique:');
      results.push('  • WiFi está conectado?');
      results.push('  • Está na mesma rede que o servidor?');
      results.push('  • Servidor API está rodando?');
    }
    if (basicTest.details.errorMessage?.includes('cleartext')) {
      results.push('⚠️ Erro de cleartext - Android bloqueando HTTP');
      results.push('  • Reconstrua o APK com as correções');
    }
  } else {
    results.push('✅ Conexão OK - API está acessível!');
    results.push('Se o login ainda falha, verifique credenciais.');
  }

  const fullReport = results.filter(line => line !== '').join('\n');

  console.log('[Network Diagnostics] Full report:\n', fullReport);

  Alert.alert(
    'Resultado do Diagnóstico',
    fullReport,
    [
      {
        text: 'Copiar para Área de Transferência',
        onPress: async () => {
          try {
            const Clipboard = await import('expo-clipboard');
            await Clipboard.default.setStringAsync(fullReport);
            Alert.alert('Sucesso', 'Relatório copiado!');
          } catch (error) {
            console.error('Failed to copy:', error);
          }
        }
      },
      { text: 'Fechar' }
    ],
    { cancelable: true }
  );
}

/**
 * Quick connection test with simple alert
 */
export async function quickConnectionTest(): Promise<boolean> {
  const result = await testApiConnection();

  Alert.alert(
    result.success ? 'Conexão OK' : 'Erro de Conexão',
    result.success
      ? `API acessível em ${result.details.responseTime}\nStatus: ${result.details.status}`
      : `${result.message}\n\nDetalhes: ${result.details.errorMessage || 'Desconhecido'}`,
    [{ text: 'OK' }]
  );

  return result.success;
}
