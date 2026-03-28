type ExportButtonsProps = {
  onExport: (type: "sales" | "commissions" | "tenants" | "orders") => void;
};

export function ExportButtons({ onExport }: ExportButtonsProps) {
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
    </div>
  );
}

