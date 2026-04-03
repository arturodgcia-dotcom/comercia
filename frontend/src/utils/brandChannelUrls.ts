export type BrandChannelUrls = {
  landingInternalUrl: string;
  landingPreviewInternalUrl: string;
  publicUrl: string;
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
    distributorsUrl: `/store/${safeSlug}/distribuidores`,
    posPreviewUrl: `/templates/pos?tenant_slug=${encodeURIComponent(safeSlug)}`,
  };
}
