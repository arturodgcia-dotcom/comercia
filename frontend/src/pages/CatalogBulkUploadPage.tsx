import { ChangeEvent, useMemo, useState } from "react";
import { PageHeader } from "../components/PageHeader";

type ImportRow = Record<string, string>;

export function CatalogBulkUploadPage() {
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [errorRows, setErrorRows] = useState<Array<{ index: number; reason: string }>>([]);

  const summary = useMemo(
    () => ({
      total: rows.length,
      ok: rows.length - errorRows.length,
      errors: errorRows.length,
    }),
    [rows, errorRows]
  );

  const downloadTemplate = () => {
    const headers = [
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
    ];
    const blob = new Blob([`${headers.join(",")}\n`], { type: "text/csv;charset=utf-8;" });
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
      const [headerLine, ...dataLines] = lines;
      const headers = headerLine.split(",").map((item) => item.trim());
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
          if (!row.precio_publico) return { index: index + 1, reason: "Falta precio_publico" };
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
        subtitle="Descarga plantilla, valida errores y revisa resumen antes de importar."
      />
      <div className="row-gap">
        <button className="button button-outline" type="button" onClick={downloadTemplate}>
          Descargar plantilla CSV
        </button>
        <label className="button button-outline">
          Cargar archivo CSV
          <input type="file" accept=".csv" style={{ display: "none" }} onChange={loadCsv} />
        </label>
      </div>
      <article className="card">
        <h3>Resumen de importación</h3>
        <p>Total filas: {summary.total}</p>
        <p>Filas válidas: {summary.ok}</p>
        <p>Filas con error: {summary.errors}</p>
      </article>
      <article className="card">
        <h3>Errores detectados</h3>
        {errorRows.length === 0 ? (
          <p>Sin errores detectados.</p>
        ) : (
          <ul>
            {errorRows.map((item) => (
              <li key={`${item.index}-${item.reason}`}>
                Fila {item.index}: {item.reason}
              </li>
            ))}
          </ul>
        )}
      </article>
    </section>
  );
}
