import { ComponentType } from "react";
import { StorefrontLandingPage } from "../pages/StorefrontLandingPage";
import { StorefrontPage } from "../pages/StorefrontPage";
import { StorefrontDistributorsPage } from "../pages/StorefrontDistributorsPage";

type ChannelTemplateComponent = ComponentType;

export function resolveLandingTemplate(templateId?: string): ChannelTemplateComponent {
  void templateId;
  return StorefrontLandingPage;
}

export function resolvePublicStoreTemplate(templateId?: string): ChannelTemplateComponent {
  void templateId;
  return StorefrontPage;
}

export function resolveDistributorStoreTemplate(templateId?: string): ChannelTemplateComponent {
  void templateId;
  return StorefrontDistributorsPage;
}
