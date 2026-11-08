import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { SystemCopy } from "./components/SystemCopy";
import "./app/globals.css";

createRoot(document.getElementById("root")!).render(<React.StrictMode><App systemCopy={<SystemCopy />} /></React.StrictMode>);
