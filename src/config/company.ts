/**
 * Centralized Company Information
 *
 * All static business data (name, address, contacts, director info)
 * is defined here so it can be updated in a single place.
 */

export const COMPANY_INFO = {
  name: 'Ankaa Design',
  address: 'Rua: Luís Carlos Zani, 2493 - Santa Paula, Ibiporã-PR',
  phone: '43 9 8428-3228',
  phoneClean: '5543984283228',
  website: 'ankaadesign.com.br',
  websiteUrl: 'https://ankaadesign.com.br',
} as const;

export const DIRECTOR_INFO = {
  name: 'Sergio Rodrigues',
  title: 'Diretor Comercial',
} as const;

export const BRAND_COLORS = {
  primaryGreen: '#0a5c1e',
  textDark: '#1a1a1a',
  textGray: '#666666',
} as const;
