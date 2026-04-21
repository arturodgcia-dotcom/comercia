import { ReactNode } from "react";
import { WizardV2BusinessModel, WizardV2Channel, WizardV2FamilyId } from "../types";

type FamilyPreviewProps = {
  familyId: WizardV2FamilyId;
  channel: WizardV2Channel;
  brandName: string;
  businessModel: WizardV2BusinessModel;
};

const FAMILY_COLORS: Record<WizardV2FamilyId, { primary: string; secondary: string; soft: string }> = {
  industrial_heavy_sales: { primary: "#1a3a5f", secondary: "#ff9f1c", soft: "#edf4fb" },
  food_premium_delivery: { primary: "#9a2f12", secondary: "#ff8e3c", soft: "#fff2ea" },
  healthy_products: { primary: "#0f6a4a", secondary: "#52c796", soft: "#e9fbf2" },
  barber_booking: { primary: "#181818", secondary: "#7f5af0", soft: "#f4efff" },
  fashion_premium: { primary: "#21295c", secondary: "#7f8dff", soft: "#eef1ff" },
  clinic_trust: { primary: "#0c6262", secondary: "#3bc1be", soft: "#eafcfc" },
  distributor_empire: { primary: "#1f365a", secondary: "#5b89d6", soft: "#edf4ff" },
};

const INDUSTRIAL_ASSETS = {
  hero: "/client-assets/todoindustrialmx/hero_baleros_caliper.jpg",
  heroBelts: "/client-assets/todoindustrialmx/hero_bandas_black_gold.png",
  timken: "/client-assets/todoindustrialmx/brand_timken_banner.jpg",
  workshop: "/client-assets/todoindustrialmx/catalogo_taller_baleros.png",
  belt: "/client-assets/todoindustrialmx/producto_banda_polyv.png",
  coupling: "/client-assets/todoindustrialmx/producto_acople_rojo.png",
  pump: "/client-assets/todoindustrialmx/producto_bomba_naranja.jpg",
  zsg: "/client-assets/todoindustrialmx/logo_zsg.jpg",
  skf: "/client-assets/todoindustrialmx/logo_skf.jpg",
  fag: "/client-assets/todoindustrialmx/logo_fag.png",
  fulo: "/client-assets/todoindustrialmx/logo_fulo.png",
  timkenLogo: "/client-assets/todoindustrialmx/logo_timken.png",
} as const;

function modelBadge(model: WizardV2BusinessModel): string {
  return model === "commission_based" ? "Con comision" : "Sin comision";
}

function frame(title: string, familyId: WizardV2FamilyId, model: WizardV2BusinessModel, children: ReactNode) {
  const palette = FAMILY_COLORS[familyId];
  return (
    <article
      style={{
        borderRadius: 22,
        padding: 18,
        border: `1px solid ${palette.secondary}44`,
        background: `linear-gradient(165deg, ${palette.soft} 0%, #ffffff 65%)`,
        boxShadow: "0 18px 34px rgba(10,18,40,0.1)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <strong style={{ color: palette.primary }}>{title}</strong>
        <span style={{ fontSize: 12, borderRadius: 999, padding: "2px 8px", background: palette.primary, color: "#fff" }}>{modelBadge(model)}</span>
      </div>
      {children}
    </article>
  );
}

function foodLayout(channel: WizardV2Channel, brandName: string) {
  if (channel === "landing") {
    return (
      <>
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 10 }}>
          <div style={{ background: "#fff", borderRadius: 14, padding: 12 }}>
            <h3 style={{ margin: 0 }}>{brandName} Delivery Premium</h3>
            <p style={{ margin: "8px 0 0", fontSize: 14 }}>SEO/AEO con FAQ de tiempos, zonas y promociones por horario.</p>
          </div>
          <div style={{ background: "#9a2f12", color: "#fff", borderRadius: 14, padding: 12 }}>
            <p style={{ margin: 0 }}>Combo destacado + CTA pedir ahora</p>
          </div>
        </div>
        <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 8 }}>
          {"Combos,Ingredientes,Entrega 30 min".split(",").map((item) => <div key={item} style={{ background: "#fff", borderRadius: 10, padding: 10 }}>{item}</div>)}
        </div>
      </>
    );
  }
  if (channel === "webapp") {
    return <p style={{ margin: 0 }}>Vista operativa: tickets de cocina, repartidores y tiempos por pedido.</p>;
  }
  if (channel === "public_store") {
    return (
      <>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 8 }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: 10 }}>Carril: Favoritos del chef</div>
          <div style={{ background: "#fff", borderRadius: 12, padding: 10 }}>Carril: Combos familiares</div>
        </div>
        <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
          {"Entrega 30 min,Promos nocturnas,Add-ons".split(",").map((item) => (
            <span key={item} style={{ background: "#fff", borderRadius: 999, padding: "3px 8px", fontSize: 12 }}>
              {item}
            </span>
          ))}
        </div>
      </>
    );
  }
  return (
    <>
      <div style={{ background: "#fff", borderRadius: 12, padding: 10 }}>
        Portal distribuidor: escalas por volumen y regla de recompra semanal.
      </div>
      <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 8 }}>
        {"Caja 12, Caja 24, Caja 48".split(",").map((item) => (
          <div key={item} style={{ background: "#fff", borderRadius: 10, padding: 10 }}>
            {item}
          </div>
        ))}
      </div>
    </>
  );
}

