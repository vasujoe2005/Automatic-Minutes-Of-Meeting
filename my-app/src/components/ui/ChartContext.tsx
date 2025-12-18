// ChartContext.ts
import { createContext, useContext } from "react";

export type ChartConfig = Record<string, {
  label?: string;
  icon?: React.ComponentType<{ className?: string }>;
  color?: string;
}>;

// Create a context with default empty config
const ChartContext = createContext<{ config: ChartConfig }>({ config: {} });

// Hook to access chart config
export const useChart = () => useContext(ChartContext);

// Helper to get payload config (dummy implementation)
export const getPayloadConfigFromPayload = (config: ChartConfig, item: unknown, key: string) => {
  return config[key] || {};
};
