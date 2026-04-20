import { StorefrontDistributorsPage } from "../../pages/StorefrontDistributorsPage";
import { StorefrontLandingPage } from "../../pages/StorefrontLandingPage";
import { StorefrontPage } from "../../pages/StorefrontPage";
import { TemplateBusinessModel, TemplateChannel, TemplateSector, TemplateStyle } from "./types";
import { SECTOR_CATALOG } from "../sectors/sectorCatalog";

function WebappPreview({
  sector,
  style,
  brandName,
  primary,
  secondary,
}: {
  sector: TemplateSector;
  style: TemplateStyle;
  brandName: string;
  primary: string;
  secondary: string;
}) {
  return (
    <article
      style={{
        borderRadius: "16px",
        padding: "1rem",
        background: "#0f172a",
        color: "#f8fafc",
        boxShadow: "0 16px 30px rgba(2,6,23,0.35)",
      }}
    >
      <p style={{ margin: 0, textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "0.75rem" }}>
        Preview webapp | {sector} | {style}
      </p>
      <h3 style={{ margin: "0.35rem 0 0" }}>Operacion comercial de {brandName}</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "0.65rem", marginTop: "0.75rem" }}>
        <div style={{ border: `1px solid ${primary}`, borderRadius: "12px", padding: "0.65rem" }}>
          <strong>Ventas hoy</strong>
          <p style={{ margin: "0.3rem 0 0" }}>$18,420 MXN</p>
        </div>
        <div style={{ border: `1px solid ${secondary}`, borderRadius: "12px", padding: "0.65rem" }}>
          <strong>Tickets</strong>
          <p style={{ margin: "0.3rem 0 0" }}>14 activos</p>
        </div>
        <div style={{ border: "1px solid #38bdf8", borderRadius: "12px", padding: "0.65rem" }}>
          <strong>Operacion</strong>
          <p style={{ margin: "0.3rem 0 0" }}>Cierres por turno</p>
        </div>
      </div>
    </article>
  );
}

export function buildSectorChannelComponent({
  channel,
  sector,
  style,
  businessModel,
  businessGoal,
  brandName,
  primaryOverride,
  secondaryOverride,
  heroTitle,
  heroSubtitle,
}: {
  channel: TemplateChannel;
  sector: TemplateSector;
  style: TemplateStyle;
  businessModel: TemplateBusinessModel;
  businessGoal: string;
  brandName: string;
  primaryOverride?: string | null;
  secondaryOverride?: string | null;
  heroTitle?: string | null;
  heroSubtitle?: string | null;
}) {
  const meta = SECTOR_CATALOG[sector];
  const primary = primaryOverride?.trim() || meta.theme.accent;
  const secondary = secondaryOverride?.trim() || meta.theme.secondary;
  const ctaPrimary = meta.theme.ctaPrimary;
  const ctaSecondary = meta.theme.ctaSecondary;
  const banners = meta.banners[channel];
  const businessCopy = meta.businessCopy[businessModel];

  return function SectorChannelComponent() {
    return (
      <section style={{ background: `radial-gradient(circle at 10% 0%, ${meta.theme.soft}, #ffffff 60%)`, paddingBottom: "1rem" }}>
        <header
          style={{
            margin: "0.75rem",
            borderRadius: "18px",
            padding: "1.1rem",
            color: "#fff",
            background: `linear-gradient(125deg, ${primary}, ${secondary})`,
            boxShadow: "0 18px 36px rgba(0,0,0,0.22)",
          }}
        >
          <p style={{ margin: 0, textTransform: "uppercase", fontSize: "0.78rem", letterSpacing: "0.08em" }}>
            {meta.theme.label} | {channel.replace(/_/g, " ")} | estilo {style}
          </p>
          <h1 style={{ margin: "0.35rem 0 0" }}>{heroTitle?.trim() || `${brandName} con familia visual premium por canal`}</h1>
          <p style={{ margin: "0.35rem 0 0", maxWidth: 920 }}>
            {heroSubtitle?.trim() || `Experiencia comercial pensada para ${meta.theme.vibe}.`}
          </p>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.6rem" }}>
            <span style={{ background: "rgba(255,255,255,0.16)", padding: "0.25rem 0.6rem", borderRadius: "999px" }}>{ctaPrimary}</span>
            <span style={{ background: "rgba(255,255,255,0.16)", padding: "0.25rem 0.6rem", borderRadius: "999px" }}>{ctaSecondary}</span>
            <span style={{ background: "rgba(255,255,255,0.16)", padding: "0.25rem 0.6rem", borderRadius: "999px" }}>{businessCopy.badge}</span>
            <span style={{ background: "rgba(255,255,255,0.16)", padding: "0.25rem 0.6rem", borderRadius: "999px" }}>Objetivo: {businessGoal}</span>
          </div>
          <p style={{ margin: "0.45rem 0 0" }}>{businessCopy.argument}</p>
        </header>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.7rem", margin: "0.75rem" }}>
          {banners.map((banner) => (
            <article
              key={banner}
              style={{
                borderRadius: "14px",
                border: `1px solid ${primary}`,
                background: "#fff",
                padding: "0.75rem",
                boxShadow: "0 10px 24px rgba(0,0,0,0.08)",
              }}
            >
              <p style={{ margin: 0, fontSize: "0.75rem", textTransform: "uppercase", color: primary }}>Banner sectorial</p>
              <h3 style={{ margin: "0.35rem 0 0", fontSize: "1.04rem" }}>{banner}</h3>
              <p style={{ margin: "0.45rem 0 0", fontSize: "0.85rem" }}>{businessCopy.cta}</p>
            </article>
          ))}
        </section>

        <div style={{ margin: "0.75rem" }}>
          {channel === "landing" ? <StorefrontLandingPage /> : null}
          {channel === "public_store" ? <StorefrontPage /> : null}
          {channel === "distributor_store" ? <StorefrontDistributorsPage /> : null}
          {channel === "webapp" ? (
            <WebappPreview sector={sector} style={style} brandName={brandName} primary={primary} secondary={secondary} />
          ) : null}
        </div>
      </section>
    );
  };
}
