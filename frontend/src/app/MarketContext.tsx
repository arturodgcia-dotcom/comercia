import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import i18n from "../i18n";
import { DEFAULT_MARKET, MarketConfig, MarketKey, MARKETS, MARKET_STORAGE_KEY } from "../config/markets";

interface MarketContextValue {
  market: MarketConfig;
  setMarket: (key: MarketKey) => void;
  formatCurrency: (amount: number) => string;
}

const MarketContext = createContext<MarketContextValue | undefined>(undefined);

export function MarketProvider({ children }: { children: ReactNode }) {
  const [marketKey, setMarketKey] = useState<MarketKey>(() => {
    const saved = localStorage.getItem(MARKET_STORAGE_KEY) as MarketKey | null;
    return saved && MARKETS[saved] ? saved : DEFAULT_MARKET;
  });

  const market = MARKETS[marketKey];

  useEffect(() => {
    // Only change language if the user hasn't manually overridden it
    const savedLang = localStorage.getItem("comercia_lang");
    if (!savedLang) {
      i18n.changeLanguage(market.defaultLanguage);
    }
  }, [market]);

  const setMarket = (key: MarketKey) => {
    localStorage.setItem(MARKET_STORAGE_KEY, key);
    setMarketKey(key);
    // Change language to market default and persist it
    i18n.changeLanguage(MARKETS[key].defaultLanguage);
    localStorage.setItem("comercia_lang", MARKETS[key].defaultLanguage);
  };

  const formatCurrency = (amount: number) => {
    try {
      return new Intl.NumberFormat(market.locale, {
        style: "currency",
        currency: market.currency,
        minimumFractionDigits: 2,
      }).format(amount);
    } catch {
      return `${market.currencySymbol}${amount.toFixed(2)}`;
    }
  };

  return (
    <MarketContext.Provider value={{ market, setMarket, formatCurrency }}>
      {children}
    </MarketContext.Provider>
  );
}

export function useMarket() {
  const ctx = useContext(MarketContext);
  if (!ctx) throw new Error("useMarket must be used inside MarketProvider");
  return ctx;
}
