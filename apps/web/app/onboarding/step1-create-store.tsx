"use client";

import { useAuth } from "@clerk/nextjs";
import { useState } from "react";
import { api } from "@/lib/api";
import { Building2, MapPin, Globe, ArrowRight, Loader2, FileText, Tag, Hash, Navigation } from "lucide-react";

interface Props {
  onComplete: (data: Record<string, unknown>) => void;
}

const TIMEZONES = [
  { label: "UTC (GMT)", value: "UTC" },
  { label: "America/Bogota (GMT-5)", value: "America/Bogota" },
  { label: "America/Mexico_City (GMT-6)", value: "America/Mexico_City" },
  { label: "America/Lima (GMT-5)", value: "America/Lima" },
  { label: "America/Santiago (GMT-4)", value: "America/Santiago" },
  { label: "America/Argentina/Buenos_Aires (GMT-3)", value: "America/Argentina/Buenos_Aires" },
  { label: "America/New_York (GMT-5)", value: "America/New_York" },
  { label: "America/Los_Angeles (GMT-8)", value: "America/Los_Angeles" },
  { label: "Europe/Madrid (GMT+1)", value: "Europe/Madrid" },
];

const VERTICALS = [
  { label: "Supermercado", value: "Supermercado" },
  { label: "Restaurante", value: "Restaurante" },
  { label: "Hotel", value: "Hotel" },
  { label: "Tienda de Ropa / Moda", value: "Tienda de Ropa" },
  { label: "Farmacia / Salud", value: "Farmacia" },
  { label: "Cafetería / Panadería", value: "Cafetería" },
  { label: "Gimnasio / Fitness", value: "Gimnasio" },
  { label: "Centro Comercial", value: "Centro Comercial" },
  { label: "Concesionaria / Automotor", value: "Concesionaria" },
  { label: "Oficina / Corporativo", value: "Oficina" },
  { label: "Consultorio / Clínica", value: "Consultorio" },
  { label: "Salón de Belleza / Spa", value: "Salón de Belleza" },
  { label: "Cine / Teatro / Entretenimiento", value: "Cine/Teatro" },
  { label: "Banco / Entidad Financiera", value: "Banco" },
  { label: "Aeropuerto / Terminal de Viajes", value: "Aeropuerto" },
];

