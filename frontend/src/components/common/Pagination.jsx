export default function Pagination({page,totalPages,onChange,total,label="items"}) {
  const pages = Math.max(1, totalPages || 1);
  return <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-3">
    <span className="small text-secondary">Page {page} of {pages} · {total ?? 0} {label}</span>
    <div className="btn-group btn-group-sm">
      <button className="btn btn-outline-secondary" disabled={page<=1} onClick={()=>onChange(page-1)}>Previous</button>
      {Array.from({length:pages},(_,i)=>i+1).slice(Math.max(0,page-3),Math.min(pages,page+2)).map(p=><button key={p} className={`btn ${p===page?"btn-primary":"btn-outline-secondary"}`} onClick={()=>onChange(p)}>{p}</button>)}
      <button className="btn btn-outline-secondary" disabled={page>=pages} onClick={()=>onChange(page+1)}>Next</button>
    </div>
  </div>;
}