function healthyLayout(channel: WizardV2Channel, brandName: string) {
  if (channel === "landing") {
    return (
      <>
        <div style={{ borderRadius: 16, padding: 14, background: "#fff" }}>
          <h3 style={{ margin: 0 }}>{brandName} Healthy Products</h3>
          <p style={{ margin: "8px 0 0", fontSize: 14 }}>Landing orientada a intencion de busqueda: objetivos, ingredientes y beneficios.</p>
        </div>
        <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
          {"FAQ nutricion,Schema Store,Respuestas rapidas".split(",").map((item) => <span key={item} style={{ background: "#fff", borderRadius: 999, padding: "3px 8px", fontSize: 12 }}>{item}</span>)}
        </div>
      </>
    );
  }
  if (channel === "public_store") {
    return (
      <>
        <div style={{ background: "#fff", borderRadius: 12, padding: 10 }}>
          Ecommerce premium por objetivo: energia, control y bienestar.
        </div>
        <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 8 }}>
          {"Proteina,Limpieza,Inmunidad".split(",").map((item) => (
            <div key={item} style={{ background: "#fff", borderRadius: 10, padding: 10 }}>
              {item}
            </div>
          ))}
        </div>
      </>
    );
  }
  if (channel === "distributor_store") {
    return (
      <>
        <div style={{ background: "#fff", borderRadius: 12, padding: 10 }}>
          Canal distribuidor con packs business y precios por pallet saludable.
        </div>
        <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div style={{ background: "#fff", borderRadius: 10, padding: 10 }}>Nivel Bronze: 8%</div>
          <div style={{ background: "#fff", borderRadius: 10, padding: 10 }}>Nivel Gold: 15%</div>
        </div>
      </>
    );
  }
  return <p style={{ margin: 0 }}>WebApp para pedidos recurrentes, suscripcion y alertas de stock.</p>;
}

function barberLayout(channel: WizardV2Channel, brandName: string) {
  if (channel === "landing") {
    return (
      <>
        <div style={{ background: "#181818", color: "#fff", borderRadius: 16, padding: 14 }}>
          <h3 style={{ margin: 0 }}>{brandName} Barber Booking</h3>
          <p style={{ margin: "8px 0 0", fontSize: 14 }}>Hero con agenda inmediata, estilos y testimonios de confianza.</p>
        </div>
        <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div style={{ background: "#fff", borderRadius: 10, padding: 10 }}>SEO local por colonia</div>
          <div style={{ background: "#fff", borderRadius: 10, padding: 10 }}>AEO: cortes, precios y disponibilidad</div>
        </div>
      </>
    );
  }
  if (channel === "webapp") {
    return <p style={{ margin: 0 }}>WebApp de turnos por barbero, caja rapida y control diario.</p>;
  }
  if (channel === "public_store") {
    return (
      <>
        <div style={{ background: "#fff", borderRadius: 12, padding: 10 }}>Reservas premium por servicio y horario.</div>
        <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 8 }}>
          {"Fade,Barba VIP,Tratamiento".split(",").map((item) => (
            <div key={item} style={{ background: "#fff", borderRadius: 10, padding: 10 }}>
              {item}
            </div>
          ))}
        </div>
      </>
    );
  }
  return (
    <>
      <div style={{ background: "#fff", borderRadius: 12, padding: 10 }}>
        Canal corporativo: vouchers, membresias y convenios para equipos.
      </div>
      <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div style={{ background: "#fff", borderRadius: 10, padding: 10 }}>Empresa 20 cortes/mes</div>
        <div style={{ background: "#fff", borderRadius: 10, padding: 10 }}>Convenio sucursal</div>
      </div>
    </>
  );
}

