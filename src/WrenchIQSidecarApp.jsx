import { useDemo } from "./context/DemoContext";
import { SelectedCustomerProvider } from "./context/SelectedCustomerContext";
import { BrandingProvider } from "./context/BrandingContext";
import { ZoomProvider } from "./context/ZoomContext";
import WrenchIQSidecarScreen from "./screens/WrenchIQSidecarScreen";

// Bridge: reads shopId from DemoContext to pass into SelectedCustomerProvider,
// same pattern as main.jsx's AppWithObjectives.
export default function WrenchIQSidecarApp() {
  const { activeShopId } = useDemo();
  return (
    <SelectedCustomerProvider shopId={activeShopId || "cornerstone"} edition="am">
      <BrandingProvider>
        <ZoomProvider>
          <WrenchIQSidecarScreen />
        </ZoomProvider>
      </BrandingProvider>
    </SelectedCustomerProvider>
  );
}
