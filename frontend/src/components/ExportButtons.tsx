type ExportButtonsProps = {
  onExport: (type: "sales" | "commissions" | "tenants" | "orders" | "commission-agents" | "plan-purchase-leads") => void;
  extended?: boolean;
};

export function ExportButtons({ onExport, extended = false }: ExportButtonsProps) {
  return (
    <div className="row-gap">
      <button className="button button-outline" type="button" onClick={() => onExport("sales")}>
        Export ventas CSV
      </button>
      <button className="button button-outline" type="button" onClick={() => onExport("commissions")}>
        Export comisiones CSV
      </button>
      <button className="button button-outline" type="button" onClick={() => onExport("tenants")}>
        Export tenants CSV
      </button>
      <button className="button button-outline" type="button" onClick={() => onExport("orders")}>
        Export orders CSV
      </button>
      {extended ? (
        <>
          <button className="button button-outline" type="button" onClick={() => onExport("commission-agents")}>
            Export comisionistas CSV
          </button>
          <button className="button button-outline" type="button" onClick={() => onExport("plan-purchase-leads")}>
            Export leads planes CSV
          </button>
        </>
      ) : null}
    </div>
  );
}
