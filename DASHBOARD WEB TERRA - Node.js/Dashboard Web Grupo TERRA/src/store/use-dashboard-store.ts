// Hook de React sobre el store vanilla (dashboard-store.ts), para usar SOLO desde
// componentes React (carpeta components/). Se mantiene en un archivo aparte a proposito:
// lib/* y el motor de exportacion standalone importan `dashboardStoreApi` directamente de
// dashboard-store.ts, que no depende de React; si este hook viviera en el mismo archivo,
// el import de "zustand/react" (y por lo tanto React entero) se colaria en el bundle del
// motor de exportacion aunque nunca se usara ahi.
import { useStore } from "zustand/react";
import { dashboardStoreApi, type DashboardState } from "./dashboard-store";

export function useDashboardStore<T>(selector: (state: DashboardState) => T): T {
  return useStore(dashboardStoreApi, selector);
}

useDashboardStore.getState = dashboardStoreApi.getState;
useDashboardStore.setState = dashboardStoreApi.setState;
useDashboardStore.subscribe = dashboardStoreApi.subscribe;
