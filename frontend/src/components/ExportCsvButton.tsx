export function ExportCsvButton({ onClick, label = "Exportar CSV" }: { onClick: () => void; label?: string }) {
  return (
    <button type="button" className="button button-outline" onClick={onClick}>
      {label}
    </button>
  );
}

