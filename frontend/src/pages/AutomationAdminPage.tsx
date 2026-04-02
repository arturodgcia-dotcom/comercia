import { FormEvent, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../app/AuthContext";
import { ModuleOnboardingCard } from "../components/ModuleOnboardingCard";
import { PageHeader } from "../components/PageHeader";
import { api } from "../services/api";
import { AutomationEventLog, BotChannelConfig, BotMessageTemplate } from "../types/domain";

export function AutomationAdminPage() {
  const { token, user } = useAuth();
  const { t } = useTranslation();
  const tenantId = user?.tenant_id ?? undefined;
  const [events, setEvents] = useState<AutomationEventLog[]>([]);
  const [channels, setChannels] = useState<BotChannelConfig[]>([]);
  const [templates, setTemplates] = useState<BotMessageTemplate[]>([]);
  const [channelForm, setChannelForm] = useState({ channel: "whatsapp", is_enabled: false, provider_name: "pending", config_json: "{}" });
  const [templateForm, setTemplateForm] = useState({ event_type: "new_plan_lead", channel: "whatsapp", template_text: t("automation.eventNewLead"), is_active: true });

  const EVENT_LABELS: Record<string, string> = {
    new_plan_lead: t("automation.eventNewLead"),
    appointment_created: t("automation.eventAppointment"),
    order_paid: t("automation.eventOrderPaid"),
    logistics_delivered: t("automation.eventLogisticsDelivered"),
    followup_required: t("automation.eventFollowup"),
    lead_interested_plan: t("automation.eventLeadInterested"),
    logistics_question: t("automation.eventLogisticsQuestion"),
    ecommerce_question: t("automation.eventEcommerceQuestion"),
    pos_question: t("automation.eventPosQuestion"),
  };

  const load = () => {
    if (!token) return;
    const tenantQuery = tenantId ? `tenant_id=${tenantId}` : "";
    Promise.all([
      api.getAutomationEvents(token, tenantQuery),
      api.getAutomationChannels(token, tenantQuery),
      api.getAutomationTemplates(token, tenantQuery)
    ]).then(([eventsData, channelsData, templatesData]) => {
      setEvents(eventsData);
      setChannels(channelsData);
      setTemplates(templatesData);
    });
  };
  useEffect(() => { load(); }, [token, tenantId]);

  const saveChannel = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;
    await api.upsertAutomationChannel(token, { tenant_id: tenantId, ...channelForm });
    load();
  };

  const saveTemplate = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;
    await api.upsertAutomationTemplate(token, { tenant_id: tenantId, ...templateForm });
    load();
  };

  return (
    <section>
      <PageHeader title={t("nav.automation")} subtitle="Configura mensajes automáticos para prospectos, citas, pagos y dudas comerciales." />
      <ModuleOnboardingCard
        moduleKey="automation"
        title="Mensajes automáticos"
        whatItDoes="Define plantillas para WhatsApp y webchat en cada evento comercial relevante."
        whyItMatters="Reduce trabajo manual y acelera la respuesta en momentos clave del cliente."
        whatToCapture={["Canal (WhatsApp/Webchat)", "Evento disparador", "Plantilla de mensaje", "Estado habilitado"]}
        impact="Mejora la conversión y el cumplimiento operativo con comunicaciones consistentes."
      />
      <section className="card-grid">
        <article className="card">
          <h3>¿Qué puedes automatizar?</h3>
          <ul className="marketing-list">
            <li>Seguimiento comercial a nuevos prospectos.</li>
            <li>Confirmaciones de cita con fecha, hora e instrucciones.</li>
            <li>Notificaciones de pago confirmado o pendiente.</li>
            <li>Alertas de logística para entrega y seguimiento.</li>
            <li>Respuestas iniciales para dudas de ecommerce, POS o logística.</li>
          </ul>
        </article>
      </section>
      <div className="card-grid">
        <form className="card" onSubmit={saveChannel}>
          <h3>{t("automation.channelMessaging")}</h3>
          <select value={channelForm.channel} onChange={(e) => setChannelForm((p) => ({ ...p, channel: e.target.value }))}>
            <option value="whatsapp">{t("automation.whatsapp")}</option>
            <option value="webchat">{t("automation.webchat")}</option>
          </select>
          <input placeholder={t("common.provider")} value={channelForm.provider_name} onChange={(e) => setChannelForm((p) => ({ ...p, provider_name: e.target.value }))} />
          <textarea placeholder="Configuración JSON" value={channelForm.config_json} onChange={(e) => setChannelForm((p) => ({ ...p, config_json: e.target.value }))} />
          <label className="checkbox">
            <input type="checkbox" checked={channelForm.is_enabled} onChange={(e) => setChannelForm((p) => ({ ...p, is_enabled: e.target.checked }))} />
            {t("automation.channelEnabled")}
          </label>
          <button className="button" type="submit">{t("automation.saveChannel")}</button>
        </form>
        <form className="card" onSubmit={saveTemplate}>
          <h3>{t("automation.autoMessage")}</h3>
          <select value={templateForm.event_type} onChange={(e) => setTemplateForm((p) => ({ ...p, event_type: e.target.value }))}>
            <option value="new_plan_lead">{t("automation.eventNewLead")}</option>
            <option value="appointment_created">{t("automation.eventAppointment")}</option>
            <option value="order_paid">{t("automation.eventOrderPaid")}</option>
            <option value="logistics_delivered">{t("automation.eventLogisticsDelivered")}</option>
            <option value="followup_required">{t("automation.eventFollowup")}</option>
            <option value="lead_interested_plan">{t("automation.eventLeadInterested")}</option>
            <option value="logistics_question">{t("automation.eventLogisticsQuestion")}</option>
            <option value="ecommerce_question">{t("automation.eventEcommerceQuestion")}</option>
            <option value="pos_question">{t("automation.eventPosQuestion")}</option>
          </select>
          <select value={templateForm.channel} onChange={(e) => setTemplateForm((p) => ({ ...p, channel: e.target.value }))}>
            <option value="whatsapp">{t("automation.whatsapp")}</option>
            <option value="webchat">{t("automation.webchat")}</option>
          </select>
          <textarea value={templateForm.template_text} onChange={(e) => setTemplateForm((p) => ({ ...p, template_text: e.target.value }))} />
          <button className="button" type="submit">{t("automation.saveMessage")}</button>
        </form>
      </div>
      <section className="card">
        <h3>{t("automation.configuredChannels")}</h3>
        <table className="table">
          <thead><tr><th>{t("common.channel")}</th><th>{t("common.provider")}</th><th>{t("common.enabled")}</th></tr></thead>
          <tbody>
            {channels.map((channel) => (
              <tr key={channel.id}>
                <td>{channel.channel}</td>
                <td>{channel.provider_name}</td>
                <td>{channel.is_enabled ? t("common.yes") : t("common.no")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="card">
        <h3>{t("automation.configuredMessages")}</h3>
        <table className="table">
          <thead><tr><th>{t("common.event")}</th><th>{t("common.channel")}</th><th>{t("common.text")}</th></tr></thead>
          <tbody>
            {templates.map((template) => (
              <tr key={template.id}>
                <td>{EVENT_LABELS[template.event_type] ?? template.event_type}</td>
                <td>{template.channel}</td>
                <td>{template.template_text}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="card">
        <h3>{t("automation.recentActivity")}</h3>
        <table className="table">
          <thead><tr><th>{t("common.date")}</th><th>{t("common.event")}</th><th>{t("common.entity")}</th></tr></thead>
          <tbody>
            {events.slice(0, 20).map((row) => (
              <tr key={row.id}>
                <td>{new Date(row.created_at).toLocaleString()}</td>
                <td>{EVENT_LABELS[row.event_type] ?? row.event_type}</td>
                <td>{row.related_entity_type}#{row.related_entity_id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </section>
  );
}
