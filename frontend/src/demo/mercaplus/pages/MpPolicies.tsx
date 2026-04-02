/* ═══════════════════════════════════════════════════════════
   MERCAPLUS — Políticas
   ═══════════════════════════════════════════════════════════ */

import { useState } from "react";
import { MP_BRAND } from "../data";

const POLICIES = [
  {
    id: "privacy",
    icon: "🔒",
    title: "Aviso de Privacidad",
    sections: [
      { heading: "Responsable del tratamiento", body: `${MP_BRAND.name} Demo, con domicilio en ${MP_BRAND.address}, es responsable del uso y protección de sus datos personales.` },
      { heading: "Datos que recopilamos", body: "Nombre, correo electrónico, teléfono, dirección de entrega, datos de facturación y preferencias de compra. Únicamente recopilamos los datos necesarios para proporcionar nuestros servicios." },
      { heading: "Finalidad", body: "Procesar pedidos, enviar confirmaciones, ofrecer soporte al cliente, mejorar nuestros servicios y, con su consentimiento, enviar comunicaciones promocionales." },
      { heading: "Derechos ARCO", body: "Usted tiene derecho a Acceder, Rectificar, Cancelar u Oponerse al uso de sus datos. Para ejercerlos contáctenos en: privacidad@mercaplus.demo" },
    ],
  },
  {
    id: "brand-internal",
    icon: "🏢",
    title: "Políticas internas de la marca",
    sections: [
      { heading: "Cumplimiento de marca", body: "Toda comunicación comercial debe respetar lineamientos de tono, servicio y calidad definidos por MercaPlus Demo. Los distribuidores autorizados deben usar materiales de marca vigentes." },
      { heading: "Operación comercial", body: "Las promociones por canal están sujetas a inventario y estrategia regional. El equipo comercial puede ajustar mínimos, condiciones y descuentos con aviso previo." },
      { heading: "Atención y SLA", body: "Tiempo objetivo de respuesta: 4 horas hábiles para incidencias comerciales y 24 horas para solicitudes generales. Escalaciones se atienden por el ejecutivo de cuenta asignado." },
      { heading: "Uso de datos internos", body: "La información operativa (ventas, reportes, condiciones comerciales) se utiliza únicamente para ejecución de negocio, soporte y mejora de experiencia." },
    ],
  },
  {
    id: "returns",
    icon: "↩️",
    title: "Política de Devoluciones",
    sections: [
      { heading: "Plazo de devolución", body: "Tienes 30 días naturales desde la recepción de tu pedido para solicitar una devolución o cambio, siempre que el producto esté en sus condiciones originales." },
      { heading: "Productos elegibles", body: "Productos sin abrir, en empaque original, con etiquetas intactas. Excepciones: productos de higiene personal, cosméticos abiertos o productos bajo demanda." },
      { heading: "Proceso", body: "1. Solicita la devolución en tu portal de cliente o contáctanos. 2. Recibirás una guía de envío prepagado. 3. Una vez recibido el producto, procesamos el reembolso en 3-5 días hábiles." },
      { heading: "Reembolsos", body: "El reembolso se realiza en el mismo método de pago original. Para pagos con tarjeta puede tardar hasta 10 días hábiles adicionales según tu banco." },
    ],
  },
  {
    id: "shipping",
    icon: "🚚",
    title: "Política de Envíos",
    sections: [
      { heading: "Tiempos de entrega", body: "Pedidos estándar: 3-5 días hábiles. Envío express (disponible en CDMX y ZM): 24-48 hrs. Pedidos realizados antes de las 2 PM en días hábiles se procesan el mismo día." },
      { heading: "Envío gratuito", body: "Envío gratis en pedidos mayores a $999 MXN dentro de la República Mexicana. Para pedidos menores, el costo es de $99 MXN." },
      { heading: "Cobertura", body: "Hacemos envíos a toda la República Mexicana a través de FedEx, DHL y Estafeta. Para zonas remotas pueden aplicar costos adicionales." },
      { heading: "Seguimiento", body: "Recibirás un correo con número de rastreo una vez despachado tu pedido. Puedes rastrear el envío en tiempo real desde tu portal de cliente." },
    ],
  },
  {
    id: "terms",
    icon: "📋",
    title: "Términos y Condiciones",
    sections: [
      { heading: "Aceptación", body: "Al usar nuestro sitio web o realizar una compra, aceptas estos términos y condiciones en su totalidad. Si no estás de acuerdo, por favor no uses nuestros servicios." },
      { heading: "Precios y disponibilidad", body: "Los precios pueden cambiar sin previo aviso. Nos reservamos el derecho de cancelar pedidos con errores de precio evidentes. La disponibilidad de productos está sujeta a existencias." },
      { heading: "Propiedad intelectual", body: "Todo el contenido del sitio (textos, imágenes, logotipos, diseño) es propiedad de MercaPlus Demo y está protegido por las leyes de propiedad intelectual." },
      { heading: "Limitación de responsabilidad", body: "MercaPlus Demo no se hace responsable por daños indirectos, incidentales o consecuentes derivados del uso de nuestros productos o servicios, más allá del valor del pedido afectado." },
    ],
  },
];

