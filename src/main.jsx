import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import GitHubPages from "./GitHubPages";

// Force App.tsx for desktop - GitHubPages.tsx only for actual web deployments
// Tauri apps load from file:// or custom protocols, not http:// or https://
const isWebDeployment = window.location.protocol === 'http:' || window.location.protocol === 'https:';

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {isWebDeployment ? <GitHubPages /> : <App />}
  </React.StrictMode>,
);
