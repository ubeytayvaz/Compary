export interface ExtractedPolicyData {
  companyName: string;
  policyType: string;
  premiumAmount: number;
  currency: string;
  coverageAmount: string; // Bedel
  deductible: string; // Muafiyet
  limits: string[]; // Ana limitler
  pros: string[]; // Avantajlar
  cons: string[]; // Eksikler/Dikkat edilmesi gerekenler
}

export interface ComparisonResult {
  policies: ExtractedPolicyData[];
  summary: string;
}

export interface FileWithPreview {
  file: File;
  id: string;
  previewUrl?: string;
}
