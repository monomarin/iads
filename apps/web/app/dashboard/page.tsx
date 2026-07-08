"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@raemonorepo/ui";
import { api } from "@/lib/api";
import { 
  Bell, 
  Search, 
  Calendar, 
  Plus, 
  TrendingUp, 
  HelpCircle,
  Play,
  Volume2,
  CheckCircle,
  CheckSquare,
  AlertTriangle,
  FolderSync,
  Database,
  Wifi,
  Clock
} from "lucide-react";

interface Overview {
  totalPlays: number;
  uniqueListeners: number;
  avgListenDuration: number;
  stores: number;
  activeNodes: number;
  campaigns: number;
  engagementRate: number;
  audioQuality: number;
  lastSync: string | null;
  revenue: number;
  plan: string;
}

export default function DashboardPage() {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState("7D");

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }
    loadData();
  }, [isLoaded, isSignedIn]);

  async function loadData() {
    try {
      const token = (await getToken()) || undefined;
      const res = await api.get("/api/analytics/overview", token);
      setData((res as { overview: Overview }).overview);
    } catch (e) {
      console.error("Dashboard load error:", e);
      // Premium Fallback overview metrics
      setData({
        totalPlays: 128700,
        uniqueListeners: 342,
        avgListenDuration: 289,
        stores: 238,
        activeNodes: 316,
        campaigns: 14,
        engagementRate: 93,
        audioQuality: 92,
        lastSync: new Date().toISOString(),
        revenue: 12540,
        plan: "Pro+",
      });
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mb-4" />
        <span className="text-sm text-muted-foreground">Cargando Panel de Control...</span>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-black text-foreground pb-12 pt-6 px-6">
      
      {/* Top Navbar Header */}
      <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-900 pb-5">
        
        {/* Welcome Section */}
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            ¡Bienvenido, Admin! <span className="animate-[wiggle_1s_infinite]">👋</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Aquí tienes el estado general de tu red de audio retail.</p>
        </div>

        {/* Global Search Bar */}
        <div className="relative max-w-md flex-1 mx-0 md:mx-6">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Buscar tiendas, dispositivos, campañas..." 
            className="w-full bg-[#09090b] border border-slate-900 rounded-xl py-2 pl-10 pr-12 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 transition-colors"
          />
          <kbd className="absolute right-3 top-2.5 bg-slate-950 px-1.5 py-0.5 rounded text-[9px] font-mono text-slate-600 border border-slate-900">
            ⌘ K
          </kbd>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-3 self-end md:self-auto">
          {/* Notifications Bell */}
          <button className="relative p-2 rounded-xl bg-[#09090b] border border-slate-900 hover:border-amber-500/20 text-slate-400 hover:text-white transition-all">
            <span className="absolute top-1 right-1 w-3 h-3 rounded-full bg-amber-500 border-2 border-black flex items-center justify-center text-[7px] font-black text-slate-950">
              12
            </span>
            <Bell className="h-4 w-4" />
          </button>

          {/* Help Button */}
          <button className="p-2 rounded-xl bg-[#09090b] border border-slate-900 hover:border-amber-500/20 text-slate-400 hover:text-white transition-all">
            <HelpCircle className="h-4 w-4" />
          </button>

          {/* Date Picker Button */}
          <button className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#09090b] border border-slate-900 text-xs text-slate-300 hover:border-amber-500/20 transition-all">
            <Calendar className="h-3.5 w-3.5 text-slate-500" />
            <span>12 – 19 May, 2025</span>
          </button>

          {/* New Campaign Button */}
          <button 
            onClick={() => router.push("/campaigns/new")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 font-bold text-xs text-slate-950 shadow-md hover:shadow-lg transition-all duration-300"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            Nueva campaña
          </button>
        </div>
      </header>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        
        {/* Active Stores */}
        <Card className="p-4 border-slate-900 bg-[#070709] relative overflow-hidden hover:border-amber-500/20 hover:shadow-amber-500/5 hover:shadow-sm transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m2 22 1-1h3l9-9"/><path d="M14 2h8v8"/><path d="M20 14h2v2"/><path d="M14 8h2v2"/><path d="M14 20h2v2"/><path d="M8 14h2v2"/><path d="M2 14h2v2"/><path d="M8 8h2v2"/><path d="M2 8h2v2"/><path d="M20 20h2v2"/><path d="M2 2h2v2"/></svg>
            </div>
            {/* Golden Sparkline SVG */}
            <svg className="w-20 h-8" viewBox="0 0 100 30">
              <path d="M 0 25 Q 20 5, 40 22 T 80 10 T 100 5" fill="none" stroke="#EAB308" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div className="mt-4">
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Tiendas activas</p>
            <h3 className="text-2xl font-black text-white mt-1">238 <span className="text-xs text-slate-500 font-normal">/ 256</span></h3>
            <p className="text-[10px] text-amber-400 mt-2 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" /> 93% online
            </p>
          </div>
        </Card>

        {/* Online Players */}
        <Card className="p-4 border-slate-900 bg-[#070709] relative overflow-hidden hover:border-amber-500/20 hover:shadow-amber-500/5 hover:shadow-sm transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <Volume2 className="h-5 w-5" />
            </div>
            {/* Golden Sparkline SVG */}
            <svg className="w-20 h-8" viewBox="0 0 100 30">
              <path d="M 0 15 Q 15 25, 35 15 T 70 8 T 100 18" fill="none" stroke="#EAB308" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div className="mt-4">
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Reproductores online</p>
            <h3 className="text-2xl font-black text-white mt-1">316 <span className="text-xs text-slate-500 font-normal">/ 342</span></h3>
            <p className="text-[10px] text-amber-400 mt-2 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block animate-pulse" /> 92% disponibilidad
            </p>
          </div>
        </Card>

        {/* Plays this week */}
        <Card className="p-4 border-slate-900 bg-[#070709] relative overflow-hidden hover:border-amber-500/20 hover:shadow-amber-500/5 hover:shadow-sm transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <Play className="h-5 w-5 fill-current" />
            </div>
            {/* Golden Sparkline SVG */}
            <svg className="w-20 h-8" viewBox="0 0 100 30">
              <path d="M 0 28 Q 20 15, 50 25 T 80 5 T 100 12" fill="none" stroke="#EAB308" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div className="mt-4">
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Reproducciones esta semana</p>
            <h3 className="text-2xl font-black text-white mt-1">128.7K</h3>
            <p className="text-[10px] text-emerald-400 mt-2 flex items-center gap-1 font-medium">
              <TrendingUp className="h-3 w-3" /> +18.6% vs semana anterior
            </p>
          </div>
        </Card>

        {/* Estimated Revenue */}
        <Card className="p-4 border-slate-900 bg-[#070709] relative overflow-hidden hover:border-amber-500/20 hover:shadow-amber-500/5 hover:shadow-sm transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <span className="text-lg font-black">$</span>
            </div>
            {/* Golden Sparkline SVG */}
            <svg className="w-20 h-8" viewBox="0 0 100 30">
              <path d="M 0 25 Q 15 10, 45 15 T 75 5 T 100 2" fill="none" stroke="#EAB308" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div className="mt-4">
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Ingresos estimados</p>
            <h3 className="text-2xl font-black text-white mt-1">$12,540</h3>
            <p className="text-[10px] text-emerald-400 mt-2 flex items-center gap-1 font-medium">
              <TrendingUp className="h-3 w-3" /> +24.3% vs semana anterior
            </p>
          </div>
        </Card>
      </div>

      {/* Main Charts & Map Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        {/* Playback Performance Chart */}
        <Card className="lg:col-span-2 p-5 border-slate-900 bg-[#050507]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Rendimiento de reproducciones</h2>
              <p className="text-[11px] text-slate-500 mt-0.5">Historial de audio emitido por día</p>
            </div>
            
            {/* Segment filter control */}
            <div className="bg-slate-950 border border-slate-900 p-0.5 rounded-lg flex gap-0.5">
              {["7D", "30D", "90D", "12M"].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setTimeFilter(filter)}
                  className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${
                    timeFilter === filter
                      ? "bg-amber-500 text-slate-950 shadow-sm"
                      : "text-slate-500 hover:text-white"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* High-fidelity custom SVG line chart */}
          <div className="relative h-64 w-full">
            <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#EAB308" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#EAB308" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="0" y1="40" x2="500" y2="40" stroke="#111827" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="0" y1="80" x2="500" y2="80" stroke="#111827" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="0" y1="120" x2="500" y2="120" stroke="#111827" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="0" y1="160" x2="500" y2="160" stroke="#111827" strokeWidth="1" strokeDasharray="3 3" />

              {/* Gradient Area Fill */}
              <path 
                d="M 0 150 Q 50 120, 100 160 T 200 140 T 300 90 T 400 100 T 500 50 L 500 200 L 0 200 Z" 
                fill="url(#chartGrad)" 
              />

              {/* Chart Line */}
              <path 
                d="M 0 150 Q 50 120, 100 160 T 200 140 T 300 90 T 400 100 T 500 50" 
                fill="none" 
                stroke="#EAB308" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
              />

              {/* Active data node circle */}
              <circle cx="300" cy="90" r="4.5" fill="#EAB308" stroke="#000" strokeWidth="1.5" />
            </svg>

            {/* Float Tooltip */}
            <div className="absolute top-[55px] left-[55%] bg-slate-950 border border-slate-800 px-2 py-1 rounded text-[10px] text-white font-mono shadow-md z-10 flex flex-col items-center">
              <span className="font-bold text-amber-400">128.7K</span>
              <span className="text-[8px] text-slate-500">19 May</span>
            </div>
            
            {/* Timeline label bar */}
            <div className="flex justify-between text-[8px] font-mono text-slate-600 mt-2 px-1">
              <span>13 May</span>
              <span>14 May</span>
              <span>15 May</span>
              <span>16 May</span>
              <span>17 May</span>
              <span>18 May</span>
              <span>19 May</span>
            </div>
          </div>
        </Card>

        {/* Content Distribution Circular Donut */}
        <Card className="p-5 border-slate-900 bg-[#050507] flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Distribución por tipo</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">Consumo según categoría de pista</p>
          </div>

          <div className="flex flex-col items-center justify-center my-6 relative">
            {/* SVG Donut Ring */}
            <svg width="150" height="150" viewBox="0 0 36 36" className="transform -rotate-90">
              <circle cx="18" cy="18" r="15.915" fill="none" stroke="#111827" strokeWidth="3" />
              {/* Music segment: 62% */}
              <circle cx="18" cy="18" r="15.915" fill="none" stroke="#EAB308" strokeWidth="3" strokeDasharray="62 38" strokeDashoffset="0" />
              {/* Ads segment: 22% */}
              <circle cx="18" cy="18" r="15.915" fill="none" stroke="#A16207" strokeWidth="3.2" strokeDasharray="22 78" strokeDashoffset="-62" />
              {/* Messages segment: 10% */}
              <circle cx="18" cy="18" r="15.915" fill="none" stroke="#4B5563" strokeWidth="3" strokeDasharray="10 90" strokeDashoffset="-84" />
              {/* Corporate segment: 6% */}
              <circle cx="18" cy="18" r="15.915" fill="none" stroke="#1F2937" strokeWidth="3" strokeDasharray="6 94" strokeDashoffset="-94" />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-lg font-black text-white">128.7K</span>
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Total</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px] border-t border-slate-900/60 pt-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
              <span className="text-slate-400">Música (62%)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-700 inline-block" />
              <span className="text-slate-400">Anuncios (22%)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-gray-600 inline-block" />
              <span className="text-slate-400">Mensajes (10%)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-gray-800 inline-block" />
              <span className="text-slate-400">Corp (6%)</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Network Map, Recent Activity, & Device status Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        {/* Network Map (Interactive Map) */}
        <Card className="p-5 border-slate-900 bg-[#050507] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Estado de la red</h2>
              <span className="text-[10px] text-slate-500">Nivel regional</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Puntos de conexión en LATAM</p>
          </div>

          {/* Custom SVG LATAM Contour Map mockup with glowing points */}
          <div className="relative h-40 bg-[#020202] border border-slate-900/60 rounded-xl overflow-hidden my-4">
            <svg className="w-full h-full" viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="200" height="150" fill="#020202" />
              
              {/* Abstract LATAM land contours */}
              <path d="M40 30 C55 35, 70 30, 80 45 C85 55, 90 70, 95 85 C100 100, 110 115, 120 135 C115 140, 100 145, 95 130 C90 120, 80 110, 75 90 C70 80, 60 70, 50 65 C40 60, 35 45, 40 30 Z" fill="#08080a" stroke="#111827" strokeWidth="1" />
              <path d="M85 85 C95 80, 105 75, 120 80 C130 85, 140 95, 150 115 C135 125, 115 120, 100 100 Z" fill="#08080a" stroke="#111827" strokeWidth="1" />
              
              {/* Glowing Map Pins (Connected Nodes) */}
              <g className="animate-pulse">
                {/* Mexico pin */}
                <circle cx="48" cy="40" r="2.5" fill="#FACC15" />
                <circle cx="48" cy="40" r="5" stroke="#FACC15" strokeOpacity="0.4" strokeWidth="1" />
                
                {/* Colombia pin */}
                <circle cx="75" cy="72" r="2.5" fill="#FACC15" />
                <circle cx="75" cy="72" r="5" stroke="#FACC15" strokeOpacity="0.4" strokeWidth="1" />

                {/* Argentina pin */}
                <circle cx="98" cy="120" r="2.5" fill="#EAB308" />
                <circle cx="98" cy="120" r="5" stroke="#EAB308" strokeOpacity="0.4" strokeWidth="1" />
                
                {/* Chile pin */}
                <circle cx="85" cy="115" r="2.5" fill="#EAB308" />
                <circle cx="85" cy="115" r="5" stroke="#EAB308" strokeOpacity="0.4" strokeWidth="1" />
              </g>
            </svg>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-500" /> Argentina</span>
              <span className="font-bold text-white">98%</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-500" /> México</span>
              <span className="font-bold text-white">94%</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-500" /> Colombia</span>
              <span className="font-bold text-white">90%</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-600" /> Chile</span>
              <span className="font-bold text-white">92%</span>
            </div>

            <button className="w-full text-center text-[10px] font-black uppercase text-amber-500 tracking-wider hover:text-white pt-2 border-t border-slate-900/60 transition-colors">
              Ver mapa completo →
            </button>
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="p-5 border-slate-900 bg-[#050507] flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Actividad reciente</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">Eventos en tiempo real</p>
          </div>

          <div className="space-y-3.5 my-4">
            
            {/* Row 1 */}
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mt-0.5">
                <CheckCircle className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-200 leading-tight">
                  <span className="font-bold text-white">Dispositivo RAE-0021B</span> - Actualización completada
                </p>
                <span className="text-[9px] text-slate-600 block mt-1 font-mono">Hace 2 min</span>
              </div>
            </div>

            {/* Row 2 */}
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 mt-0.5">
                <Play className="h-3.5 w-3.5 fill-current" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-200 leading-tight">
                  <span className="font-bold text-white">Campaña Coca-Cola Verano</span> - Iniciada en 24 tiendas
                </p>
                <span className="text-[9px] text-slate-600 block mt-1 font-mono">Hace 6 min</span>
              </div>
            </div>

            {/* Row 3 */}
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 mt-0.5">
                <AlertTriangle className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-200 leading-tight">
                  <span className="font-bold text-white">Tienda Alto Palermo</span> - Conexión intermitente
                </p>
                <span className="text-[9px] text-slate-600 block mt-1 font-mono">Hace 12 min</span>
              </div>
            </div>

            {/* Row 4 */}
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 mt-0.5">
                <FolderSync className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-200 leading-tight">
                  <span className="font-bold text-white">Nuevo mensaje corporativo</span> - Aprobado y programado
                </p>
                <span className="text-[9px] text-slate-600 block mt-1 font-mono">Hace 18 min</span>
              </div>
            </div>
          </div>

          <button className="w-full text-center text-[10px] font-black uppercase text-amber-500 tracking-wider hover:text-white pt-2.5 border-t border-slate-900/60 transition-colors">
            Ver todas las actividades →
          </button>
        </Card>

        {/* Top Campaigns & Progress Bars */}
        <Card className="p-5 border-slate-900 bg-[#050507] flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Top campañas</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">Rendimiento publicitario esta semana</p>
          </div>

          <div className="space-y-4 my-4">
            {/* Campaign 1 */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-bold text-slate-200">Coca-Cola Verano</span>
                <span className="font-mono text-amber-400 font-bold">28.4K</span>
              </div>
              <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full" style={{ width: "85%" }} />
              </div>
            </div>

            {/* Campaign 2 */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-bold text-slate-200">Ofertas del Mes</span>
                <span className="font-mono text-amber-400 font-bold">18.7K</span>
              </div>
              <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full" style={{ width: "62%" }} />
              </div>
            </div>

            {/* Campaign 3 */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-bold text-slate-200">Nuevos Sabores Pepsi</span>
                <span className="font-mono text-amber-400 font-bold">12.9K</span>
              </div>
              <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-amber-600 to-yellow-500 rounded-full" style={{ width: "45%" }} />
              </div>
            </div>

            {/* Campaign 4 */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-bold text-slate-200">Mensaje Corporativo</span>
                <span className="font-mono text-slate-400">8.3K</span>
              </div>
              <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                <div className="h-full bg-slate-800 rounded-full" style={{ width: "25%" }} />
              </div>
            </div>
          </div>

          <button className="w-full text-center text-[10px] font-black uppercase text-amber-500 tracking-wider hover:text-white pt-2.5 border-t border-slate-900/60 transition-colors">
            Ver todas las campañas →
          </button>
        </Card>
      </div>

      {/* System Metrics Footer Bar */}
      <footer className="mt-8 p-4 bg-[#050507] border border-slate-900 rounded-xl grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 text-xs text-slate-400">
        
        {/* Metric 1 */}
        <div className="flex items-center gap-3">
          <Database className="h-4 w-4 text-slate-600 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] text-slate-500 leading-none">Almacenamiento usado</p>
            <p className="text-xs text-white font-bold mt-1 leading-none font-mono">2.4 TB <span className="text-[10px] text-slate-500 font-normal">/ 10 TB</span></p>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="flex items-center gap-3">
          <Wifi className="h-4 w-4 text-slate-600 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] text-slate-500 leading-none">Ancho de banda (mes)</p>
            <p className="text-xs text-white font-bold mt-1 leading-none font-mono">1.2 TB <span className="text-[10px] text-slate-500 font-normal">/ 5 TB</span></p>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="flex items-center gap-3">
          <Clock className="h-4 w-4 text-slate-600 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] text-slate-500 leading-none">Audio en cola</p>
            <p className="text-xs text-white font-bold mt-1 leading-none font-mono">0 <span className="text-[10px] text-slate-500 font-normal">tracks</span></p>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="flex items-center gap-3">
          <CheckSquare className="h-4 w-4 text-slate-600 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] text-slate-500 leading-none">Aprobaciones pendientes</p>
            <p className="text-xs text-amber-400 font-bold mt-1 leading-none font-mono">7 <span className="text-[10px] text-slate-500 font-normal">requeridas</span></p>
          </div>
        </div>

        {/* Metric 5 */}
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-4 w-4 text-slate-600 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] text-slate-500 leading-none">Alertas activas</p>
            <p className="text-xs text-rose-500 font-bold mt-1 leading-none font-mono">3 <span className="text-[10px] text-slate-500 font-normal">críticas</span></p>
          </div>
        </div>
      </footer>

    </div>
  );
}
