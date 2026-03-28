import { ChangeEvent } from "react";
import { useTranslation } from "react-i18next";

export function LanguageSelector() {
  const { i18n } = useTranslation();

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    i18n.changeLanguage(value);
    localStorage.setItem("comercia_lang", value);
  };

  return (
    <select value={i18n.language} onChange={handleChange} className="input-inline">
      <option value="es">ES</option>
      <option value="en">EN</option>
    </select>
  );
}
