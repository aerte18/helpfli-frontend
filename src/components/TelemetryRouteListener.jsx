import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useTelemetry } from "../hooks/useTelemetry";

/** Rejestruje odsłony (page_view) dla analityki produktowej — wymaga zgody cookies (useTelemetry). */
export default function TelemetryRouteListener() {
  const location = useLocation();
  const { trackPageView } = useTelemetry();

  useEffect(() => {
    const path = `${location.pathname}${location.search || ""}`;
    trackPageView(path);
  }, [location.pathname, location.search, trackPageView]);

  return null;
}
