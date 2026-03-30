function isIOS() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function isAndroid() {
  return /android/i.test(window.navigator.userAgent);
}

export function AppInstallHelp({ context = "POS" }: { context?: string }) {
  const standalone = window.matchMedia("(display-mode: standalone)").matches;
  if (standalone) return null;

  if (isIOS()) {
    return (
      <div className="install-help">
        <p><strong>Instalación iPhone/iPad:</strong> abre Compartir y toca "Agregar a pantalla de inicio".</p>
        <p>Recomendado para usar {context} como app de acceso rápido.</p>
      </div>
    );
  }

  if (isAndroid()) {
    return (
      <div className="install-help">
        <p><strong>Instalación Android:</strong> abre el menú del navegador y selecciona "Instalar app" o "Agregar a inicio".</p>
        <p>Así podrás abrir {context} en modo app (standalone).</p>
      </div>
    );
  }

  return (
    <div className="install-help">
      <p>Para instalar esta WebApp, usa la opción de tu navegador: "Instalar app" o "Agregar a pantalla de inicio".</p>
    </div>
  );
}
