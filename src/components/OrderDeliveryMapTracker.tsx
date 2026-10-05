// Source: Google Maps Platform Code Assist
import React, { useEffect, useState, useRef } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
  useMap,
  useMapsLibrary,
  useAdvancedMarkerRef,
} from '@vis.gl/react-google-maps';
import {
  Truck,
  Package,
  MapPin,
  Navigation,
  Clock,
  CheckCircle2,
  Sparkles,
  Scissors,
  ShieldCheck,
} from 'lucide-react';
import { InquiryRecord } from '../types';

const GOOGLE_MAPS_API_KEY = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || '';

interface OrderDeliveryMapTrackerProps {
  order: InquiryRecord & { isPaymentConfirmed?: boolean };
  stageIndex: number; // 0 to 5
}

interface ComputedRouteSummary {
  distanceMeters: number;
  durationMillis: number;
  originPosition: google.maps.LatLngLiteral;
  destinationPosition: google.maps.LatLngLiteral;
  parcelPosition: google.maps.LatLngLiteral;
  routePath: google.maps.LatLngLiteral[];
}

function toLatLngLiteral(pt: any): google.maps.LatLngLiteral {
  if (!pt) return { lat: 0, lng: 0 };
  const lat = typeof pt.lat === 'function' ? pt.lat() : Number(pt.lat);
  const lng = typeof pt.lng === 'function' ? pt.lng() : Number(pt.lng);
  return { lat, lng };
}

function getProgressFractionForStage(stageIndex: number, statusText: string): number {
  const lower = (statusText || '').toLowerCase();
  if (stageIndex >= 5 || lower.includes('deliver') || lower.includes('complet')) return 1.0;
  if (stageIndex === 4 || lower.includes('ship')) return 0.76;
  if (stageIndex === 3 || lower.includes('fitt') || lower.includes('ready')) return 0.45;
  if (stageIndex === 2 || lower.includes('tailor') || lower.includes('production')) return 0.25;
  if (stageIndex === 1 || lower.includes('process') || lower.includes('confirm')) return 0.12;
  return 0.0;
}

function getParcelCheckpointLabel(stageIndex: number, statusText: string, destinationLabel: string): string {
  const lower = (statusText || '').toLowerCase();
  if (stageIndex >= 5 || lower.includes('deliver') || lower.includes('complet')) {
    return `Delivered at ${destinationLabel}`;
  }
  if (stageIndex === 4 || lower.includes('ship')) {
    return `In Transit — En Route to ${destinationLabel}`;
  }
  if (stageIndex === 3 || lower.includes('fitt') || lower.includes('ready')) {
    return 'HOS|TED Quality Inspection & Dispatch Terminal';
  }
  if (stageIndex === 2 || lower.includes('tailor') || lower.includes('production')) {
    return 'HOS|TED Master Tailoring & Finishing Studio';
  }
  if (stageIndex === 1 || lower.includes('process') || lower.includes('confirm')) {
    return 'Payment Confirmed — Queued at HOS|TED Atelier Hub';
  }
  return 'Awaiting Payment Verification at HOS|TED Atelier';
}

interface DeliveryRouteLayerProps {
  originAddress: string;
  destinationAddress: string;
  progressFraction: number;
  isShippedInTransit: boolean;
  order: InquiryRecord;
  checkpointLabel: string;
  onRouteComputed: (summary: ComputedRouteSummary | null, error: string | null, loading: boolean) => void;
}

