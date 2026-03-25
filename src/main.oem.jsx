import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import WrenchIQOEMApp from "./WrenchIQOEMApp";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <WrenchIQOEMApp />
  </StrictMode>
);
