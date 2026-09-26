import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { ThemeProvider } from "./theme.jsx";
import { VehicleProvider } from "./store.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <VehicleProvider>
          <App />
        </VehicleProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);