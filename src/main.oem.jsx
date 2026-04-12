import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import WrenchIQOEMApp from "./WrenchIQOEMApp";
import { BrandingProvider } from "./context/BrandingContext";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrandingProvider>
      <WrenchIQOEMApp />
    </BrandingProvider>
  </StrictMode>
);
