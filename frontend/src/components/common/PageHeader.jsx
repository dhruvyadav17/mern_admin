export default function PageHeader({ title, subtitle, action }) { return <div className="d-flex flex-wrap justify-content-between align-items-center mb-4"><div><h1 className="h3 mb-1">{title}</h1>{subtitle && <p className="text-secondary mb-0">{subtitle}</p>}</div>{action}</div>; }

