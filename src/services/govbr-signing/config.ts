import { GovbrEnvironment } from './types';

interface GovbrConfig {
  authorizeUrl: string;
  clientId: string;
  redirectUri: string;
  scopes: string[];
}

const STAGING_CONFIG: GovbrConfig = {
  authorizeUrl: 'https://sso.staging.acesso.gov.br/authorize',
  clientId: process.env.EXPO_PUBLIC_GOVBR_CLIENT_ID || '',
  redirectUri: 'ankaadesign://govbr-callback',
  scopes: ['signature_session', 'govbr'],
};

const PRODUCTION_CONFIG: GovbrConfig = {
  authorizeUrl: 'https://sso.acesso.gov.br/authorize',
  clientId: process.env.EXPO_PUBLIC_GOVBR_CLIENT_ID || '',
  redirectUri: 'ankaadesign://govbr-callback',
  scopes: ['signature_session', 'govbr'],
};

export function getGovbrConfig(environment: GovbrEnvironment): GovbrConfig {
  return environment === 'production' ? PRODUCTION_CONFIG : STAGING_CONFIG;
}
