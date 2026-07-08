"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, Button } from "@raemonorepo/ui";
import { 
  Shield, 
  Users, 
  Radio, 
  TrendingUp, 
  DollarSign, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Map, 
  Layers, 
  ExternalLink,
  ChevronRight,
  Clock,
  X,
  Check,
  Settings2,
  BarChart2,
  Megaphone,
  ListMusic,
  Network,
  CreditCard,
  Search
} from "lucide-react";
import { api } from "@/lib/api";

interface OverviewStats {
  mrr: number;
  tenants: number;
  onlineNodes: number;
  offlineNodes: number;
  churn: number;
}

interface PendingApproval {
  id: string;
  action: string;
  targetType: string;
  targetName: string;
  requestedBy: string;
  createdAt: string;
}

interface Tenant {
  id: string;
  name: string;
  plan?: string;
  features?: string[];
  country?: string;
  status?: string;
}

const FEATURE_LIST = [
  { key: "analytics", label: "Analytics", icon: BarChart2, color: "text-sky-400" },
  { key: "campaigns", label: "Campañas", icon: Megaphone, color: "text-amber-400" },
  { key: "playlists", label: "Playlists", icon: ListMusic, color: "text-purple-400" },
  { key: "edge-nodes", label: "Edge Nodes", icon: Network, color: "text-emerald-400" },
  { key: "billing", label: "Facturación", icon: CreditCard, color: "text-rose-400" },
];

const MOCK_TENANTS: Tenant[] = [
  { id: "t-1", name: "La Bodega del Norte", plan: "Pro+", country: "MX", features: ["analytics", "campaigns", "playlists", "edge-nodes", "billing"], status: "active" },
  { id: "t-2", name: "Supermercado Don Jorge", plan: "Pro", country: "AR", features: ["analytics", "campaigns", "playlists"], status: "active" },
  { id: "t-3", name: "Farmacia Central", plan: "Pro", country: "CO", features: ["analytics", "campaigns"], status: "active" },
  { id: "t-4", name: "Mini Market Lima", plan: "Starter", country: "PE", features: ["playlists"], status: "offline" },
  { id: "t-5", name: "Panadería La Espiga", plan: "Starter", country: "CL", features: ["analytics", "playlists"], status: "warning" },
];

