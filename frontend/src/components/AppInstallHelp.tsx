import { useTranslation } from "react-i18next";

function isIOS() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function isAndroid() {
  return /android/i.test(window.navigator.userAgent);
}

export function AppInstallHelp({ context = "POS" }: { context?: string }) {
  const { t } = useTranslation();
  const standalone = window.matchMedia("(display-mode: standalone)").matches;
  if (standalone) return null;

  if (isIOS()) {
    return (
      <div className="install-help">
        <p><strong>{t("install.iosTitle")}</strong> {t("install.iosSteps")}</p>
        <p>{t("install.iosHint", { context })}</p>
      </div>
    );
  }

  if (isAndroid()) {
    return (
      <div className="install-help">
        <p><strong>{t("install.androidTitle")}</strong> {t("install.androidSteps")}</p>
        <p>{t("install.androidHint", { context })}</p>
      </div>
    );
  }

  return (
    <div className="install-help">
      <p>{t("install.genericHint")}</p>
    </div>
  );
}
