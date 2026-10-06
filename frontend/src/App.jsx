import AppRoutes from "./routes/AppRoutes";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { getPublicSettings } from "./services/settingsService";
import { useAuth } from "./context/AuthContext";

function App() {
    const [settings, setSettings] = useState(null);
    const { user } = useAuth();
    const location = useLocation();

    useEffect(() => {
        getPublicSettings()
            .then((response) => setSettings(response.data.data || {}))
            .catch(() => setSettings({}));
    }, []);

    const roles = user?.roles || [];
    const isAdmin = roles.includes("admin");
    const maintenanceEnabled = settings?.["maintenance.enabled"] === true;
    const loginPath = location.pathname === "/login";

    if (maintenanceEnabled && !isAdmin && !loginPath) {
        return <MaintenancePage />;
    }

    return <AppRoutes />;
}

function MaintenancePage() {
    return (
        <div className="maintenance-page">
            <div className="maintenance-panel">
                <i className="bi bi-tools maintenance-icon" />
                <h1>Maintenance mode</h1>
                <p>
                    The admin portal is temporarily unavailable while system
                    maintenance is in progress.
                </p>
                <Link className="btn btn-primary" to="/login">
                    Admin sign in
                </Link>
            </div>
        </div>
    );
}

export default App;