function parseCoordinates(input: string): { latitude: string; longitude: string } {
  const clean = input.trim();
  if (!clean) return { latitude: "", longitude: "" };

  // Try extracting from Google Maps URL format: @lat,lng,z
  const urlMatch = clean.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (urlMatch && urlMatch[1] && urlMatch[2]) {
    return { latitude: urlMatch[1], longitude: urlMatch[2] };
  }

  // Try extracting from query params: q=lat,lng or ll=lat,lng
  const queryMatch = clean.match(/[?&](q|ll|query)=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (queryMatch && queryMatch[2] && queryMatch[3]) {
    return { latitude: queryMatch[2], longitude: queryMatch[3] };
  }

  // Try matching plain coordinates: lat, lng
  const plainMatch = clean.match(/^(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)$/);
  if (plainMatch && plainMatch[1] && plainMatch[2]) {
    return { latitude: plainMatch[1], longitude: plainMatch[2] };
  }

  return { latitude: "", longitude: "" };
}

export function Step1CreateStore({ onComplete }: Props) {
  const { getToken } = useAuth();
  const [name, setName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [commercialName, setCommercialName] = useState("");
  const [vertical, setVertical] = useState("Supermercado");
  const [storeCode, setStoreCode] = useState("");
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");
  const [address, setAddress] = useState("");
  const [timezone, setTimezone] = useState("America/Bogota");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("El nombre de la tienda es requerido.");
      return;
    }
    setLoading(true);
    setError("");

    // Extract coordinates if Google Maps link is provided
    const { latitude, longitude } = parseCoordinates(googleMapsUrl);

    try {
      const token = (await getToken()) || undefined;
      const storePayload = {
        name: name.trim(),
        legalName: legalName.trim() || undefined,
        commercialName: commercialName.trim() || undefined,
        vertical,
        storeCode: storeCode.trim() || undefined,
        latitude: latitude || undefined,
        longitude: longitude || undefined,
        address: address.trim() || undefined,
        timezone,
      };

      const store = await api.post("/stores", storePayload, token);
      onComplete({
        name,
        legalName,
        commercialName,
        vertical,
        storeCode,
        latitude,
        longitude,
        address,
        timezone,
        storeId: (store as any)?.id,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al crear la tienda";
      setError(message);
      console.error("Create store error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-3 py-1 mb-4">
          <Building2 className="h-3.5 w-3.5 text-amber-400" />
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Paso 1 de 4</span>
        </div>
        <h2 className="text-3xl font-black text-white leading-tight">
          Configura tu establecimiento
        </h2>
        <p className="mt-2 text-sm text-slate-400 max-w-lg">
          Ingresa la información comercial y de localización de tu tienda para configurar la red global.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name / Commercial Name */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="store-name" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Nombre de la tienda *
            </label>
            <div className="relative">
              <Building2 className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                id="store-name"
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(""); }}
                className="w-full bg-[#09090b] border border-slate-800 rounded-xl py-2.5 pl-11 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
                placeholder="Ej: Sucursal Abasto"
                autoFocus
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="commercial-name" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Nombre Comercial
            </label>
            <div className="relative">
              <Tag className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                id="commercial-name"
                type="text"
                value={commercialName}
                onChange={(e) => setCommercialName(e.target.value)}
                className="w-full bg-[#09090b] border border-slate-800 rounded-xl py-2.5 pl-11 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
                placeholder="Ej: McDonald's"
              />
            </div>
          </div>
        </div>

        {/* Legal Name / Vertical */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="legal-name" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Razón Social / Nombre Legal
            </label>
            <div className="relative">
              <FileText className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                id="legal-name"
                type="text"
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                className="w-full bg-[#09090b] border border-slate-800 rounded-xl py-2.5 pl-11 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
                placeholder="Ej: Arcos Dorados S.A."
              />
            </div>
          </div>

          <div>
            <label htmlFor="store-vertical" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Sector / Vertical
            </label>
            <div className="relative">
              <Globe className="absolute left-3.5 top-3 h-4 w-4 text-slate-500 z-10 pointer-events-none" />
              <select
                id="store-vertical"
                value={vertical}
                onChange={(e) => setVertical(e.target.value)}
                className="w-full bg-[#09090b] border border-slate-800 rounded-xl py-2.5 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all appearance-none"
              >
                {VERTICALS.map((v) => (
                  <option key={v.value} value={v.value}>{v.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Store Code / Google Maps Link */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="store-code" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Código / Identificador de Almacén
            </label>
            <div className="relative">
              <Hash className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                id="store-code"
                type="text"
                value={storeCode}
                onChange={(e) => setStoreCode(e.target.value)}
                className="w-full bg-[#09090b] border border-slate-800 rounded-xl py-2.5 pl-11 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
                placeholder="Ej: ALM-092"
              />
            </div>
          </div>

          <div>
            <label htmlFor="google-maps" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Ubicación en Google Maps <span className="text-slate-600 normal-case font-normal">(Link o Lat, Lng)</span>
            </label>
            <div className="relative">
              <Navigation className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                id="google-maps"
                type="text"
                value={googleMapsUrl}
                onChange={(e) => setGoogleMapsUrl(e.target.value)}
                className="w-full bg-[#09090b] border border-slate-800 rounded-xl py-2.5 pl-11 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
                placeholder="Ej: https://maps.google.com/?q=-34.59,-58.41"
              />
            </div>
          </div>
        </div>

        {/* Address / Timezone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="store-address" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Dirección
            </label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                id="store-address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-[#09090b] border border-slate-800 rounded-xl py-2.5 pl-11 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
                placeholder="Ej: Av. Corrientes 3247, Buenos Aires"
              />
            </div>
          </div>

          <div>
            <label htmlFor="store-timezone" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Zona horaria
            </label>
            <div className="relative">
              <Globe className="absolute left-3.5 top-3 h-4 w-4 text-slate-500 z-10 pointer-events-none" />
              <select
                id="store-timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full bg-[#09090b] border border-slate-800 rounded-xl py-2.5 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all appearance-none"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>{tz.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 bg-rose-500/5 border border-rose-500/20 rounded-xl px-4 py-3">
            <span className="text-rose-400 text-lg leading-none mt-0.5">!</span>
            <p className="text-sm text-rose-400">{error}</p>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 shadow-md hover:shadow-amber-500/20 hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Configurando establecimiento...
            </>
          ) : (
            <>
              Continuar
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
