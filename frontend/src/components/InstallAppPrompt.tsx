import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function isStandaloneMode(): boolean {
  return window.matchMedia("(display-mode: standalone)").matches || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export function InstallAppPrompt({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState<boolean>(isStandaloneMode());
  const [dismissed, setDismissed] = useState<boolean>(localStorage.getItem("comercia_install_dismissed") === "1");

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setInstalled(true);
      setDeferredPrompt(null);
      return;
    }
    setDismissed(true);
    localStorage.setItem("comercia_install_dismissed", "1");
  };

  if (installed) {
    return <p className="install-note">{t("install.installed")}</p>;
  }
  if (!deferredPrompt || dismissed) {
    return null;
  }

  return (
    <div className={compact ? "install-card compact" : "install-card"}>
      <p>{t("install.prompt")}</p>
      <div className="row-gap">
        <button type="button" className="button" onClick={install}>
          {t("install.installBtn")}
        </button>
        <button
          type="button"
          className="button button-outline"
          onClick={() => {
            setDismissed(true);
            localStorage.setItem("comercia_install_dismissed", "1");
          }}
        >
          {t("install.notNow")}
        </button>
      </div>
    </div>
  );
}
