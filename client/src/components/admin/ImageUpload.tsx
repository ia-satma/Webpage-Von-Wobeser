import { useRef, useState } from "react";
import { getAuthHeaders } from "@/lib/adminAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Loader2, X } from "lucide-react";

/**
 * Campo de medios reutilizable: permite SUBIR un archivo desde la computadora
 * (a /api/admin/media/upload) o pegar una URL/ruta. Soporta imagen o video.
 * Muestra vista previa.
 */
export function ImageUpload({
  value,
  onChange,
  placeholder = "…o pega una URL / ruta",
  kind = "image",
}: {
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  kind?: "image" | "video";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const isVideo = kind === "video";

  const upload = async (file: File) => {
    setError("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/media/upload", {
        method: "POST",
        headers: { ...getAuthHeaders() }, // sin Content-Type: el navegador pone el boundary
        body: fd,
        credentials: "include",
      });
      if (!res.ok) {
        setError(`No se pudo subir (máx 200 MB, ${isVideo ? "video mp4/webm" : "solo imágenes"}).`);
        return;
      }
      const data = await res.json();
      onChange(data.path || data.url || "");
    } catch {
      setError("Error al subir el archivo.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative inline-block">
          {isVideo ? (
            <video src={value} className="h-28 w-auto border bg-muted" muted controls />
          ) : (
            <img src={value} alt="Vista previa" className="h-24 w-auto border object-contain bg-muted" />
          )}
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute -top-2 -right-2 bg-card border p-0.5 leading-none"
            aria-label="Quitar"
            data-testid="button-remove-media"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : null}

      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept={isVideo ? "video/*" : "image/*"}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f);
            e.target.value = "";
          }}
          data-testid="input-file"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          data-testid="button-upload"
        >
          {uploading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
          {uploading ? "Subiendo…" : isVideo ? "Subir video desde tu computadora" : "Subir desde tu computadora"}
        </Button>
      </div>

      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} data-testid="input-media-url" />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
