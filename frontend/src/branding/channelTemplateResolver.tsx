import { ComponentType } from "react";
import { StorefrontLandingPage } from "../pages/StorefrontLandingPage";
import { StorefrontPage } from "../pages/StorefrontPage";
import { StorefrontDistributorsPage } from "../pages/StorefrontDistributorsPage";
import {
  OFFICIAL_DISTRIBUTOR_STORE_TEMPLATE,
  OFFICIAL_LANDING_TEMPLATE,
  OFFICIAL_PUBLIC_STORE_TEMPLATE,
} from "./officialChannelTemplates";

type ChannelTemplateComponent = ComponentType;

export function resolveLandingTemplate(templateId?: string): ChannelTemplateComponent {
  switch ((templateId ?? "").trim()) {
    case OFFICIAL_LANDING_TEMPLATE:
    default:
      return StorefrontLandingPage;
  }
}

export function resolvePublicStoreTemplate(templateId?: string): ChannelTemplateComponent {
  switch ((templateId ?? "").trim()) {
    case OFFICIAL_PUBLIC_STORE_TEMPLATE:
    default:
      return StorefrontPage;
  }
}

export function resolveDistributorStoreTemplate(templateId?: string): ChannelTemplateComponent {
  switch ((templateId ?? "").trim()) {
    case OFFICIAL_DISTRIBUTOR_STORE_TEMPLATE:
    default:
      return StorefrontDistributorsPage;
  }
}
