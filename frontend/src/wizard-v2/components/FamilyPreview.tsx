import { ReactNode } from "react";
import { WizardV2BusinessModel, WizardV2Channel, WizardV2FamilyId } from "../types";

type FamilyPreviewProps = {
  familyId: WizardV2FamilyId;
  channel: WizardV2Channel;
  brandName: string;
  businessModel: WizardV2BusinessModel;
};

const FAMILY_COLORS: Record<WizardV2FamilyId, { primary: string; secondary: string; soft: string }> = {
  food_premium_delivery: { primary: "#9a2f12", secondary: "#ff8e3c", soft: "#fff2ea" },
  healthy_products: { primary: "#0f6a4a", secondary: "#52c796", soft: "#e9fbf2" },
  barber_booking: { primary: "#181818", secondary: "#7f5af0", soft: "#f4efff" },
  fashion_premium: { primary: "#21295c", secondary: "#7f8dff", soft: "#eef1ff" },
  clinic_trust: { primary: "#0c6262", secondary: "#3bc1be", soft: "#eafcfc" },
  distributor_empire: { primary: "#1f365a", secondary: "#5b89d6", soft: "#edf4ff" },
};

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
  if (channel === "public_store") return <p style={{ margin: 0 }}>Catalogo orientado a compra empresarial y abastecimiento recurrente.</p>;
  if (channel === "distributor_store") return <p style={{ margin: 0 }}>Portal B2B con escalas de precio, beneficios y recompra.</p>;
  return <p style={{ margin: 0 }}>WebApp para operacion de pedidos mayoreo, cartera y seguimiento de rutas.</p>;
}

export function FamilyPreview({ familyId, channel, brandName, businessModel }: FamilyPreviewProps) {
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
