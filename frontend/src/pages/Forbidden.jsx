import { Link } from "react-router-dom";
export default function Forbidden() {
    return <div className="d-flex align-items-center justify-content-center py-5"><div className="text-center"><div className="display-1 fw-bold text-danger">403</div><h1>Access denied</h1><p className="text-secondary">You do not have permission to open this page.</p><Link className="btn btn-primary" to="/">Back to dashboard</Link></div></div>;
}

