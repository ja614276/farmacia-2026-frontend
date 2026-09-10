import React from "react";
import ReactDOM from "react-dom/client";
import "./styles.css";
import { FarmaciaApp } from "./FarmaciaApp";
import { BrowserRouter } from "react-router-dom";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
        <FarmaciaApp />
    </BrowserRouter>
  </React.StrictMode>
);
