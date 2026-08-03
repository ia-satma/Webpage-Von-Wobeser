import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getAuthHeaders, loadAdminSession } from "@/lib/adminAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Loader2, X, Download, Library } from "lucide-react";
import { MediaLibraryPicker, type MediaLibraryItem } from "@/components/admin/MediaLibraryPicker";

const MAX_MEDIA_MB = 200;
const MAX_MEDIA_BYTES = MAX_MEDIA_MB * 1024 * 1024;
const VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/ogg", "video/quicktime"]);
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);

type UploadResult = {
  status: number;
  body: (MediaLibraryItem & { url?: string; error?: string; code?: string }) | null;
};

function sendMediaFile(
  file: File,
  headers: Record<string, string>,
  onProgress: (percent: number) => void,
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("file", file);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/admin/media/upload");
    xhr.withCredentials = true;
    xhr.timeout = 10 * 60 * 1000;
    xhr.setRequestHeader("Accept", "application/json");
    for (const [name, value] of Object.entries(headers)) xhr.setRequestHeader(name, value);
    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || event.total <= 0) return;
      onProgress(Math.max(1, Math.min(99, Math.round((event.loaded / event.total) * 100))));
    };
    xhr.onload = () => {
      let body: UploadResult["body"] = null;
      try { body = JSON.parse(xhr.responseText); } catch { /* proxy puede responder HTML */ }
      onProgress(100);
      resolve({ status: xhr.status, body });
    };
    xhr.onerror = () => reject(new Error("network"));
    xhr.ontimeout = () => reject(new Error("timeout"));
    xhr.onabort = () => reject(new Error("aborted"));
    xhr.send(form);
  });
}

/** Deriva un nombre de archivo del final de la URL/ruta para el atributo download. */
function downloadName(url: string, isVideo: boolean): string {
  try {
    const clean = url.split("?")[0].split("#")[0];
    const base = clean.substring(clean.lastIndexOf("/") + 1);
    return base || (isVideo ? "video.mp4" : "imagen.png");
  } catch {
    return isVideo ? "video.mp4" : "imagen.png";
  }
}

/** Para assets generados (mismo origen) agrega ?download=1 → el server responde con
 * Content-Disposition: attachment y fuerza la descarga (el atributo download no basta). */
export function downloadHref(url: string): string {
  return /^\/generated-(images|audio|presentations)\//.test(url)
    ? `${url}${url.includes("?") ? "&" : "?"}download=1`
    : url;
}

/**
 * Campo de medios reutilizable: permite SUBIR un archivo desde la computadora,
 * elegir uno previamente cargado al panel o pegar una URL/ruta. Soporta imagen o video.
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
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [error, setError] = useState("");
  const isVideo = kind === "video";

  const upload = async (file: File) => {
    setError("");
    if (file.size > MAX_MEDIA_BYTES) {
      setError(`El archivo pesa ${(file.size / 1024 / 1024).toFixed(1)} MB. El máximo es ${MAX_MEDIA_MB} MB.`);
      return;
    }
    const extension = file.name.toLowerCase().match(/\.[a-z0-9]+$/)?.[0] || "";
    const compatibleVideo = VIDEO_TYPES.has(file.type) || (!file.type && [".mp4", ".webm", ".ogv", ".mov"].includes(extension));
    const compatibleImage = IMAGE_TYPES.has(file.type) || (!file.type && [".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(extension));
    if ((isVideo && !compatibleVideo) || (!isVideo && !compatibleImage)) {
      setError(isVideo
        ? "Formato no admitido. Usa video MP4, WebM, OGV o MOV."
        : "Formato no admitido. Usa imagen JPG, PNG, GIF o WebP.");
      return;
    }
    setUploading(true);
    setUploadProgress(0);
    try {
      // Una pestaña restaurada puede conservar la cookie HttpOnly pero no el
      // token CSRF en sessionStorage. Se renueva antes de enviar multipart.
      await loadAdminSession(true);
      const response = await sendMediaFile(file, getAuthHeaders(), setUploadProgress);
      if (response.status < 200 || response.status >= 300) {
        setError(
          typeof response.body?.error === "string"
            ? response.body.error
            : response.status === 413
              ? `El archivo supera el máximo admitido de ${MAX_MEDIA_MB} MB.`
              : "La carga fue rechazada antes de llegar al servidor. Inténtalo de nuevo o elige el archivo desde la biblioteca.",
        );
        return;
      }
      const data = response.body;
      if (!data?.path && !data?.url) {
        setError("El servidor recibió el archivo, pero no devolvió una ruta válida.");
        return;
      }
      onChange(data.path || data.url || "");
      queryClient.setQueryData<MediaLibraryItem[]>(["/api/admin/media"], (existing) => {
        if (!data?.id) return existing;
        return [data, ...(existing || []).filter((item) => item.id !== data.id)];
      });
    } catch (uploadError) {
      const reason = uploadError instanceof Error ? uploadError.message : "";
      setError(reason === "timeout"
        ? "La carga tardó más de 10 minutos y fue cancelada. Verifica tu conexión e inténtalo de nuevo."
        : "La conexión se interrumpió durante la carga. El archivo anterior permanece sin cambios.");
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };

  return (
    <div className="space-y-2">
      {value ? (
        <div className="space-y-1">
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
          {/* Descargar el medio (funciona con imágenes generadas por IA / subidas — mismo origen). */}
          <a
            href={downloadHref(value)}
            download={downloadName(value, isVideo)}
            rel="noopener noreferrer"
            className="flex w-fit items-center gap-1 text-xs text-primary hover:underline"
            data-testid="link-download-media"
          >
            <Download className="h-3.5 w-3.5" /> Descargar
          </a>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept={isVideo ? "video/mp4,video/webm,video/ogg,video/quicktime,.mp4,.webm,.ogv,.mov" : "image/jpeg,image/png,image/gif,image/webp"}
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
          {uploading
            ? `Subiendo${uploadProgress !== null && uploadProgress > 0 ? ` ${uploadProgress}%` : "…"}`
            : isVideo ? "Subir video desde tu computadora" : "Subir desde tu computadora"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setLibraryOpen(true)}
          disabled={uploading}
          data-testid="button-open-media-library"
        >
          <Library className="mr-1 h-4 w-4" />
          Elegir de la biblioteca
        </Button>
      </div>

      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} data-testid="input-media-url" />
      {uploading && uploadProgress !== null && (
        <div className="space-y-1" aria-live="polite">
          <div className="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
            <div className="h-full bg-primary transition-[width] duration-200" style={{ width: `${uploadProgress}%` }} />
          </div>
          <p className="text-xs text-muted-foreground">
            {uploadProgress < 100 ? `Enviando archivo: ${uploadProgress}%` : "Archivo enviado. Guardando en App Storage…"}
          </p>
        </div>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}

      <MediaLibraryPicker
        open={libraryOpen}
        onOpenChange={setLibraryOpen}
        kind={kind}
        currentValue={value}
        onSelect={onChange}
      />
    </div>
  );
}
