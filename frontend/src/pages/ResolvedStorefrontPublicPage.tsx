import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { resolvePublicStoreTemplate } from "../branding/channelTemplateResolver";
import {
  OFFICIAL_CHANNEL_TEMPLATE_DEFAULTS,
  resolveOfficialChannelTemplatesFromConfig,
} from "../branding/officialChannelTemplates";
import { api } from "../services/api";

export function ResolvedStorefrontPublicPage() {
  const { tenantSlug } = useParams();
  const [templateId, setTemplateId] = useState(OFFICIAL_CHANNEL_TEMPLATE_DEFAULTS.public_store_template);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantSlug) {
      setLoading(false);
      return;
    }
    setLoading(true);
    api
      .getStorefront(tenantSlug)
      .then((payload) => {
        const templates = resolveOfficialChannelTemplatesFromConfig(payload.storefront_config?.config_json);
        setTemplateId(templates.public_store_template);
      })
      .catch(() => {
        setTemplateId(OFFICIAL_CHANNEL_TEMPLATE_DEFAULTS.public_store_template);
      })
      .finally(() => setLoading(false));
  }, [tenantSlug]);

  if (loading) return <p>Cargando ecommerce público oficial...</p>;
  const ResolvedTemplate = resolvePublicStoreTemplate(templateId);
  return <ResolvedTemplate />;
}
