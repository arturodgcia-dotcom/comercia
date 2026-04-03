export type BrandChannelUrls = {
  landingInternalUrl: string;
  landingPreviewInternalUrl: string;
  publicUrl: string;
  publicPreviewUrl: string;
  distributorsUrl: string;
  posPreviewUrl: string;
};

export function buildBrandChannelUrls(tenantSlug: string): BrandChannelUrls {
  const safeSlug = tenantSlug || "sin-slug";
  const landingInternalUrl = `/store/${safeSlug}/landing`;
  return {
    landingInternalUrl,
    landingPreviewInternalUrl: `${landingInternalUrl}?preview=1`,
    publicUrl: `/store/${safeSlug}`,
    publicPreviewUrl: `/store/${safeSlug}?preview=1`,
    distributorsUrl: `/store/${safeSlug}/distribuidores`,
    posPreviewUrl: `/templates/pos?tenant_slug=${encodeURIComponent(safeSlug)}`,
  };
}
