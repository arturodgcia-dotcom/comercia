import { ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { useMarket } from "../app/MarketContext";
import { MarketKey, MARKETS } from "../config/markets";

export function LanguageSelector() {
  const { i18n, t } = useTranslation();
  const { market, setMarket } = useMarket();

  const handleLanguageChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    i18n.changeLanguage(value);
    localStorage.setItem("comercia_lang", value);
  };

  const handleMarketChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setMarket(event.target.value as MarketKey);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <label style={{ fontSize: "11px", color: "#b8cae9", marginBottom: "2px" }}>
        {t("nav.language")}
      </label>
      <select value={i18n.language} onChange={handleLanguageChange} className="input-inline">
        <option value="es">Español</option>
        <option value="en">English</option>
        <option value="pt">Português</option>
      </select>
      <label style={{ fontSize: "11px", color: "#b8cae9", marginTop: "6px", marginBottom: "2px" }}>
        {t("market.label")}
      </label>
      <select value={market.key} onChange={handleMarketChange} className="input-inline">
        {(Object.keys(MARKETS) as MarketKey[]).map((key) => (
          <option key={key} value={key}>
            {t(`market.${key === "spain" ? "spain" : key === "latam" ? "latam" : key === "europe" ? "europe" : "mexico"}`)}
          </option>
        ))}
      </select>
    </div>
  );
}