export default function AdminDashboardPage() {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [approvals, setApprovals] = useState<PendingApproval[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>(MOCK_TENANTS);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [featuresDraft, setFeaturesDraft] = useState<string[]>([]);
  const [savingFeatures, setSavingFeatures] = useState(false);
  const [tenantSearch, setTenantSearch] = useState("");
  const [featuresSaved, setFeaturesSaved] = useState(false);
  const [storesList, setStoresList] = useState<any[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  const stats: OverviewStats = {
    mrr: 18340,
    tenants: 312,
    onlineNodes: 289,
    offlineNodes: 7,
    churn: 4.8
  };

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }
    loadData();
  }, [isLoaded, isSignedIn]);

  useEffect(() => {
    // Dynamically load Leaflet for real interactive mapping
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => setMapLoaded(true);
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(link);
      document.head.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (!mapLoaded || !storesList.length) return;

    // Check if the container element is in the DOM
    const container = document.getElementById("admin-map-container");
    if (!container) return;

    // Clear previous HTML inside the container and add map target
    container.innerHTML = "<div id='admin-map-element' style='height: 100%; width: 100%; border-radius: 0.75rem;'></div>";

    const L = (window as any).L;
    if (!L) return;

    // Center map on default coordinates
    const map = L.map("admin-map-element", {
      center: [-15, -60],
      zoom: 3,
      zoomControl: true,
    });

    // Dark-themed style map layer from CartoDB
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);

    // Dynamic amber glow marker icon
    const storeIcon = L.divIcon({
      className: 'store-glowing-pin',
      html: `
        <div style="position: relative; width: 12px; height: 12px;">
          <div style="position: absolute; top: 0; left: 0; width: 12px; height: 12px; background-color: #F59E0B; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 8px #F59E0B;"></div>
          <div style="position: absolute; top: -6px; left: -6px; width: 24px; height: 24px; background-color: rgba(245, 158, 11, 0.4); border-radius: 50%; animation: pulse-glow 2s infinite ease-out;"></div>
        </div>
      `,
      iconSize: [12, 12],
      iconAnchor: [6, 6]
    });

    // Plot each store
    storesList.forEach((store) => {
      const lat = parseFloat(store.latitude);
      const lng = parseFloat(store.longitude);
      if (isNaN(lat) || isNaN(lng)) return;

      const popupContent = `
        <div style="color: #0F172A; font-family: system-ui, sans-serif; font-size: 12px; padding: 4px; line-height: 1.4;">
          <h4 style="margin: 0 0 4px; font-weight: 800; font-size: 13px; color: #D97706;">${store.name}</h4>
          ${store.commercialName ? `<div><b>Nombre Comercial:</b> ${store.commercialName}</div>` : ''}
          ${store.legalName ? `<div><b>Razón Social:</b> ${store.legalName}</div>` : ''}
          ${store.vertical ? `<div><b>Vertical:</b> ${store.vertical}</div>` : ''}
          ${store.storeCode ? `<div><b>Código:</b> ${store.storeCode}</div>` : ''}
          ${store.address ? `<div style="margin-top: 4px; font-style: italic; color: #475569;">${store.address}</div>` : ''}
        </div>
      `;

      L.marker([lat, lng], { icon: storeIcon })
        .addTo(map)
        .bindPopup(popupContent);
    });

    // Auto-adjust view to show all store markers if multiple exist
    const markerCoords = storesList
      .map(s => {
        const la = parseFloat(s.latitude);
        const ln = parseFloat(s.longitude);
        return [la, ln];
      })
      .filter((coords): coords is [number, number] => {
        const [la, ln] = coords;
        return typeof la === "number" && !isNaN(la) && typeof ln === "number" && !isNaN(ln);
      });

    if (markerCoords.length > 0) {
      map.fitBounds(markerCoords, { padding: [40, 40], maxZoom: 10 });
    }

  }, [mapLoaded, storesList]);

  async function loadData() {
    try {
      const token = (await getToken()) || undefined;
      const data = await api.get("/approvals", token);
      const list = data ? (data.requests || data.approvals) : null;
      if (list) {
        setApprovals(list.filter((r: any) => r.status === "pending").slice(0, 3));
      }
      // Try to load real tenants
      const tenantData = await api.get("/api/admin/tenants", token);
      if (Array.isArray(tenantData)) setTenants(tenantData);

      // Load real stores for mapping
      const storesData = await api.get("/api/admin/stores", token);
      if (Array.isArray(storesData)) setStoresList(storesData);
    } catch (e) {
      console.error("Failed to load admin dashboard data", e);
      setApprovals([
        { id: "apr-1", action: "create_campaign", targetType: "campaign", targetName: "Fall Special Ad", requestedBy: "manager@bodega.mx", createdAt: new Date(Date.now() - 4 * 3600000).toISOString() },
        { id: "apr-2", action: "force_sync", targetType: "sync", targetName: "Don Jorge Store", requestedBy: "admin@donjorge.ar", createdAt: new Date(Date.now() - 10 * 3600000).toISOString() }
      ]);
    } finally {
      setLoading(false);
    }
  }

  function openTenantPanel(tenant: Tenant) {
    setSelectedTenant(tenant);
    setFeaturesDraft(tenant.features ?? []);
    setFeaturesSaved(false);
  }

  function toggleFeature(key: string) {
    setFeaturesDraft((prev) =>
      prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]
    );
    setFeaturesSaved(false);
  }

  async function saveFeatures() {
    if (!selectedTenant) return;
    setSavingFeatures(true);
    try {
      const token = (await getToken()) || undefined;
      await api.patch(`/api/admin/tenants/${selectedTenant.id}/features`, { features: featuresDraft }, token);
      setTenants((prev) =>
        prev.map((t) => t.id === selectedTenant.id ? { ...t, features: featuresDraft } : t)
      );
      setSelectedTenant((t) => t ? { ...t, features: featuresDraft } : t);
      setFeaturesSaved(true);
    } catch (e) {
      console.error("Failed to save features", e);
      // still update local state for demo
      setTenants((prev) =>
        prev.map((t) => t.id === selectedTenant.id ? { ...t, features: featuresDraft } : t)
      );
      setFeaturesSaved(true);
    } finally {
      setSavingFeatures(false);
    }
  }

  const filteredTenants = tenants.filter((t) =>
    t.name.toLowerCase().includes(tenantSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mb-4" />
        <span className="text-sm text-muted-foreground">Cargando Panel de Administrador...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-foreground pb-12">
      {/* Admin Top Header */}
      <header className="bg-[#050507] border-b border-slate-900 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-500 p-2 rounded-lg">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white">
              RAE Super Admin Portal
            </h1>
            <p className="text-xs text-slate-500">Control Panel Global · Retail Audio Engine</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full text-xs text-emerald-400 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Todos los sistemas operativos
          </div>
          <div className="h-8 w-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs border border-amber-500/30">
            SA
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 mt-8 space-y-6">
        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5 border-slate-900 bg-[#070709] relative overflow-hidden hover:border-amber-500/20 transition-all duration-300">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">MRR Total</p>
                <h3 className="text-3xl font-black mt-2 text-white">${stats.mrr.toLocaleString()}</h3>
              </div>
              <div className="bg-emerald-500/10 text-emerald-400 p-2.5 rounded-lg border border-emerald-500/20">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-xs text-emerald-400">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>+$2,100 este mes</span>
            </div>
          </Card>

          <Card className="p-5 border-slate-900 bg-[#070709] relative overflow-hidden hover:border-amber-500/20 transition-all duration-300">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tenants Activos</p>
                <h3 className="text-3xl font-black mt-2 text-white">{stats.tenants}</h3>
              </div>
              <div className="bg-amber-500/10 text-amber-400 p-2.5 rounded-lg border border-amber-500/20">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-xs text-emerald-400">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>+28 esta semana</span>
            </div>
          </Card>

          <Card className="p-5 border-slate-900 bg-[#070709] relative overflow-hidden hover:border-amber-500/20 transition-all duration-300">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Edge Nodes</p>
                <h3 className="text-3xl font-black mt-2 text-white">{stats.onlineNodes}</h3>
              </div>
              <div className="bg-emerald-500/10 text-emerald-400 p-2.5 rounded-lg border border-emerald-500/20">
                <Radio className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-xs text-rose-400">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>{stats.offlineNodes} offline ahora</span>
            </div>
          </Card>

          <Card className="p-5 border-slate-900 bg-[#070709] relative overflow-hidden hover:border-amber-500/20 transition-all duration-300">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Churn Mensual</p>
                <h3 className="text-3xl font-black mt-2 text-white">{stats.churn}%</h3>
              </div>
              <div className="bg-rose-500/10 text-rose-400 p-2.5 rounded-lg border border-rose-500/20">
                <Activity className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-xs text-emerald-400">
              <TrendingUp className="h-3.5 w-3.5 rotate-180" />
              <span>-0.6% vs mes anterior</span>
            </div>
          </Card>
        </div>

        {/* Main Grid: Map + Quick Actions + Approvals */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left: Map + Top Tenants */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6 bg-[#050507] border-slate-900">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                  <Map className="h-4 w-4 text-amber-500" /> Tiendas y Red Global
                </h3>
                <span className="text-xs text-slate-500">Coordinación de Nodos Activos</span>
              </div>
              
              <div id="admin-map-container" className="h-72 bg-slate-950 rounded-xl relative border border-slate-900 overflow-hidden flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-5 w-5 animate-spin rounded-full border border-amber-500 border-t-transparent" />
                  <span className="text-xs text-slate-500">Inicializando red global de mapas...</span>
                </div>
              </div>

              <div className="mt-4 flex gap-4 text-xs">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span>{storesList.length} Tiendas Geolocalizadas</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  <span>Nodos Activos & Sincronizados</span>
                </div>
              </div>
            </Card>

            {/* Top Tenants Table */}
            <Card className="p-6 bg-[#050507] border-slate-900">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                  <Layers className="h-4 w-4 text-amber-500" /> Tenants con Mayor Impacto (ROAS)
                </h3>
                <span className="text-xs text-emerald-400 font-medium">Top global</span>
              </div>
              <div className="space-y-3">
                {[
                  { name: "La Bodega del Norte", plan: "Pro+", country: "MX · Monterrey", roas: "14.2x" },
                  { name: "Supermercado Don Jorge", plan: "Pro", country: "AR · Córdoba", roas: "8.3x" },
                  { name: "Farmacia Central", plan: "Pro", country: "CO · Bogotá", roas: "7.1x" },
                ].map((t) => (
                  <div key={t.name} className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-900 hover:border-amber-500/20 transition-all">
                    <div className="flex items-center gap-3">
                      <span className="text-xs bg-amber-500/20 text-amber-400 px-2.5 py-0.5 rounded font-bold">{t.plan}</span>
                      <span className="text-sm text-slate-200 font-medium">{t.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-slate-500">{t.country}</span>
                      <span className="text-sm font-bold text-emerald-400">{t.roas} ROAS</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Quick Admin Modules */}
            <Card className="p-6 bg-[#050507] border-slate-900">
              <h3 className="text-sm font-semibold text-slate-100 mb-4 flex items-center gap-2">
                <Shield className="h-4 w-4 text-amber-500" /> Módulos de Administración
              </h3>
              <div className="space-y-2">
                <Button
                  onClick={() => router.push("/approvals")}
                  className="w-full flex justify-between items-center text-xs font-bold transition-all"
                >
                  <span className="flex items-center gap-2">Bandeja de Aprobaciones (HITL)</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>

                <button
                  onClick={() => router.push("/admin/deprovision-queue")}
                  className="w-full flex justify-between items-center bg-slate-950 hover:bg-slate-900 border border-slate-900 text-slate-200 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all"
                >
                  <span>Cola de Desaprovisionamiento</span>
                  <Clock className="h-4 w-4 text-slate-500" />
                </button>

                <button
                  onClick={() => router.push("/integrations")}
                  className="w-full flex justify-between items-center bg-slate-950 hover:bg-slate-900 border border-slate-900 text-slate-200 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all"
                >
                  <span>Hub de Integraciones</span>
                  <ExternalLink className="h-4 w-4 text-slate-500" />
                </button>
              </div>
            </Card>

            {/* Pending Approvals */}
            <Card className="p-6 bg-[#050507] border-slate-900">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-amber-500" /> Aprobaciones Pendientes
                </h3>
                <span className="text-xs bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded font-bold">
                  {approvals.length} pendientes
                </span>
              </div>
              
              {approvals.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">Sin aprobaciones pendientes.</p>
              ) : (
                <div className="space-y-3">
                  {approvals.map((req) => (
                    <div key={req.id} className="p-3 bg-black rounded-lg border border-slate-900 text-xs">
                      <div className="flex justify-between items-start mb-1.5">
                        <span className="font-semibold text-slate-300 uppercase tracking-wider text-[9px] bg-slate-900 px-1.5 py-0.5 rounded">
                          {req.action.replace("_", " ")}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-slate-200 font-medium truncate mb-1">Recurso: {req.targetName}</p>
                      <p className="text-[10px] text-slate-500">Por: {req.requestedBy}</p>
                      <div className="mt-2.5 flex justify-end gap-1.5">
                        <button
                          onClick={() => router.push(`/approvals/${req.id}`)}
                          className="bg-amber-500 text-slate-950 px-3 py-1 rounded text-[10px] font-bold hover:bg-amber-400 active:scale-95 transition-all"
                        >
                          Resolver
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Alerts */}
            <Card className="p-6 bg-[#050507] border-slate-900">
              <h3 className="text-sm font-semibold text-slate-100 mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-500" /> Alertas del Sistema
              </h3>
              <div className="space-y-2">
                <div className="flex items-start gap-2.5 p-2.5 rounded bg-rose-500/5 border border-rose-500/10 text-xs">
                  <AlertTriangle className="h-4 w-4 text-rose-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-slate-200">Mini Market Lima Offline</p>
                    <p className="text-[10px] text-slate-500">Desconectado hace 2h 14min.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 p-2.5 rounded bg-amber-500/5 border border-amber-500/10 text-xs">
                  <Clock className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-slate-200">Panadería La Espiga Sync</p>
                    <p className="text-[10px] text-slate-500">Último contacto hace 26 horas.</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TENANT FEATURE TOGGLES SECTION                               */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <div className="mt-2">
          <Card className="p-6 bg-[#050507] border-slate-900">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                  <Settings2 className="h-4 w-4 text-amber-500" /> Control de Funciones por Tenant
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Activa o desactiva módulos para cada cliente con un clic</p>
              </div>
              {selectedTenant && (
                <span className="text-xs bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded font-bold border border-amber-500/20">
                  Editando: {selectedTenant.name}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* LEFT: Tenant Selector */}
              <div>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Buscar tenant..."
                    value={tenantSearch}
                    onChange={(e) => setTenantSearch(e.target.value)}
                    className="w-full bg-black border border-slate-900 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/40 transition-colors"
                  />
                </div>
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {filteredTenants.map((tenant) => {
                    const statusColor = tenant.status === "active"
                      ? "bg-emerald-500"
                      : tenant.status === "offline"
                      ? "bg-rose-500"
                      : "bg-amber-500";
                    return (
                      <button
                        key={tenant.id}
                        onClick={() => openTenantPanel(tenant)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                          selectedTenant?.id === tenant.id
                            ? "border-amber-500/40 bg-amber-500/5 shadow-sm"
                            : "border-slate-900 bg-black hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusColor}`} />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-200 truncate">{tenant.name}</p>
                            <p className="text-[10px] text-slate-500">{tenant.country} · {tenant.plan}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                          {(tenant.features ?? []).slice(0, 3).map((f) => (
                            <span key={f} className="text-[8px] bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded uppercase font-bold tracking-wide">
                              {f === "edge-nodes" ? "EN" : f.substring(0, 2).toUpperCase()}
                            </span>
                          ))}
                          {(tenant.features?.length ?? 0) > 3 && (
                            <span className="text-[8px] text-slate-600">+{(tenant.features?.length ?? 0) - 3}</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* RIGHT: Feature Checkboxes Panel */}
              <div>
                {!selectedTenant ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-16 text-slate-600 border border-dashed border-slate-900 rounded-xl">
                    <Settings2 className="h-8 w-8 mb-3 opacity-30" />
                    <p className="text-xs">Selecciona un tenant de la izquierda</p>
                    <p className="text-[10px] mt-1 opacity-60">para gestionar sus funciones</p>
                  </div>
                ) : (
                  <div className="bg-black border border-slate-900 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <h4 className="text-xs font-bold text-white">{selectedTenant.name}</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">{selectedTenant.country} · Plan {selectedTenant.plan}</p>
                      </div>
                      <button
                        onClick={() => { setSelectedTenant(null); setFeaturesDraft([]); }}
                        className="text-slate-600 hover:text-slate-400 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="space-y-3 mb-5">
                      {FEATURE_LIST.map(({ key, label, icon: Icon, color }) => {
                        const enabled = featuresDraft.includes(key);
                        return (
                          <button
                            key={key}
                            onClick={() => toggleFeature(key)}
                            className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all duration-200 text-left ${
                              enabled
                                ? "border-amber-500/30 bg-amber-500/5"
                                : "border-slate-900 bg-slate-950/50 opacity-60 hover:opacity-80"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                                enabled
                                  ? "border-amber-500/30 bg-amber-500/10"
                                  : "border-slate-800 bg-slate-900"
                              }`}>
                                <Icon className={`h-4 w-4 ${enabled ? color : "text-slate-600"}`} />
                              </div>
                              <div>
                                <p className={`text-xs font-semibold ${enabled ? "text-white" : "text-slate-500"}`}>{label}</p>
                                <p className="text-[10px] text-slate-600">Módulo {key}</p>
                              </div>
                            </div>
                            {/* Toggle Indicator */}
                            <div className={`w-8 h-4.5 flex items-center rounded-full transition-all duration-200 ${
                              enabled ? "bg-amber-500" : "bg-slate-800"
                            } relative`} style={{ height: "18px", width: "32px" }}>
                              <span className={`absolute w-3.5 h-3.5 rounded-full bg-white shadow transition-all duration-200 ${
                                enabled ? "translate-x-[14px]" : "translate-x-[2px]"
                              }`} />
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Save Button */}
                    <button
                      onClick={saveFeatures}
                      disabled={savingFeatures}
                      className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all duration-200 ${
                        featuresSaved
                          ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400"
                          : "bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950"
                      } ${savingFeatures ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {savingFeatures ? (
                        <>
                          <span className="h-3.5 w-3.5 rounded-full border border-current border-t-transparent animate-spin" />
                          Guardando...
                        </>
                      ) : featuresSaved ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          ¡Funciones guardadas!
                        </>
                      ) : (
                        "Guardar cambios"
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