function fashionLayout(channel: WizardV2Channel, brandName: string) {
  if (channel === "landing") {
    return (
      <>
        <div style={{ borderRadius: 16, padding: 14, background: "#fff" }}>
          <h3 style={{ margin: 0 }}>{brandName} Fashion Premium</h3>
          <p style={{ margin: "8px 0 0", fontSize: 14 }}>Storytelling visual tipo revista con SEO de intencion de colecciones.</p>
        </div>
        <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 8 }}>
          {"Drop limitado,Lookbook,Tendencia".split(",").map((item) => <div key={item} style={{ background: "#fff", borderRadius: 10, padding: 10 }}>{item}</div>)}
        </div>
      </>
    );
  }
  if (channel === "webapp") return <p style={{ margin: 0 }}>WebApp de inventario por talla, ventas asistidas y alertas de reposicion.</p>;
  if (channel === "public_store") {
    return (
      <>
        <div style={{ background: "#fff", borderRadius: 12, padding: 10 }}>Ecommerce editorial con drops, wishlist y upsell de look completo.</div>
        <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 8 }}>
          <div style={{ background: "#fff", borderRadius: 10, padding: 10 }}>Coleccion Studio</div>
          <div style={{ background: "#fff", borderRadius: 10, padding: 10 }}>Coleccion Street</div>
        </div>
      </>
    );
  }
  return (
    <>
      <div style={{ background: "#fff", borderRadius: 12, padding: 10 }}>Portal distribuidor de temporadas y preventa por volumen.</div>
      <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 8 }}>
        {"Pack 50,Pack 100,Pack 200".split(",").map((item) => (
          <div key={item} style={{ background: "#fff", borderRadius: 10, padding: 10 }}>
            {item}
          </div>
        ))}
      </div>
    </>
  );
}

function clinicLayout(channel: WizardV2Channel, brandName: string) {
  if (channel === "landing") {
    return (
      <>
        <div style={{ borderRadius: 16, padding: 14, background: "#fff" }}>
          <h3 style={{ margin: 0 }}>{brandName} Clinic Trust</h3>
          <p style={{ margin: "8px 0 0", fontSize: 14 }}>Landing de confianza: especialidades, evidencia y respuestas AEO para pacientes.</p>
        </div>
        <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
          {"Schema MedicalOrganization,FAQ clinica,CTA reservar".split(",").map((item) => <span key={item} style={{ background: "#fff", borderRadius: 999, padding: "3px 8px", fontSize: 12 }}>{item}</span>)}
        </div>
      </>
    );
  }
  if (channel === "webapp") return <p style={{ margin: 0 }}>WebApp para agenda clinica, seguimiento y caja por consultorio.</p>;
  if (channel === "public_store") {
    return (
      <>
        <div style={{ background: "#fff", borderRadius: 12, padding: 10 }}>Servicios medicos y programas preventivos con conversion por especialidad.</div>
        <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 8 }}>
          <div style={{ background: "#fff", borderRadius: 10, padding: 10 }}>Chequeo integral</div>
          <div style={{ background: "#fff", borderRadius: 10, padding: 10 }}>Plan anual</div>
        </div>
      </>
    );
  }
  return (
    <>
      <div style={{ background: "#fff", borderRadius: 12, padding: 10 }}>Canal institucional para convenios de salud y volumen corporativo.</div>
      <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div style={{ background: "#fff", borderRadius: 10, padding: 10 }}>Convenio pyme</div>
        <div style={{ background: "#fff", borderRadius: 10, padding: 10 }}>Convenio empresarial</div>
      </div>
    </>
  );
}

