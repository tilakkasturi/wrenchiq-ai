import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import WrenchIQSidecarApp from "./WrenchIQSidecarApp";
import { DemoProvider } from "./context/DemoContext";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <DemoProvider>
      <WrenchIQSidecarApp />
    </DemoProvider>
  </StrictMode>,
);
