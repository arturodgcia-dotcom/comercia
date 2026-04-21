import { ComponentType } from "react";
import { StorefrontPayload } from "../types/domain";
import { resolveTemplateForChannel } from "../templates";
import { isWizardV2TemplateId, resolveWizardV2RuntimeComponent } from "../wizard-v2/runtime";

type ChannelTemplateComponent = ComponentType;
type TemplateRuntime = ReturnType<typeof resolveTemplateForChannel>;

export function resolveLandingTemplateRuntime(templateId: string | undefined, payload: StorefrontPayload | null): TemplateRuntime {
  if (templateId && isWizardV2TemplateId(templateId)) {
    const fallback = resolveTemplateForChannel(payload, "landing");
    return {
      component: resolveWizardV2RuntimeComponent(templateId, "landing", payload),
      resolved: fallback.resolved,
    };
  }
  return resolveTemplateForChannel(payload, "landing", templateId);
}

export function resolveLandingTemplate(templateId: string | undefined, payload: StorefrontPayload | null): ChannelTemplateComponent {
  return resolveLandingTemplateRuntime(templateId, payload).component;
}

export function resolvePublicStoreTemplate(templateId: string | undefined, payload: StorefrontPayload | null): ChannelTemplateComponent {
  if (templateId && isWizardV2TemplateId(templateId)) {
    return resolveWizardV2RuntimeComponent(templateId, "public_store", payload);
  }
  return resolveTemplateForChannel(payload, "public_store", templateId).component;
}

export function resolveDistributorStoreTemplate(templateId: string | undefined, payload: StorefrontPayload | null): ChannelTemplateComponent {
  if (templateId && isWizardV2TemplateId(templateId)) {
    return resolveWizardV2RuntimeComponent(templateId, "distributor_store", payload);
  }
  return resolveTemplateForChannel(payload, "distributor_store", templateId).component;
}

export function resolveWebappTemplate(templateId: string | undefined, payload: StorefrontPayload | null): ChannelTemplateComponent {
  if (templateId && isWizardV2TemplateId(templateId)) {
    return resolveWizardV2RuntimeComponent(templateId, "webapp", payload);
  }
  return resolveTemplateForChannel(payload, "webapp", templateId).component;
}
