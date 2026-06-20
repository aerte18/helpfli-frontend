import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useTelemetry } from "../hooks/useTelemetry";
import { recordPageHit } from "../utils/recordPageHit";

/** Rejestruje wejście sesji (1×) i odsłony page_view — telemetria wymaga zgody cookies (useTelemetry). */
export default function TelemetryRouteListener() {
  const location = useLocation();
  const { trackPageView } = useTelemetry();

  useEffect(() => {
    const path = `${location.pathname}${location.search || ""}`;
    recordPageHit(location.pathname);
    trackPageView(path);
  }, [location.pathname, location.search, trackPageView]);

  return null;
}
