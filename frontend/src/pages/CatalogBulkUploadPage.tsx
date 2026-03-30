import { ChangeEvent, useMemo, useState } from "react";
import { PageHeader } from "../components/PageHeader";

type ImportRow = Record<string, string>;

const REQUIRED_COLUMNS = [
  "nombre",
  "descripcion",
  "categoria",
  "sku",
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
];

export function CatalogBulkUploadPage() {
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [columnErrors, setColumnErrors] = useState<string[]>([]);
  const [errorRows, setErrorRows] = useState<Array<{ index: number; reason: string }>>([]);

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
      "KIT-001",
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

      const errors = parsed
        .map((row, index) => {
          if (!row.nombre) return { index: index + 1, reason: "Falta nombre" };
          if (!row.sku) return { index: index + 1, reason: "Falta SKU" };
          if (!row.precio_publico || Number.isNaN(Number(row.precio_publico))) {
            return { index: index + 1, reason: "precio_publico inválido" };
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
      setErrorRows(errors);
    };
    reader.readAsText(file, "utf-8");
    event.target.value = "";
  };

  return (
    <section>
      <PageHeader
        title="Carga masiva de catálogo"
        subtitle="Importa productos por layout con validación de columnas, errores y resumen de resultados."
      />

      <section className="store-banner">
        <h3>Guía rápida del layout</h3>
        <p>
          El archivo debe incluir columnas para visibilidad por canal, precios público/menudeo/mayoreo, mínimos y stock.
        </p>
        <div className="row-gap">
          <button className="button button-outline" type="button" onClick={downloadTemplate}>
            Descargar plantilla oficial
          </button>
          <label className="button button-outline">
            Cargar archivo CSV
            <input type="file" accept=".csv" style={{ display: "none" }} onChange={loadCsv} />
          </label>
        </div>
      </section>

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
          <h3>Resumen de importación</h3>
          <p>Total filas: {summary.total}</p>
          <p>Filas válidas: {summary.ok}</p>
          <p>Filas con error: {summary.errors}</p>
          <p>Calidad del archivo: {summary.validPercent}%</p>
        </article>
        <article className="card">
          <h3>Campos clave soportados</h3>
          <ul className="marketing-list">
            <li>Visible público / visible distribuidor</li>
            <li>Disponible en línea / físico / ambos</li>
            <li>Precio público, menudeo y mayoreo</li>
            <li>Mínimo por canal</li>
            <li>Stock general</li>
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
    </section>
  );
}
