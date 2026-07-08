"use client";

import { useAuth } from "@clerk/nextjs";
import { useState, useRef } from "react";
import { Music, Upload, X, ArrowLeft, ArrowRight, Loader2, CheckCircle2, File } from "lucide-react";

interface Props {
  onComplete: (data: Record<string, unknown>) => void;
  onBack: () => void;
}

export function Step3UploadMusic({ onComplete, onBack }: Props) {
  const { getToken } = useAuth();
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || []);
    addFiles(selected);
  }

  function addFiles(newFiles: File[]) {
    const audioFiles = newFiles.filter((f) =>
      f.type.startsWith("audio/") || f.name.match(/\.(mp3|wav|ogg|flac|m4a|aac)$/i)
    );
    setFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name));
      return [...prev, ...audioFiles.filter((f) => !existing.has(f.name))];
    });
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    addFiles(Array.from(e.dataTransfer.files));
  }

  async function handleSubmit() {
    if (files.length === 0) {
      // Allow skipping
      onComplete({ uploadedCount: 0, skipped: true });
      return;
    }

    setUploading(true);
    let successCount = 0;

    for (const file of files) {
      try {
        const token = (await getToken()) || undefined;
        const formData = new FormData();
        formData.append("file", file);
        formData.append("name", file.name.replace(/\.[^.]+$/, ""));

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/audio/upload`,
          {
            method: "POST",
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: formData,
          }
        );

        if (response.ok) {
          successCount++;
          setUploadedCount(successCount);
        }
      } catch (err) {
        console.error("Upload error for file:", file.name, err);
      }
    }

    setUploading(false);
    onComplete({ uploadedCount: successCount });
  }

  function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-3 py-1 mb-4">
          <Music className="h-3.5 w-3.5 text-amber-400" />
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Paso 3 de 4</span>
        </div>
        <h2 className="text-3xl font-black text-white leading-tight">
          Sube tu música inicial
        </h2>
        <p className="mt-2 text-sm text-slate-400 max-w-lg">
          Carga los primeros archivos de audio para tu tienda. Formatos aceptados: MP3, WAV, OGG, AAC. Puedes agregar más desde el panel después.
        </p>
      </div>

      {/* Dropzone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 transition-all duration-200 ${
          dragOver
            ? "border-amber-500 bg-amber-500/5"
            : "border-slate-800 bg-[#09090b] hover:border-slate-700"
        } ${uploading ? "pointer-events-none" : ""}`}
      >
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 border ${
          dragOver ? "border-amber-500/40 bg-amber-500/10" : "border-slate-800 bg-slate-950"
        }`}>
          <Upload className={`h-6 w-6 ${dragOver ? "text-amber-400" : "text-slate-500"}`} />
        </div>
        <p className="text-sm font-semibold text-white mb-1">
          {dragOver ? "Suelta los archivos aquí" : "Arrastra archivos o haz clic para seleccionar"}
        </p>
        <p className="text-xs text-slate-500">MP3, WAV, OGG, AAC, FLAC · Máx. 50 MB por archivo</p>

        <input
          ref={inputRef}
          type="file"
          accept=".mp3,.wav,.ogg,.flac,.m4a,.aac,audio/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
          aria-label="Seleccionar archivos de audio"
        />
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {files.length} archivo{files.length !== 1 ? "s" : ""} seleccionado{files.length !== 1 ? "s" : ""}
            </span>
            {uploading && (
              <span className="text-xs text-amber-400 font-medium">
                Subiendo {uploadedCount}/{files.length}...
              </span>
            )}
          </div>
          <ul className="space-y-1.5 max-h-52 overflow-y-auto">
            {files.map((file, i) => (
              <li
                key={i}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 border transition-all ${
                  i < uploadedCount
                    ? "border-emerald-500/20 bg-emerald-500/5"
                    : "border-slate-900 bg-[#09090b]"
                }`}
              >
                {i < uploadedCount ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                ) : (
                  <File className="h-4 w-4 text-slate-500 flex-shrink-0" />
                )}
                <span className="flex-1 truncate text-sm text-slate-200">{file.name}</span>
                <span className="text-[10px] text-slate-600 flex-shrink-0">{formatBytes(file.size)}</span>
                {!uploading && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                    className="text-slate-600 hover:text-rose-400 transition-colors flex-shrink-0"
                    aria-label={`Eliminar ${file.name}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={uploading}
          className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-white transition-all disabled:opacity-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Atrás
        </button>
        <button
          onClick={handleSubmit}
          disabled={uploading}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 shadow-md hover:shadow-amber-500/20 hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Subiendo {uploadedCount}/{files.length}...
            </>
          ) : (
            <>
              {files.length === 0 ? "Omitir por ahora" : "Subir y continuar"}
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
