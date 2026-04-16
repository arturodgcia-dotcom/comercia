import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../app/AuthContext";
import { ModuleOnboardingCard } from "../components/ModuleOnboardingCard";
import { PageHeader } from "../components/PageHeader";
import { api } from "../services/api";
import { CatalogBulkImportResult, CatalogImportJob, Tenant } from "../types/domain";

type ImportRow = Record<string, string>;

const REQUIRED_COLUMNS = [
  "nombre",
  "descripcion",
  "categoria",
  "precio_publico",
  "precio_menudeo",
  "precio_mayoreo",
  "stock_general",
  "visible_publico",
  "visible_distribuidor",
  "disponible_en_linea",
  "disponible_fisico",
  "minimo_menudeo",
  "minimo_mayoreo",
  "stripe_product_id",
  "stripe_price_id_publico",
  "stripe_price_id_menudeo",
  "stripe_price_id_mayoreo",
];

export function CatalogBulkUploadPage() {
  const { token } = useAuth();
  const [searchParams] = useSearchParams();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantId, setTenantId] = useState<number | null>(null);

  const [rows, setRows] = useState<ImportRow[]>([]);
  const [columnErrors, setColumnErrors] = useState<string[]>([]);
  const [errorRows, setErrorRows] = useState<Array<{ index: number; reason: string }>>([]);
  const [latestJob, setLatestJob] = useState<CatalogImportJob | null>(null);
  const [lastResult, setLastResult] = useState<CatalogBulkImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const requestedTenantId = Number(searchParams.get("tenant_id"));
  const hasRequestedTenant = Number.isFinite(requestedTenantId) && requestedTenantId > 0;
  const returnToRaw = searchParams.get("return_to") ?? "";
  const returnTo = returnToRaw.startsWith("/") ? returnToRaw : "";

  useEffect(() => {
    if (!token) return;
    api.getTenants(token)
      .then((list) => {
        setTenants(list);
        setTenantId((previous) => {
          if (previous) return previous;
          if (hasRequestedTenant && list.some((tenant) => tenant.id === requestedTenantId)) {
            return requestedTenantId;
          }
          return list[0]?.id ?? null;
        });
      })
      .catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar marcas"));
  }, [token, hasRequestedTenant, requestedTenantId]);

  useEffect(() => {
    if (!token || !tenantId) return;
    api.getLatestCatalogImportJob(token, tenantId)
      .then(setLatestJob)
      .catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar la ultima importacion"));
  }, [token, tenantId]);

  const summary = useMemo(
    () => ({
      total: rows.length,
      ok: rows.length - errorRows.length,
      errors: errorRows.length,
      validPercent: rows.length === 0 ? 0 : Math.round(((rows.length - errorRows.length) / rows.length) * 100),
    }),
    [rows, errorRows]
  );

  const downloadTemplate = () => {
    const header = REQUIRED_COLUMNS.join(",");
    const demoRow = [
      "Kit Inicio ComerCia",
      "Paquete inicial para ventas",
      "Kits",
      "",
      "1299",
      "1199",
      "1099",
      "120",
      "si",
      "si",
      "si",
      "si",
      "1",
      "6",
      "prod_demo_kit001",
      "price_demo_public_kit001",
      "price_demo_retail_kit001",
      "price_demo_wholesale_kit001",
    ].join(",");
    const blob = new Blob([`${header}\n${demoRow}\n`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "plantilla_catalogo_comercia.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const loadCsv = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    setMessage("");
    setLastResult(null);
    const reader = new FileReader();
    reader.onload = () => {
      const content = String(reader.result ?? "");
      const lines = content.split(/\r?\n/).filter(Boolean);
      if (lines.length === 0) return;
      const [headerLine, ...dataLines] = lines;
      const headers = headerLine.split(",").map((item) => item.trim().toLowerCase());

      const missingColumns = REQUIRED_COLUMNS.filter((column) => !headers.includes(column));
      setColumnErrors(missingColumns.map((column) => `Falta columna obligatoria: ${column}`));

      const parsed = dataLines.map((line) => {
        const values = line.split(",");
        return headers.reduce<ImportRow>((acc, header, index) => {
          acc[header] = (values[index] ?? "").trim();
          return acc;
        }, {});
      });

      const detectedErrors = parsed
        .map((row, index) => {
          if (!row.nombre) return { index: index + 1, reason: "Falta nombre" };
          if (!row.precio_publico || Number.isNaN(Number(row.precio_publico))) {
            return { index: index + 1, reason: "precio_publico invalido" };
          }
          if (!row.visible_publico || !["si", "no"].includes(row.visible_publico.toLowerCase())) {
            return { index: index + 1, reason: "visible_publico debe ser si/no" };
          }
          if (!row.visible_distribuidor || !["si", "no"].includes(row.visible_distribuidor.toLowerCase())) {
            return { index: index + 1, reason: "visible_distribuidor debe ser si/no" };
          }
          return null;
        })
        .filter((item): item is { index: number; reason: string } => Boolean(item));

      setRows(parsed);
      setErrorRows(detectedErrors);
    };
    reader.readAsText(file, "utf-8");
    event.target.value = "";
  };

  const importCatalog = async () => {
    if (!token || !tenantId) return;
    if (!rows.length) {
      setError("Primero carga un archivo CSV para importar.");
      return;
    }
    if (columnErrors.length) {
      setError("Corrige las columnas faltantes antes de importar.");
      return;
    }
    try {
      setLoading(true);
      setError("");
      setMessage("");
      const result = await api.bulkImportCatalog(token, { tenant_id: tenantId, rows });
      setLastResult(result);
      setLatestJob(result.job);
      setMessage(
        `Importacion completada: ${result.job.valid_rows} validas, ${result.job.error_rows} con error, ` +
        `${result.job.products_created} productos creados y ${result.job.products_updated} actualizados.`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible ejecutar la importacion.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <PageHeader
        title="Carga masiva de catalogo"
        subtitle="Importa productos por marca y deja trazabilidad real para el wizard de ecommerce."
      />
      <ModuleOnboardingCard
        moduleKey="bulk_upload"
        title="Carga masiva"
        whatItDoes="Permite importar catalogos completos por archivo CSV con validacion previa."
        whyItMatters="Acelera altas de productos y evita errores manuales en precios o visibilidad."
        whatToCapture={["Marca (tenant)", "Plantilla oficial", "Columnas obligatorias", "Price IDs de Stripe", "Resumen de errores"]}
        impact="Reduce tiempo operativo y sincroniza automaticamente el estado del ecommerce en el wizard."
      />

      {error ? <p className="error">{error}</p> : null}
      {message ? <p>{message}</p> : null}

      <section className="card">
        <h3>Marca objetivo de la importacion</h3>
        <select value={tenantId ?? ""} onChange={(event) => setTenantId(Number(event.target.value))}>
          {tenants.map((tenant) => (
            <option key={tenant.id} value={tenant.id}>
              {tenant.name}
            </option>
          ))}
        </select>
        {returnTo ? (
          <div className="row-gap" style={{ marginTop: "12px" }}>
            <Link className="button button-outline" to={returnTo}>
              Regresar al wizard de esta marca
            </Link>
          </div>
        ) : null}
      </section>

      <section className="store-banner">
        <h3>Guia rapida del layout</h3>
        <p>
          El archivo debe incluir visibilidad por canal, precios publico/menudeo/mayoreo, minimos, stock y columnas Stripe. SKU y barcode son opcionales (se autogeneran si vienen vacios).
        </p>
        <div className="row-gap">
          <button className="button button-outline" type="button" onClick={downloadTemplate}>
            Descargar plantilla oficial
          </button>
          <label className="button button-outline">
            Cargar archivo CSV
            <input type="file" accept=".csv" style={{ display: "none" }} onChange={loadCsv} />
          </label>
          <button className="button" type="button" onClick={importCatalog} disabled={loading || !rows.length}>
            {loading ? "Importando..." : "Importar al catalogo de la marca"}
          </button>
        </div>
      </section>

      {latestJob ? (
        <article className="card">
          <h3>Ultima importacion registrada</h3>
          <p>Fecha: {new Date(latestJob.created_at).toLocaleString("es-MX")}</p>
          <p>Filas totales: {latestJob.total_rows}</p>
          <p>Filas validas: {latestJob.valid_rows}</p>
          <p>Filas con error: {latestJob.error_rows}</p>
          <p>Categorias creadas: {latestJob.categories_created}</p>
          <p>Productos creados: {latestJob.products_created}</p>
          <p>Productos actualizados: {latestJob.products_updated}</p>
          <p>Estatus: {latestJob.status}</p>
        </article>
      ) : null}

      {columnErrors.length > 0 ? (
        <article className="card">
          <h3>Errores de estructura</h3>
          <ul>
            {columnErrors.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      ) : null}

      <section className="card-grid">
        <article className="card">
          <h3>Resumen de validacion local</h3>
          <p>Total filas: {summary.total}</p>
          <p>Filas validas: {summary.ok}</p>
          <p>Filas con error: {summary.errors}</p>
          <p>Calidad del archivo: {summary.validPercent}%</p>
        </article>
        <article className="card">
          <h3>Campos clave soportados</h3>
          <ul className="marketing-list">
            <li>Visible publico / visible distribuidor</li>
            <li>Disponible en linea / fisico / ambos</li>
            <li>Precio publico, menudeo y mayoreo</li>
            <li>Minimo por canal</li>
            <li>Stock general</li>
            <li>Stripe product ID y price IDs por canal</li>
          </ul>
        </article>
        <article className="card">
          <h3>Bloque Stripe</h3>
          <ul className="marketing-list">
            <li>Crear productos/precios en Stripe desde ComerCia con IDs vacios.</li>
            <li>Importar IDs existentes desde Stripe para evitar duplicados.</li>
            <li>Sincronizar price IDs por canal publico, menudeo y mayoreo.</li>
          </ul>
        </article>
      </section>

      <article className="card">
        <h3>Errores detectados por fila</h3>
        {errorRows.length === 0 ? (
          <p>Sin errores detectados.</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Fila</th>
                  <th>Error</th>
                </tr>
              </thead>
              <tbody>
                {errorRows.map((item) => (
                  <tr key={`${item.index}-${item.reason}`}>
                    <td>{item.index}</td>
                    <td>{item.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>

      {lastResult?.errors.length ? (
        <article className="card">
          <h3>Errores devueltos por backend</h3>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Fila</th>
                  <th>Error</th>
                </tr>
              </thead>
              <tbody>
                {lastResult.errors.map((item) => (
                  <tr key={`${item.index}-${item.reason}`}>
                    <td>{item.index}</td>
                    <td>{item.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      ) : null}
    </section>
  );
}
