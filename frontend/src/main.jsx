import React from "react";
import ReactDOM from "react-dom/client";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

import App from "./App";
import "./index.css";

import { AuthProvider } from "./context/AuthContext";
import { Toaster } from "react-hot-toast";
ReactDOM.createRoot(
    document.getElementById("root")
).render(
<React.StrictMode>
    <AuthProvider>
        <App />

        <Toaster
            position="top-right"
            toastOptions={{
                duration: 3000
            }}
        />

    </AuthProvider>
</React.StrictMode>
);