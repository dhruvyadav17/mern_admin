import React from "react";
import ReactDOM from "react-dom/client";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";
import { PermissionProvider } from "./context/PermissionContext";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import ErrorBoundary from "./components/common/ErrorBoundary";
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
    
      <AuthProvider>
        <PermissionProvider>
          <ErrorBoundary>
          <App />
          </ErrorBoundary>
        </PermissionProvider>
        <Toaster position="top-right" />
      </AuthProvider>
      
    </BrowserRouter>
  </React.StrictMode>,
);
