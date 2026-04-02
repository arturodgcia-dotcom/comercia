export type MarketKey = "mx" | "latam" | "europe" | "spain";

export interface MarketConfig {
  key: MarketKey;
  name: string;
  defaultLanguage: "es" | "en" | "pt";
  currency: "MXN" | "USD" | "EUR";
  currencySymbol: string;
  locale: string;
}

export const MARKETS: Record<MarketKey, MarketConfig> = {
  mx: {
    key: "mx",
    name: "México",
    defaultLanguage: "es",
    currency: "MXN",
    currencySymbol: "$",
    locale: "es-MX",
  },
  latam: {
    key: "latam",
    name: "Latinoamérica",
    defaultLanguage: "es",
    currency: "USD",
    currencySymbol: "$",
    locale: "es-419",
  },
  europe: {
    key: "europe",
    name: "Europa",
    defaultLanguage: "en",
    currency: "EUR",
    currencySymbol: "€",
    locale: "en-EU",
  },
  spain: {
    key: "spain",
    name: "España",
    defaultLanguage: "es",
    currency: "EUR",
    currencySymbol: "€",
    locale: "es-ES",
  },
};

export const MARKET_STORAGE_KEY = "comercia_market";
export const DEFAULT_MARKET: MarketKey = "mx";