function distributorLayout(channel: WizardV2Channel, brandName: string) {
  if (channel === "landing") {
    return (
      <>
        <div style={{ borderRadius: 16, padding: 14, background: "#1f365a", color: "#fff" }}>
          <h3 style={{ margin: 0 }}>{brandName} Distributor Empire</h3>
          <p style={{ margin: "8px 0 0", fontSize: 14 }}>Propuesta B2B: margen, cobertura y control comercial por plaza.</p>
        </div>
        <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div style={{ background: "#fff", borderRadius: 10, padding: 10 }}>FAQ de volumen y logistica</div>
          <div style={{ background: "#fff", borderRadius: 10, padding: 10 }}>CTA abrir cuenta comercial</div>
        </div>
      </>
    );
  }
  if (channel === "public_store") {
    return (
      <>
        <div style={{ background: "#fff", borderRadius: 12, padding: 10 }}>
          Catalogo empresarial con kits listos para recompra recurrente.
        </div>
        <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 8 }}>
          <div style={{ background: "#fff", borderRadius: 10, padding: 10 }}>Linea operativa</div>
          <div style={{ background: "#fff", borderRadius: 10, padding: 10 }}>Linea premium</div>
        </div>
      </>
    );
  }
  if (channel === "distributor_store") {
    return (
      <>
        <div style={{ background: "#fff", borderRadius: 12, padding: 10 }}>
          Portal B2B con escalas, margen por nivel y ordenes de alto volumen.
        </div>
        <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 8 }}>
          {"Nivel Silver,Nivel Gold,Nivel Platinum".split(",").map((item) => (
            <div key={item} style={{ background: "#fff", borderRadius: 10, padding: 10 }}>
              {item}
            </div>
          ))}
        </div>
      </>
    );
  }
  return <p style={{ margin: 0 }}>WebApp para operacion de pedidos mayoreo, cartera y seguimiento de rutas.</p>;
}

