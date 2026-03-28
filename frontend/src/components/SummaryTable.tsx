type SummaryTableProps = {
  headers: string[];
  rows: Array<Array<string | number | boolean | null | undefined>>;
};

export function SummaryTable({ headers, rows }: SummaryTableProps) {
  return (
    <table className="table">
      <thead>
        <tr>
          {headers.map((header) => (
            <th key={header}>{header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {row.map((cell, cellIndex) => (
              <td key={`${rowIndex}-${cellIndex}`}>{cell === null || cell === undefined ? "-" : String(cell)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

