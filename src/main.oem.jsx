import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import WrenchIQOEMApp from "./WrenchIQOEMApp";
import { BrandingProvider } from "./context/BrandingContext";
import { DemoProvider } from "./context/DemoContext";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <DemoProvider>
      <BrandingProvider>
        <WrenchIQOEMApp />
      </BrandingProvider>
    </DemoProvider>
  </StrictMode>
);
