// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// Register service worker for PWA support
if ("serviceWorker" in navigator) {
  window.addEventListener("load", function() {
    navigator.serviceWorker.register("/sw.js")
      .then(function(reg) {
        console.log("[ChurchTrakr] SW registered:", reg.scope);
      })
      .catch(function(err) {
        console.warn("[ChurchTrakr] SW registration failed:", err);
      });
  });
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);