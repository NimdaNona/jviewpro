export const APP_CONFIG = {
  name: 'JViewPro',
  description: 'Professional JSON viewer and editor with advanced features',
  url: 'https://jviewpro.com',
  version: '1.0.0',
} as const;

export const FILE_LIMITS = {
  maxSizeBytes: 25 * 1024 * 1024, // 25MB hard limit
  softLimitBytes: 10 * 1024 * 1024, // 10MB soft limit with warning
  webWorkerThreshold: 5 * 1024 * 1024, // Use web worker for files >5MB
  freeViewLimit: 50, // Number of nodes visible in free tier
} as const;

export const SUPPORTED_FORMATS = {
  json: ['.json', '.JSON'],
  zip: ['.zip', '.ZIP'],
  text: ['.txt', '.TXT'],
} as const;

export const PRICING = {
  monthly: 500, // $5.00 in cents
  currency: 'usd',
  billingInterval: 'month',
} as const;

export const ROUTES = {
  home: '/',
  success: '/success',
  cancel: '/cancel',
  privacy: '/privacy',
  terms: '/terms',
} as const;

export const STORAGE_KEYS = {
  subscription: 'jvp_subscription',
  preferences: 'jvp_preferences',
  recentFiles: 'jvp_recent_files',
} as const;