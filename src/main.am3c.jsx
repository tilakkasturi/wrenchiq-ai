import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import WrenchIQAMApp from "./WrenchIQAMApp";
import { BrandingProvider } from "./context/BrandingContext";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrandingProvider>
      <WrenchIQAMApp />
    </BrandingProvider>
  </StrictMode>
);
