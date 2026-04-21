import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { IndustrialMasterDistributorStore } from "../../templates/sectors/maquinaria/distributor_store/IndustrialMasterDistributorStore";
import { IndustrialMasterLanding } from "../../templates/sectors/maquinaria/landing/IndustrialMasterLanding";
import {
  INDUSTRIAL_MASTER_DEFAULT_BRAND,
  IndustrialMasterBrandConfig,
} from "../../templates/sectors/maquinaria/components/IndustrialMasterShared";
import { IndustrialMasterPublicStore } from "../../templates/sectors/maquinaria/public_store/IndustrialMasterPublicStore";
import { IndustrialMasterWebapp } from "../../templates/sectors/maquinaria/webapp/IndustrialMasterWebapp";
import "../../templates/sectors/maquinaria/components/IndustrialMaster.css";

type IndustrialMasterChannel = "landing" | "public_store" | "distributor_store" | "webapp";
const CHANNELS: IndustrialMasterChannel[] = ["landing", "public_store", "distributor_store", "webapp"];

const LABELS: Record<IndustrialMasterChannel, string> = {
  landing: "Landing",
  public_store: "Ecommerce publico",
  distributor_store: "Ecommerce distribuidores",
  webapp: "WebApp / POS",
};

function readChannel(raw: string | null): IndustrialMasterChannel {
  if (!raw) return "landing";
  if (CHANNELS.includes(raw as IndustrialMasterChannel)) return raw as IndustrialMasterChannel;
  return "landing";
}

export function MasterIndustrialTemplatePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const channel = readChannel(searchParams.get("channel"));

  const brand: IndustrialMasterBrandConfig = useMemo(
    () => ({
      ...INDUSTRIAL_MASTER_DEFAULT_BRAND,
      brandName: "Template Maestro Industrial",
    }),
    []
  );

  return (
    <main className="im-root">
      <section className="im-shell">
        <header className="im-header">
          <p className="im-chip">Bloque 1 · Plantilla maestra industrial</p>
          <h1 style={{ margin: 0 }}>Maquinaria / Industrial · Sistema maestro premium por canal</h1>
          <p style={{ margin: 0 }}>
            Preview de diseño maestro no conectado a runtime productivo. Se valida visualmente antes de activar marcas.
          </p>
          <div className="im-channel-nav">
            {CHANNELS.map((option) => (
              <button
                key={option}
                className={`im-channel-btn ${channel === option ? "active" : ""}`}
                type="button"
                onClick={() => setSearchParams({ channel: option })}
              >
                {LABELS[option]}
              </button>
            ))}
          </div>
        </header>

        {channel === "landing" ? <IndustrialMasterLanding brand={brand} /> : null}
        {channel === "public_store" ? <IndustrialMasterPublicStore brand={brand} /> : null}
        {channel === "distributor_store" ? <IndustrialMasterDistributorStore brand={brand} /> : null}
        {channel === "webapp" ? <IndustrialMasterWebapp brand={brand} /> : null}
      </section>
    </main>
  );
}

