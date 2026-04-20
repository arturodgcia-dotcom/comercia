import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { resolveLandingTemplateRuntime } from "../branding/channelTemplateResolver";
import {
  OFFICIAL_CHANNEL_TEMPLATE_DEFAULTS,
  resolveOfficialChannelTemplatesFromConfig,
} from "../branding/officialChannelTemplates";
import { api } from "../services/api";
import { StorefrontPayload } from "../types/domain";

export function ResolvedStorefrontLandingPage() {
  const { tenantSlug } = useParams();
  const [templateId, setTemplateId] = useState(OFFICIAL_CHANNEL_TEMPLATE_DEFAULTS.landing_template);
  const [payload, setPayload] = useState<StorefrontPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantSlug) {
      setLoading(false);
      return;
    }
    setLoading(true);
    api
      .getStorefront(tenantSlug)
      .then((response) => {
        setPayload(response);
        const templates = resolveOfficialChannelTemplatesFromConfig(response.storefront_config?.config_json);
        setTemplateId(templates.landing_template);
      })
      .catch(() => {
        setPayload(null);
        setTemplateId(OFFICIAL_CHANNEL_TEMPLATE_DEFAULTS.landing_template);
      })
      .finally(() => setLoading(false));
  }, [tenantSlug]);

  const runtime = resolveLandingTemplateRuntime(templateId, payload);
  const brandName = payload?.tenant.name ?? "Marca";
  const title = runtime.resolved.seo_profile.title_template.replace("{brandName}", brandName);
  const description = runtime.resolved.seo_profile.meta_description_template.replace("{brandName}", brandName);

  useEffect(() => {
    if (loading) return;
    document.title = title;
    let tag = document.querySelector("meta[name='description']");
    if (!tag) {
      tag = document.createElement("meta");
      tag.setAttribute("name", "description");
      document.head.appendChild(tag);
    }
    tag.setAttribute("content", description);
  }, [description, loading, title]);

  if (loading) return <p>Cargando landing oficial...</p>;

  const ResolvedTemplate = runtime.component;
  return <ResolvedTemplate />;
}
