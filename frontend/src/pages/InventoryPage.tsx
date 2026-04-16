import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { ModuleOnboardingCard } from "../components/ModuleOnboardingCard";
import { PageHeader } from "../components/PageHeader";
import { api } from "../services/api";
import { Product } from "../types/domain";

type StockMap = Record<number, { general: number; publico: number; distribuidor: number; pos: number; almacenPrincipal: number }>;

function getStorageKey(tenantId: number) {
  return `comercia_inventory_${tenantId}`;
}

export function InventoryPage() {
  const { token, user } = useAuth();
  const tenantId = user?.tenant_id ?? 0;
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState("");
  const [stockMap, setStockMap] = useState<StockMap>({});
  const [scanCode, setScanCode] = useState("");
  const [movementType, setMovementType] = useState<"entrada" | "ajuste" | "conteo">("entrada");
  const [movementQty, setMovementQty] = useState<number>(1);

  useEffect(() => {
    if (!token || !tenantId) return;
    api.getProductsByTenant(token, tenantId)
      .then((data) => {
        setProducts(data);
        const stored = localStorage.getItem(getStorageKey(tenantId));
        if (stored) {
          setStockMap(JSON.parse(stored) as StockMap);
          return;
        }
        const defaults: StockMap = {};
        data.forEach((product) => {
          const base = product.is_active ? 120 : 0;
          defaults[product.id] = {
            general: base,
            publico: Math.floor(base * 0.5),
            distribuidor: Math.floor(base * 0.3),
            pos: Math.floor(base * 0.2),
            almacenPrincipal: base,
          };
        });
        setStockMap(defaults);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar inventario."));
  }, [token, tenantId]);

  useEffect(() => {
    if (!tenantId || Object.keys(stockMap).length === 0) return;
    localStorage.setItem(getStorageKey(tenantId), JSON.stringify(stockMap));
  }, [stockMap, tenantId]);

  const totals = useMemo(() => {
    return Object.values(stockMap).reduce(
      (acc, row) => {
        acc.general += row.general;
        acc.publico += row.publico;
        acc.distribuidor += row.distribuidor;
        acc.pos += row.pos;
        return acc;
      },
      { general: 0, publico: 0, distribuidor: 0, pos: 0 }
    );
  }, [stockMap]);

  const applyMovement = (productId: number, field: keyof StockMap[number], delta: number) => {
    setStockMap((previous) => {
      const current = previous[productId] ?? { general: 0, publico: 0, distribuidor: 0, pos: 0, almacenPrincipal: 0 };
      const nextValue = Math.max(0, (current[field] ?? 0) + delta);
      const next = { ...current, [field]: nextValue };
      if (field !== "general") {
        next.general = next.publico + next.distribuidor + next.pos;
      }
      if (field === "general") {
        next.publico = Math.floor(next.general * 0.5);
        next.distribuidor = Math.floor(next.general * 0.3);
        next.pos = Math.max(0, next.general - next.publico - next.distribuidor);
      }
      next.almacenPrincipal = next.general;
      return { ...previous, [productId]: next };
    });
  };

  const applyScannedMovement = async () => {
    if (!scanCode.trim()) return;
    const normalized = scanCode.trim().toUpperCase();
    let product = products.find((item) => item.barcode.toUpperCase() === normalized || item.sku.toUpperCase() === normalized);
    if (!product && token && tenantId) {
      try {
        product = await api.getProductByScanCode(token, tenantId, normalized);
      } catch {
        setError("No se encontro producto para ese codigo en inventario.");
        return;
      }
    }
    if (!product) {
      setError("No se encontro producto para ese codigo en inventario.");
      return;
    }

    const qty = Math.max(1, Number(movementQty || 1));
    if (movementType === "entrada") {
      applyMovement(product.id, "general", qty);
    } else if (movementType === "ajuste") {
      applyMovement(product.id, "general", -qty);
    } else {
      setStockMap((previous) => {
        const current = previous[product.id] ?? { general: 0, publico: 0, distribuidor: 0, pos: 0, almacenPrincipal: 0 };
        const nextGeneral = qty;
        const publico = Math.floor(nextGeneral * 0.5);
        const distribuidor = Math.floor(nextGeneral * 0.3);
        const pos = Math.max(0, nextGeneral - publico - distribuidor);
        return {
          ...previous,
          [product.id]: {
            ...current,
            general: nextGeneral,
            publico,
            distribuidor,
            pos,
            almacenPrincipal: nextGeneral,
          },
        };
      });
    }
    setError("");
    setScanCode("");
  };

  return (
    <section>
      <PageHeader
        title="Inventario y surtido"
        subtitle="Control visible de stock general, por canal, por almacén y ajustes rápidos de movimiento."
      />
      <ModuleOnboardingCard
        moduleKey="inventory"
        title="Almacenes e inventario"
        whatItDoes="Muestra stock general y por canal con movimientos rapidos por producto."
        whyItMatters="Evita sobreventa y ayuda a priorizar surtido entre ecommerce, distribuidores y POS."
        whatToCapture={["Stock general", "Asignacion por canal", "Ajustes de movimiento", "Control por almacen"]}
        impact="Mejora disponibilidad real y reduce quiebres de inventario."
      />
      {error ? <p className="error">{error}</p> : null}

      <div className="card-grid">
        <article className="card"><h3>Stock general</h3><p>{totals.general}</p></article>
        <article className="card"><h3>Canal público</h3><p>{totals.publico}</p></article>
        <article className="card"><h3>Canal distribuidor</h3><p>{totals.distribuidor}</p></article>
        <article className="card"><h3>Canal POS</h3><p>{totals.pos}</p></article>
      </div>
      <article className="card" style={{ marginBottom: "1rem" }}>
        <h3>Escaneo para movimientos de inventario</h3>
        <p className="muted">Usa scanner USB o captura manual por SKU/barcode para entrada, ajuste o conteo rapido.</p>
        <div className="row-gap">
          <select value={movementType} onChange={(event) => setMovementType(event.target.value as "entrada" | "ajuste" | "conteo")}>
            <option value="entrada">Entrada mercancia</option>
            <option value="ajuste">Ajuste inventario</option>
            <option value="conteo">Conteo rapido</option>
          </select>
          <input
            type="number"
            min={1}
            value={movementQty}
            onChange={(event) => setMovementQty(Number(event.target.value))}
            placeholder="Cantidad"
          />
          <input
            value={scanCode}
            onChange={(event) => setScanCode(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void applyScannedMovement();
              }
            }}
            placeholder="Escanea barcode o SKU y presiona Enter"
          />
          <button className="button button-outline" type="button" onClick={() => void applyScannedMovement()}>
            Aplicar movimiento por escaneo
          </button>
        </div>
      </article>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>SKU</th>
              <th>Barcode</th>
              <th>Stock general</th>
              <th>Público</th>
              <th>Distribuidor</th>
              <th>POS</th>
              <th>Almacén principal</th>
              <th>Movimientos</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const stock = stockMap[product.id] ?? { general: 0, publico: 0, distribuidor: 0, pos: 0, almacenPrincipal: 0 };
              return (
                <tr key={product.id}>
                  <td>{product.name}</td>
                  <td>{product.sku}</td>
                  <td>
                    {product.barcode}
                    <div className="muted">{product.barcode_type.toUpperCase()}</div>
                  </td>
                  <td>{stock.general}</td>
                  <td>{stock.publico}</td>
                  <td>{stock.distribuidor}</td>
                  <td>{stock.pos}</td>
                  <td>{stock.almacenPrincipal}</td>
                  <td>
                    <div className="row-gap">
                      <button className="button button-outline" onClick={() => applyMovement(product.id, "general", 10)} type="button">+10</button>
                      <button className="button button-outline" onClick={() => applyMovement(product.id, "general", -10)} type="button">-10</button>
                      <button className="button button-outline" onClick={() => applyMovement(product.id, "distribuidor", 5)} type="button">+5 dist</button>
                      <button className="button button-outline" onClick={() => applyMovement(product.id, "pos", 5)} type="button">+5 POS</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