export function MpPolicies() {
  const [active, setActive] = useState("privacy");
  const current = POLICIES.find((p) => p.id === active)!;

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "40px 24px" }}>
      <h1 style={{ fontSize: "28px", fontWeight: 900, marginBottom: "8px" }}>Políticas y condiciones</h1>
      <p style={{ color: "var(--mp-muted)", marginBottom: "32px" }}>Información legal y condiciones de uso de {MP_BRAND.name}.</p>
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "16px" }}>
        <a href="/demo/mercaplus/faq" className="mp-btn mp-btn-ghost">Preguntas frecuentes</a>
        <a href="/demo/mercaplus/contacto" className="mp-btn mp-btn-outline">Hablar con ejecutivo IA</a>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: "28px", alignItems: "start" }}>

        {/* Sidebar */}
        <div className="mp-panel" style={{ position: "sticky", top: "80px" }}>
          {POLICIES.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setActive(p.id)}
              style={{
                display: "flex", alignItems: "center", gap: "10px",
                width: "100%", padding: "12px 14px", border: "none",
                borderRadius: "8px", cursor: "pointer", textAlign: "left",
                fontSize: "14px", fontWeight: active === p.id ? 700 : 400,
                background: active === p.id ? "var(--mp-accent-soft)" : "none",
                color: active === p.id ? "var(--mp-accent)" : "var(--mp-text)",
                marginBottom: "4px",
              }}
            >
              <span style={{ fontSize: "20px" }}>{p.icon}</span>
              {p.title}
            </button>
          ))}
        </div>

        {/* Contenido */}
        <div className="mp-panel" style={{ padding: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
            <span style={{ fontSize: "36px" }}>{current.icon}</span>
            <h2 style={{ margin: 0, fontSize: "22px", fontWeight: 900 }}>{current.title}</h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {current.sections.map((s) => (
              <div key={s.heading}>
                <h3 style={{ margin: "0 0 8px", fontSize: "15px", fontWeight: 800, color: "var(--mp-navy)" }}>{s.heading}</h3>
                <p style={{ margin: 0, fontSize: "14px", color: "var(--mp-muted)", lineHeight: 1.7 }}>{s.body}</p>
              </div>
            ))}
          </div>

          <p style={{ marginTop: "28px", fontSize: "12px", color: "var(--mp-muted)", borderTop: "1px solid var(--mp-border)", paddingTop: "20px" }}>
            Última actualización: enero 2025 · Para dudas escríbenos a {MP_BRAND.email}
          </p>
        </div>
      </div>
    </div>
  );
}