function industrialLayout(channel: WizardV2Channel, brandName: string) {
  if (channel === "landing") {
    return (
      <>
        <div style={{ display: "grid", gridTemplateColumns: "1.25fr 1fr", gap: 10 }}>
          <div style={{ borderRadius: 16, padding: 14, background: "#0f2237", color: "#fff" }}>
            <h3 style={{ margin: 0 }}>{brandName}</h3>
            <p style={{ margin: "8px 0 0", fontSize: 14 }}>Entregamos soluciones en transmision de potencia.</p>
            <p style={{ margin: "8px 0 0", fontSize: 13, opacity: 0.95 }}>Excelente calidad al mejor precio. Cobertura Mexico y Latinoamerica.</p>
            <p style={{ margin: "8px 0 0", fontSize: 12, display: "inline-block", borderRadius: 999, padding: "4px 10px", background: "#ffcf70", color: "#222" }}>
              Cliente Partner Estrategico
            </p>
            <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
              {"Cotizar ahora,Ver catalogo,WhatsApp 55-11791417".split(",").map((item) => (
                <span key={item} style={{ borderRadius: 999, padding: "3px 9px", background: "#ff9f1c", color: "#1d1d1d", fontSize: 12 }}>
                  {item}
                </span>
              ))}
            </div>
          </div>
          <img src={INDUSTRIAL_ASSETS.hero} alt="Baleros industriales y precision tecnica" style={{ width: "100%", borderRadius: 16, objectFit: "cover", minHeight: 150 }} />
        </div>
        <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 8 }}>
          {"Baleros,Chumaceras,Cadenas,Catarinas,Bandas,Acoples,Retenes,Lubricantes,Ferremateriales,Automotriz".split(",").slice(0, 6).map((item) => (
            <div key={item} style={{ background: "#fff", borderRadius: 10, padding: 10, border: "1px solid #d7e3f2" }}>
              {item}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 8, alignItems: "center" }}>
          {[INDUSTRIAL_ASSETS.zsg, INDUSTRIAL_ASSETS.skf, INDUSTRIAL_ASSETS.fag, INDUSTRIAL_ASSETS.timkenLogo].map((src) => (
            <div key={src} style={{ background: "#fff", borderRadius: 10, padding: 8, minHeight: 60, display: "grid", placeItems: "center" }}>
              <img src={src} alt="Marca distribuida" style={{ maxWidth: "100%", maxHeight: 42, objectFit: "contain" }} />
            </div>
          ))}
        </div>
      </>
    );
  }

  if (channel === "public_store") {
    return (
      <>
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 10 }}>
          <img src={INDUSTRIAL_ASSETS.workshop} alt="Catalogo industrial con baleros y refacciones" style={{ width: "100%", borderRadius: 14, objectFit: "cover", minHeight: 140 }} />
          <div style={{ background: "#fff", borderRadius: 14, padding: 12, border: "1px solid #d7e3f2" }}>
            <p style={{ margin: 0, fontWeight: 600 }}>Catalogo industrial masivo</p>
            <p style={{ margin: "6px 0 0", fontSize: 13 }}>Busqueda por SKU/marca/aplicacion + filtros robustos.</p>
            <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
              {"Pagar con Mercado Pago,Cotizar por WhatsApp,Novedades,Promociones".split(",").map((item) => (
                <span key={item} style={{ fontSize: 12, borderRadius: 999, padding: "3px 8px", background: "#e9f2ff", color: "#1a3a5f" }}>
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 8 }}>
          {[INDUSTRIAL_ASSETS.belt, INDUSTRIAL_ASSETS.coupling, INDUSTRIAL_ASSETS.pump].map((src) => (
            <img key={src} src={src} alt="Producto industrial destacado" style={{ width: "100%", borderRadius: 12, background: "#fff", border: "1px solid #d7e3f2", padding: 8 }} />
          ))}
        </div>
      </>
    );
  }

  if (channel === "distributor_store") {
    return (
      <>
        <div style={{ borderRadius: 16, padding: 12, background: "#102942", color: "#fff" }}>
          <p style={{ margin: 0, fontWeight: 600 }}>Portal B2B distribuidores</p>
          <p style={{ margin: "6px 0 0", fontSize: 13 }}>
            Precios por volumen, reorder rapido, solicitud de cotizacion, transferencia y anticipo por Mercado Pago.
          </p>
        </div>
        <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 8 }}>
          <img src={INDUSTRIAL_ASSETS.timken} alt="Linea industrial distribuida" style={{ width: "100%", borderRadius: 12, objectFit: "cover", minHeight: 120 }} />
          <div style={{ display: "grid", gap: 8 }}>
            {"Alta distribuidor,Solicitud mayoreo,Anticipo MP,Link de pago MP".split(",").map((item) => (
              <div key={item} style={{ background: "#fff", borderRadius: 10, padding: 9, border: "1px solid #d7e3f2" }}>
                {item}
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div style={{ background: "#fff", borderRadius: 14, padding: 12, border: "1px solid #d7e3f2" }}>
        WebApp/POS industrial: cotizacion rapida, mostrador, busqueda SKU/barcode, inventario y clientes frecuentes.
      </div>
      <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 8 }}>
        <div style={{ background: "#edf4fb", borderRadius: 10, padding: 10 }}>Cobro QR Mercado Pago + ticket interno</div>
        <div style={{ background: "#edf4fb", borderRadius: 10, padding: 10 }}>Point + conciliacion basica por canal</div>
      </div>
      <img src={INDUSTRIAL_ASSETS.heroBelts} alt="Bandas industriales para operacion" style={{ marginTop: 10, width: "100%", borderRadius: 12, objectFit: "cover", minHeight: 115 }} />
    </>
  );
}

export function FamilyPreview({ familyId, channel, brandName, businessModel }: FamilyPreviewProps) {
  if (familyId === "industrial_heavy_sales") {
    return frame(`Industrial Heavy Sales | ${channel}`, familyId, businessModel, industrialLayout(channel, brandName));
  }
  if (familyId === "food_premium_delivery") {
    return frame(`Food Premium Delivery | ${channel}`, familyId, businessModel, foodLayout(channel, brandName));
  }
  if (familyId === "healthy_products") {
    return frame(`Healthy Products | ${channel}`, familyId, businessModel, healthyLayout(channel, brandName));
  }
  if (familyId === "barber_booking") {
    return frame(`Barber Booking | ${channel}`, familyId, businessModel, barberLayout(channel, brandName));
  }
  if (familyId === "fashion_premium") {
    return frame(`Fashion Premium | ${channel}`, familyId, businessModel, fashionLayout(channel, brandName));
  }
  if (familyId === "clinic_trust") {
    return frame(`Clinic Trust | ${channel}`, familyId, businessModel, clinicLayout(channel, brandName));
  }
  if (familyId === "distributor_empire") {
    return frame(`Distributor Empire | ${channel}`, familyId, businessModel, distributorLayout(channel, brandName));
  }
  return frame(`Preview ${channel}`, familyId, businessModel, <p style={{ margin: 0 }}>Familia en siguiente bloque.</p>);
}
