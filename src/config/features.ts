export const FEATURES = {
  free: {
    viewLimit: 50,
    editing: false,
    export: false,
    multiFormat: false,
    support: false,
  },
  premium: {
    viewLimit: -1, // unlimited
    editing: true,
    export: true,
    multiFormat: true,
    support: true,
  },
} as const;

export const FEATURE_FLAGS = {
  enableAnalytics: true,
  enableWebWorkers: true,
  enableOfflineMode: false,
  enableBetaFeatures: false,
} as const;