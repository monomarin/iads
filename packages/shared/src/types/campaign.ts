export type CampaignStatus = "draft" | "active" | "paused" | "completed" | "cancelled";
export type VariantRole = "control" | "variant_a" | "variant_b" | "variant_c" | "variant_d" | "variant_e";

export interface Campaign {
  id: string;
  tenantId: string;
  storeId: string;
  name: string;
  status: CampaignStatus;
  startDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AudioVariant {
  id: string;
  campaignId: string;
  role: VariantRole;
  audioUrl: string;
  script: string;
  weight: number; // 0-100 for A/B testing distribution
  createdAt: string;
}
