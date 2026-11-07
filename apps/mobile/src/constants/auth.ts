/**
 * Google OAuth Configuration constants for Kivo Mobile
 *
 * Client IDs provided for Google Cloud Project 575105233892:
 * - Web Client ID (backend / offline access / token verification):
 *   575105233892-phuq7q8ov0d3bu9qu2gvdeellaj144mh.apps.googleusercontent.com
 * - iOS Client ID (Native iOS bundle com.ichshakib.kivo):
 *   575105233892-ggr5h6772q2f4oi1jqmn2sgg37kapmgj.apps.googleusercontent.com
 * - Android Client ID (Native Android package com.ichshakib.kivo):
 *   575105233892-ldm0luvv29jifa5p5gr9te7gooddr6fv.apps.googleusercontent.com
 */
export const GOOGLE_AUTH_CONFIG = {
  webClientId: '575105233892-phuq7q8ov0d3bu9qu2gvdeellaj144mh.apps.googleusercontent.com',
  iosClientId: '575105233892-ggr5h6772q2f4oi1jqmn2sgg37kapmgj.apps.googleusercontent.com',
  androidClientId: '575105233892-ldm0luvv29jifa5p5gr9te7gooddr6fv.apps.googleusercontent.com',
  iosUrlScheme: 'com.googleusercontent.apps.575105233892-ggr5h6772q2f4oi1jqmn2sgg37kapmgj',
  scopes: ['profile', 'email'],
  offlineAccess: true,
} as const;

export const API_CONFIG = {
  baseUrl: 'http://192.168.0.100:5000',
  endpoints: {
    mobileGoogleAuth: '/api/auth/mobile/google',
    logout: '/api/auth/logout',
  },
} as const;
