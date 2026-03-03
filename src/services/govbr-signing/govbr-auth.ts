import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';
import { getGovbrConfig } from './config';
import { GovbrEnvironment } from './types';

interface AuthResult {
  code: string;
}

export async function authenticateWithGovbr(
  environment: GovbrEnvironment,
): Promise<AuthResult> {
  const config = getGovbrConfig(environment);

  const state = Crypto.randomUUID();

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    scope: config.scopes.join(' '),
    redirect_uri: config.redirectUri,
    state,
  });

  const authUrl = `${config.authorizeUrl}?${params.toString()}`;

  const result = await WebBrowser.openAuthSessionAsync(
    authUrl,
    config.redirectUri,
  );

  if (result.type === 'cancel' || result.type === 'dismiss') {
    throw new Error('Autenticação cancelada pelo usuário.');
  }

  if (result.type !== 'success' || !result.url) {
    throw new Error('Falha na autenticação com Gov.br.');
  }

  const url = new URL(result.url);
  const returnedCode = url.searchParams.get('code');
  const returnedState = url.searchParams.get('state');

  if (returnedState !== state) {
    throw new Error(
      'Falha na validação de segurança (state). Tente novamente.',
    );
  }

  if (!returnedCode) {
    const error = url.searchParams.get('error_description') ||
      url.searchParams.get('error') ||
      'Código de autorização não recebido';
    throw new Error(error);
  }

  return { code: returnedCode };
}
