import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import GitHubPages from "./GitHubPages";

// Detect if running in Tauri environment
const isTauri = window.__TAURI__ !== undefined;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {isTauri ? <App /> : <GitHubPages />}
  </React.StrictMode>,
);