const DeliveryRouteLayer: React.FC<DeliveryRouteLayerProps> = ({
  originAddress,
  destinationAddress,
  progressFraction,
  isShippedInTransit,
  order,
  checkpointLabel,
  onRouteComputed,
}) => {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const polylinesRef = useRef<google.maps.Polyline[]>([]);
  const [routeData, setRouteData] = useState<ComputedRouteSummary | null>(null);
  const [animatedIndexOffset, setAnimatedIndexOffset] = useState(0);
  const [infoWindowOpen, setInfoWindowOpen] = useState(true);
  const [parcelMarkerRef, parcelMarker] = useAdvancedMarkerRef();

  useEffect(() => {
    if (!routesLib || !map || !originAddress || !destinationAddress) return;

    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];
    onRouteComputed(null, null, true);

    const request = {
      origin: originAddress,
      destination: destinationAddress,
      travelMode: 'DRIVING',
      fields: ['path', 'distanceMeters', 'durationMillis', 'viewport', 'legs'],
    };

    // Reference: https://developers.google.com/maps/documentation/javascript/routes?utm_campaign=gmp_mcp_codeassist_v1_aistudio
    (routesLib.Route as any)
      .computeRoutes(request)
      .then(({ routes }: { routes: any[] }) => {
        if (!routes || routes.length === 0) {
          onRouteComputed(null, 'Unable to compute delivery route for this destination.', false);
          return;
        }

        const primaryRoute = routes[0];
        const rawPath: any[] = Array.isArray(primaryRoute.path) ? primaryRoute.path : [];
        const normalizedPath: google.maps.LatLngLiteral[] = rawPath
          .map(toLatLngLiteral)
          .filter((pt) => !Number.isNaN(pt.lat) && !Number.isNaN(pt.lng));

        // Render route polylines using native createPolylines()
        const createdPolylines: google.maps.Polyline[] = primaryRoute.createPolylines();
        createdPolylines.forEach((polyline: google.maps.Polyline) => {
          polyline.setOptions({
            strokeColor: '#f59e0b',
            strokeOpacity: 0.9,
            strokeWeight: 5,
          });
          polyline.setMap(map);
        });
        polylinesRef.current = createdPolylines;

        if (primaryRoute.viewport) {
          map.fitBounds(primaryRoute.viewport);
        }

        if (normalizedPath.length > 0) {
          const originPos = normalizedPath[0];
          const destPos = normalizedPath[normalizedPath.length - 1];
          const targetIdx = Math.min(
            normalizedPath.length - 1,
            Math.max(0, Math.round((normalizedPath.length - 1) * progressFraction))
          );
          const parcelPos = normalizedPath[targetIdx];

          const summary: ComputedRouteSummary = {
            distanceMeters: primaryRoute.distanceMeters ?? 0,
            durationMillis: primaryRoute.durationMillis ?? 0,
            originPosition: originPos,
            destinationPosition: destPos,
            parcelPosition: parcelPos,
            routePath: normalizedPath,
          };
          setRouteData(summary);
          onRouteComputed(summary, null, false);
        } else {
          onRouteComputed(null, null, false);
        }
      })
      .catch((err: any) => {
        console.error('Error computing delivery route:', err);
        const msg = String(err?.message || err || '');
        if (
          msg.includes('RESOURCE_EXHAUSTED') ||
          msg.includes('OVER_QUERY_LIMIT') ||
          msg.includes('429') ||
          msg.includes('Quota')
        ) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
        onRouteComputed(null, 'Unable to load route data. Please check your delivery address or network.', false);
      });

    return () => {
      polylinesRef.current.forEach((p) => p.setMap(null));
      polylinesRef.current = [];
    };
  }, [routesLib, map, originAddress, destinationAddress, progressFraction]);

  // Subtle real-time pulse movement along the route segment when order is Shipped / In Transit
  useEffect(() => {
    if (!isShippedInTransit || !routeData || routeData.routePath.length < 6) {
      setAnimatedIndexOffset(0);
      return;
    }
    const timer = setInterval(() => {
      setAnimatedIndexOffset((prev) => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(timer);
  }, [isShippedInTransit, routeData]);

  if (!routeData) return null;

  const baseIdx = Math.min(
    routeData.routePath.length - 1,
    Math.max(0, Math.round((routeData.routePath.length - 1) * progressFraction))
  );
  const liveIdx = isShippedInTransit
    ? Math.min(routeData.routePath.length - 2, baseIdx + animatedIndexOffset)
    : baseIdx;
  const liveParcelPos = routeData.routePath[liveIdx] || routeData.parcelPosition;

  return (
    <>
      {/* Origin Marker: HOS|TED Atelier Hub */}
      <AdvancedMarker
        position={routeData.originPosition}
        title="HOS|TED Flagship Atelier & Dispatch Hub"
      >
        <Pin background="#1c1917" borderColor="#f59e0b" glyphColor="#f59e0b" scale={1.1} />
      </AdvancedMarker>

      {/* Destination Marker: Customer Delivery Address */}
      <AdvancedMarker
        position={routeData.destinationPosition}
        title={`Customer Destination: ${destinationAddress}`}
      >
        <Pin background="#10b981" borderColor="#065f46" glyphColor="#ffffff" scale={1.15} />
      </AdvancedMarker>

      {/* Live Parcel Location Marker */}
      <AdvancedMarker
        ref={parcelMarkerRef}
        position={liveParcelPos}
        onClick={() => setInfoWindowOpen(true)}
        title={`Order ${order.id} Live Parcel Position — ${checkpointLabel}`}
      >
        <div className="relative flex items-center justify-center">
          <span className="absolute w-11 h-11 rounded-full bg-amber-400/35 animate-ping" />
          <div className="relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-950 border-2 border-amber-400 text-amber-300 shadow-xl font-mono text-[11px] font-bold whitespace-nowrap">
            <Truck className="w-3.5 h-3.5 text-amber-400" />
            <span>{order.id}</span>
          </div>
        </div>
      </AdvancedMarker>

      {infoWindowOpen && parcelMarker && (
        <InfoWindow
          anchor={parcelMarker}
          maxWidth={260}
          onCloseClick={() => setInfoWindowOpen(false)}
        >
          <div className="text-stone-900 p-1 space-y-1 text-xs font-sans">
            <div className="font-bold text-stone-950 flex items-center gap-1.5">
              <span>Parcel {order.id}</span>
              <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-mono text-[10px]">
                {Math.round(progressFraction * 100)}%
              </span>
            </div>
            <div className="font-medium text-stone-700">
              {order.quantity || 1}x {order.productName || order.category}
            </div>
            <div className="text-[11px] text-stone-600">{checkpointLabel}</div>
          </div>
        </InfoWindow>
      )}
    </>
  );
};

export const OrderDeliveryMapTracker: React.FC<OrderDeliveryMapTrackerProps> = ({
  order,
  stageIndex,
}) => {
  const [routeSummary, setRouteSummary] = useState<ComputedRouteSummary | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [isComputing, setIsComputing] = useState<boolean>(false);

  // HOS|TED Flagship Atelier Dispatch Origin & Customer Destination
  const originAddress = 'Victoria Island, Lagos, Nigeria';
  const destinationParts = [
    order.deliveryAddress,
    order.deliveryCity,
    order.deliveryState || 'Lagos',
    'Nigeria',
  ].filter(Boolean);
  const destinationAddress = destinationParts.join(', ');
  const destinationShortLabel =
    [order.deliveryCity, order.deliveryState].filter(Boolean).join(', ') ||
    order.deliveryState ||
    'Customer Destination';

  const progressFraction = getProgressFractionForStage(stageIndex, order.status);
  const progressPercent = Math.round(progressFraction * 100);
  const isShippedInTransit =
    stageIndex === 4 || (order.status || '').toLowerCase().includes('ship');
  const checkpointLabel = getParcelCheckpointLabel(
    stageIndex,
    order.status,
    destinationShortLabel
  );

  const handleRouteComputed = (
    summary: ComputedRouteSummary | null,
    error: string | null,
    loading: boolean
  ) => {
    setRouteSummary(summary);
    setRouteError(error);
    setIsComputing(loading);
  };

  const distanceKm = routeSummary
    ? (routeSummary.distanceMeters / 1000).toFixed(1)
    : null;
  const durationHours = routeSummary
    ? Math.max(1, Math.round(routeSummary.durationMillis / 60000))
    : null;

  return (
    <div className="rounded-2xl bg-stone-950 border border-stone-800 overflow-hidden shadow-xl space-y-4 p-4 sm:p-6">
      {/* Top Header & Real-Time Parcel Telemetry */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-800 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-bold uppercase tracking-wider">
              <Navigation className="w-3 h-3 text-amber-400" />
              <span>Real-Time Map Delivery Tracker</span>
            </span>
            <span className="font-mono text-xs text-stone-400">
              Parcel ID: <strong className="text-white">{order.id}</strong>
            </span>
          </div>
          <h4 className="text-base sm:text-lg font-serif font-bold text-white">
            {checkpointLabel}
          </h4>
          <p className="text-xs text-stone-400">
            Origin: <span className="text-stone-200">HOS|TED Flagship Atelier ({originAddress})</span> → Destination:{' '}
            <span className="text-amber-300 font-medium">{destinationAddress}</span>
          </p>
        </div>

        {/* Route Distance, ETA & Completion Pill */}
        <div className="flex items-center gap-3 flex-wrap">
          {distanceKm && (
            <div className="px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-xs">
              <span className="text-stone-400 block text-[10px] uppercase">Route Distance</span>
              <strong className="text-white font-mono">{distanceKm} km</strong>
            </div>
          )}
          {durationHours && (
            <div className="px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-xs">
              <span className="text-stone-400 block text-[10px] uppercase">Transit Drive Time</span>
              <strong className="text-white font-mono">
                {durationHours >= 60
                  ? `${Math.floor(durationHours / 60)}h ${durationHours % 60}m`
                  : `${durationHours} mins`}
              </strong>
            </div>
          )}
          <div className="px-3.5 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-xs">
            <span className="text-amber-300 block text-[10px] uppercase font-bold">
              Journey Progress
            </span>
            <strong className="text-amber-400 font-mono text-sm">{progressPercent}%</strong>
          </div>
        </div>
      </div>

      {/* Visual Route Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-stone-400">
          <span className="flex items-center gap-1">
            <Scissors className="w-3 h-3 text-amber-400" />
            <span>HOS|TED Atelier Dispatch</span>
          </span>
          <span className="text-amber-300 font-semibold">{order.status}</span>
          <span className="flex items-center gap-1 text-emerald-400">
            <MapPin className="w-3 h-3" />
            <span>{destinationShortLabel}</span>
          </span>
        </div>
        <div className="w-full h-2.5 bg-stone-900 rounded-full overflow-hidden border border-stone-800">
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400 rounded-full transition-all duration-700"
            style={{ width: `${Math.max(6, progressPercent)}%` }}
          />
        </div>
      </div>

      {/* Interactive Google Map Container (Explicit Height per CF2 & mapId per CF9) */}
      <div className="relative w-full h-[380px] sm:h-[440px] rounded-2xl overflow-hidden border border-stone-800 bg-stone-900">
        {GOOGLE_MAPS_API_KEY ? (
          <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
            <Map
              mapId="DEMO_MAP_ID"
              defaultZoom={6}
              defaultCenter={{ lat: 9.082, lng: 8.6753 }}
              gestureHandling="greedy"
              disableDefaultUI={false}
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
              style={{ width: '100%', height: '100%' }}
            >
              <DeliveryRouteLayer
                originAddress={originAddress}
                destinationAddress={destinationAddress}
                progressFraction={progressFraction}
                isShippedInTransit={isShippedInTransit}
                order={order}
                checkpointLabel={checkpointLabel}
                onRouteComputed={handleRouteComputed}
              />
            </Map>
          </APIProvider>
        ) : (
          <div className="w-full h-full flex items-center justify-center p-6 text-center text-xs text-stone-400">
            Google Maps API Key is initializing. Please refresh the page if the map does not appear.
          </div>
        )}

        {/* Overlay Status Badge on Map */}
        <div className="absolute bottom-3 left-3 right-3 sm:right-auto z-10 bg-stone-950/90 backdrop-blur-md border border-stone-800 rounded-xl px-3.5 py-2.5 text-xs flex items-center gap-3 shadow-lg">
          <div className="w-8 h-8 rounded-lg bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0">
            {stageIndex >= 5 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : isShippedInTransit ? (
              <Truck className="w-4 h-4 animate-bounce" />
            ) : (
              <Package className="w-4 h-4" />
            )}
          </div>
          <div>
            <div className="text-white font-bold flex items-center gap-2">
              <span>Live Parcel Marker: {order.id}</span>
              {isComputing && (
                <span className="text-[10px] text-amber-400 font-normal animate-pulse">
                  Calculating route...
                </span>
              )}
            </div>
            <div className="text-[11px] text-stone-300">
              {routeError ? routeError : checkpointLabel}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
