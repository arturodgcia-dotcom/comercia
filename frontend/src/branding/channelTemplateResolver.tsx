import { ComponentType } from "react";
import { StorefrontPayload } from "../types/domain";
import { resolveTemplateForChannel } from "../templates";

type ChannelTemplateComponent = ComponentType;

export function resolveLandingTemplate(templateId: string | undefined, payload: StorefrontPayload | null): ChannelTemplateComponent {
  return resolveTemplateForChannel(payload, "landing", templateId).component;
}

export function resolvePublicStoreTemplate(templateId: string | undefined, payload: StorefrontPayload | null): ChannelTemplateComponent {
  return resolveTemplateForChannel(payload, "public_store", templateId).component;
}

export function resolveDistributorStoreTemplate(templateId: string | undefined, payload: StorefrontPayload | null): ChannelTemplateComponent {
  return resolveTemplateForChannel(payload, "distributor_store", templateId).component;
}

export function resolveWebappTemplate(templateId: string | undefined, payload: StorefrontPayload | null): ChannelTemplateComponent {
  return resolveTemplateForChannel(payload, "webapp", templateId).component;
}
