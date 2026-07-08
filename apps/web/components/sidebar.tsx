"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  LayoutDashboard,
  Building2,
  FolderOpen,
  Megaphone,
  CalendarRange,
  Users,
  BarChart3,
  CheckSquare,
  Tablet,
  Settings,
  ShieldCheck,
  ChevronDown,
  Volume2,
} from "lucide-react";

interface SidebarLink {
  id: string;
  label: string;
  path: string;
  icon: React.ReactNode;
  feature?: string;
  hasDropdown?: boolean;
}

export default function Sidebar() {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [tenantFeatures, setTenantFeatures] = useState<string[]>([]);
  const [approvalsCount, setApprovalsCount] = useState(7);
  const userRole = (user?.publicMetadata?.role as string) || "client_admin";

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    loadTenantAndRole();
  }, [isLoaded, isSignedIn]);

  async function loadTenantAndRole() {
    try {
      const token = (await getToken()) || undefined;
      // Fetch current tenant to get enabled features
      const tenantData = await api.get("/api/tenants/current", token);
      if (tenantData && tenantData.features) {
        setTenantFeatures(tenantData.features);
      } else {
        // Default fallbacks in case of mock/empty DB column
        setTenantFeatures(["analytics", "campaigns", "playlists", "edge-nodes", "billing"]);
      }

      // Fetch approval statistics to show pending count badge
      const stats = await api.get("/approvals/stats", token);
      if (stats && stats.pending !== undefined) {
        setApprovalsCount(stats.pending);
      }
    } catch (e) {
      console.warn("Failed to load sidebar metadata, using defaults", e);
      setTenantFeatures(["analytics", "campaigns", "playlists", "edge-nodes", "billing"]);
      setApprovalsCount(4);
    }
  }

  const links: SidebarLink[] = [
    { id: "dashboard", label: "Resumen", path: "/dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: "players", label: "Reproductores", path: "/settings/edge-nodes", icon: <Volume2 className="h-4 w-4" />, feature: "edge-nodes" },
    { id: "stores", label: "Tiendas", path: "/dashboard/stores", icon: <Building2 className="h-4 w-4" /> },
    { id: "content", label: "Contenido", path: "/playlists", icon: <FolderOpen className="h-4 w-4" />, feature: "playlists", hasDropdown: true },
    { id: "campaigns", label: "Campañas", path: "/campaigns", icon: <Megaphone className="h-4 w-4" />, feature: "campaigns" },
    { id: "schedules", label: "Programación", path: "/sync", icon: <CalendarRange className="h-4 w-4" />, feature: "playlists" },
    { id: "advertisers", label: "Anunciantes", path: "/developer", icon: <Users className="h-4 w-4" />, feature: "campaigns" },
    { id: "analytics", label: "Analíticas", path: "/dashboard/analytics", icon: <BarChart3 className="h-4 w-4" />, feature: "analytics", hasDropdown: true },
    { 
      id: "approvals", 
      label: "Aprobaciones", 
      path: "/approvals", 
      icon: <CheckSquare className="h-4 w-4" /> 
    },
    { id: "devices", label: "Dispositivos", path: "/settings/edge-nodes", icon: <Tablet className="h-4 w-4" />, feature: "edge-nodes" },
    { id: "config", label: "Configuración", path: "/settings/deprovision", icon: <Settings className="h-4 w-4" /> },
  ];

  // Helper to determine if link is visible based on features
  function isLinkVisible(link: SidebarLink) {
    // If it's approvals or config or dashboard, always show
    if (!link.feature) return true;
    // Otherwise, check if tenant has it enabled
    return tenantFeatures.includes(link.feature);
  }

  return (
    <aside className="w-64 bg-[#030303] border-r border-slate-900 flex flex-col justify-between h-screen fixed top-0 left-0 z-40 select-none">
      
      {/* Top Logo Section */}
      <div>
        <div className="p-6 flex items-center gap-2 border-b border-slate-950/60">
          <div className="flex items-center gap-2.5">
            {/* Golden sound waves icon */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 10V14" stroke="#EAB308" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M8 6V18" stroke="#EAB308" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M12 3V21" stroke="#EAB308" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M16 8V16" stroke="#FACC15" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M20 11V13" stroke="#FACC15" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            <div>
              <span className="text-sm font-black tracking-widest text-white block uppercase">
                RETAIL AUDIO
              </span>
              <span className="text-[10px] tracking-[0.2em] font-medium text-amber-500 uppercase block -mt-1 font-mono">
                ENGINE
              </span>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-270px)]">
          {links.filter(isLinkVisible).map((link) => {
            const isActive = pathname === link.path || pathname?.startsWith(link.path + "/");
            return (
              <div key={link.id}>
                <button
                  onClick={() => router.push(link.path)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-300 ${
                    isActive
                      ? "bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black shadow-md shadow-yellow-500/10"
                      : "text-slate-400 hover:text-white hover:bg-slate-900/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {link.icon}
                    <span>{link.label}</span>
                  </div>

                  {link.id === "approvals" && approvalsCount > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black leading-none ${
                      isActive ? "bg-slate-950 text-amber-400" : "bg-amber-500 text-slate-950"
                    }`}>
                      {approvalsCount}
                    </span>
                  )}

                  {link.hasDropdown && (
                    <ChevronDown className={`h-3 w-3 ${isActive ? "text-slate-950" : "text-slate-500"}`} />
                  )}
                </button>
              </div>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="p-4 border-t border-slate-950/60 bg-black space-y-4">
        
        {/* System Health Card */}
        <div className="p-3 bg-slate-950/80 border border-slate-900 rounded-xl flex items-center gap-3">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75 animate-ping" />
            <ShieldCheck className="h-4.5 w-4.5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 leading-none">Estado del sistema</p>
            <p className="text-[11px] font-black text-emerald-400 mt-1 leading-none">Todo funcionando</p>
            
            {/* Visualizer waves indicator */}
            <div className="flex items-end gap-0.5 h-3 mt-2">
              <span className="w-1 bg-emerald-500 rounded-full animate-[pulse_1s_infinite] h-2" />
              <span className="w-1 bg-emerald-500 rounded-full animate-[pulse_0.8s_infinite] h-3" />
              <span className="w-1 bg-emerald-500 rounded-full animate-[pulse_1.2s_infinite] h-1.5" />
              <span className="w-1 bg-emerald-500 rounded-full animate-[pulse_0.7s_infinite] h-2.5" />
              <span className="w-1 bg-emerald-500 rounded-full animate-[pulse_0.9s_infinite] h-1" />
            </div>
          </div>
        </div>

        {/* User profile card */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {user?.imageUrl ? (
              <img src={user.imageUrl} className="w-9 h-9 rounded-xl border border-slate-800 object-cover" alt="Avatar" />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center justify-center font-bold text-xs">
                SA
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate leading-none">
                {user?.fullName || "Admin RA"}
              </p>
              <p className="text-[10px] text-slate-500 mt-1 leading-none font-mono">
                {userRole === "super_admin" ? "Super Admin" : "Client Admin"}
              </p>
            </div>
          </div>
        </div>

        <div className="text-[9px] text-slate-600 text-center font-mono">
          RAE v2.5.0
        </div>
      </div>
    </aside>
  );
}
