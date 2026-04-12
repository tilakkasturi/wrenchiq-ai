import { createContext, useContext, useState } from "react";

const BrandingContext = createContext({ brand: "WrenchIQ", setBrand: () => {} });

export function BrandingProvider({ children }) {
  const [brand, setBrandState] = useState(
    () => localStorage.getItem("predii_brand") || "WrenchIQ"
  );

  function setBrand(b) {
    setBrandState(b);
    localStorage.setItem("predii_brand", b);
  }

  return (
    <BrandingContext.Provider value={{ brand, setBrand }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  return useContext(BrandingContext);
}

// Returns "WrenchIQ-AM" / "WrenchIQ-OEM" or "PrediiPowered-AM" / "PrediiPowered-OEM"
export function useEditionName(edition) {
  const { brand } = useContext(BrandingContext);
  return `${brand}-${edition}`;
}
