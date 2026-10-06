export default function DataTable({ columns = [], rows = [], loading = false, empty = "No records found.", rowKey = "id" }) {
 return <div className="table-responsive"><table className="table table-hover align-middle mb-0"><thead><tr>{columns.map(c=><th key={c.key}>{c.label}</th>)}</tr></thead><tbody>{loading?<tr><td colSpan={columns.length} className="text-center py-5"><span className="spinner-border spinner-border-sm me-2"/>Loading...</td></tr>:rows.length?rows.map((row,i)=><tr key={row[rowKey]||row._id||i}>{columns.map(c=><td key={c.key}>{c.render?c.render(row):row[c.key]}</td>)}</tr>):<tr><td colSpan={columns.length} className="text-center py-5 text-secondary">{empty}</td></tr>}</tbody></table></div>;
}

