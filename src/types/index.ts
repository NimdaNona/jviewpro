export interface FileData {
  name: string;
  size: number;
  type: string;
  content: string;
  lastModified: number;
  parsedData?: any;
  metadata?: JsonMetadata;
  errors?: string[];
  warnings?: string[];
  extractedFrom?: string; // For files extracted from ZIP archives
}

export interface JsonMetadata {
  isValid: boolean;
  type: string;
  nodeCount: number;
  depth: number;
  size: number;
}

export interface ProcessedData {
  success: boolean;
  data?: any;
  error?: string;
  fileInfo?: FileData;
}

export interface ValidationResult {
  isValid: boolean;
  errors?: string[];
  warnings?: string[];
}

export interface JsonFile {
  name: string;
  content: string;
  size: number;
}

export type ViewMode = 'tree' | 'raw' | 'formatted';
export type Theme = 'light' | 'dark' | 'auto';
export type SubscriptionStatus = 'free' | 'active' | 'expired' | 'cancelled';

export interface AppState {
  currentFile: FileData | null;
  isProcessing: boolean;
  subscription: SubscriptionStatus;
  viewMode: ViewMode;
  theme: Theme;
}

export interface JsonState {
  originalData: any;
  editedData: any;
  hasChanges: boolean;
  searchQuery: string;
  expandedPaths: Set<string>;
}

export interface SubscriptionState {
  status: SubscriptionStatus;
  validUntil: Date | null;
  customerId: string | null;
  checkAccess: () => boolean;
}