import { useId, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Loader2, X, Download, Library } from "lucide-react";
import { MediaLibraryPicker, type MediaLibraryItem } from "@/components/admin/MediaLibraryPicker";
import {
  AdminMediaUploadError,
  MAX_ADMIN_MEDIA_BYTES,
  MAX_ADMIN_MEDIA_MB,
  uploadAdminMedia,
} from "@/lib/adminMediaUpload";
import { buildVideoEmbedUrl, parseVideoSource } from "@shared/videoSource";

const VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/ogg", "video/quicktime"]);
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);

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
  const videoHelpId = useId();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [error, setError] = useState("");
  const isVideo = kind === "video";
  const videoSource = isVideo && value.trim() ? parseVideoSource(value) : null;
  const videoEmbedUrl = videoSource && videoSource.kind !== "file"
    ? buildVideoEmbedUrl(videoSource, { controls: true, privacyEnhanced: true })
    : null;
  const invalidVideoSource = isVideo && Boolean(value.trim()) && !videoSource;

  const upload = async (file: File) => {
    setError("");
    if (file.size > MAX_ADMIN_MEDIA_BYTES) {
      setError(`El archivo pesa ${(file.size / 1024 / 1024).toFixed(1)} MB. El máximo es ${MAX_ADMIN_MEDIA_MB} MB.`);
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
    setUploadStatus("Preparando archivo…");
    try {
      const data = await uploadAdminMedia(file, {
        onProgress: (percent, status) => {
          setUploadProgress(percent);
          if (status) setUploadStatus(status);
        },
      }) as MediaLibraryItem & { url?: string };
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
      setError(uploadError instanceof AdminMediaUploadError || uploadError instanceof Error
        ? uploadError.message
        : "La conexión se interrumpió durante la carga. El archivo anterior permanece sin cambios.");
    } finally {
      setUploading(false);
      setUploadProgress(null);
      setUploadStatus("");
    }
  };

  return (
    <div className="space-y-2">
      {value ? (
        <div className="space-y-1">
          <div className="relative inline-block">
            {videoEmbedUrl ? (
              <iframe
                src={videoEmbedUrl}
                title={videoSource?.kind === "youtube" ? "Vista previa de YouTube" : "Vista previa de Vimeo"}
                className="aspect-video h-40 max-w-full border bg-muted"
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                sandbox="allow-scripts allow-same-origin allow-presentation"
                allowFullScreen
              />
            ) : isVideo && videoSource?.kind === "file" ? (
              <video src={videoSource.url} className="h-28 w-auto max-w-full border bg-muted" muted controls />
            ) : isVideo ? (
              <div className="flex min-h-28 max-w-md items-center border bg-muted px-4 py-3 text-xs text-muted-foreground">
                Agrega un archivo de video o un enlace público válido de YouTube o Vimeo para mostrar la vista previa.
              </div>
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
          {/* Los reproductores externos no representan un archivo descargable. */}
          {(!isVideo || videoSource?.kind === "file") && (
            <a
              href={downloadHref(isVideo && videoSource?.kind === "file" ? videoSource.url : value)}
              download={downloadName(isVideo && videoSource?.kind === "file" ? videoSource.url : value, isVideo)}
              rel="noopener noreferrer"
              className="flex w-fit items-center gap-1 text-xs text-primary hover:underline"
              data-testid="link-download-media"
            >
              <Download className="h-3.5 w-3.5" /> Descargar
            </a>
          )}
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

      <Input
        value={value}
        onChange={(e) => {
          setError("");
          onChange(e.target.value);
        }}
        placeholder={isVideo ? "…o pega un enlace de YouTube, Vimeo o una URL de video" : placeholder}
        aria-invalid={invalidVideoSource || undefined}
        aria-describedby={isVideo ? videoHelpId : undefined}
        data-testid="input-media-url"
      />
      {uploading && uploadProgress !== null && (
        <div className="space-y-1" aria-live="polite">
          <div className="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
            <div className="h-full bg-primary transition-[width] duration-200" style={{ width: `${uploadProgress}%` }} />
          </div>
          <p className="text-xs text-muted-foreground">
            {uploadStatus || (uploadProgress < 100 ? `Enviando archivo: ${uploadProgress}%` : "Guardando en App Storage…")}
            {uploadProgress > 0 && uploadProgress < 100 ? ` (${uploadProgress}%)` : ""}
          </p>
        </div>
      )}
      <p id={isVideo ? videoHelpId : undefined} className="text-xs leading-relaxed text-muted-foreground">
        {isVideo
          ? "Sube MP4 (H.264 recomendado), WebM, OGV o MOV de hasta 200 MB en 720p, 1080p y 4K, o pega un enlace público de YouTube o Vimeo. Los archivos locales se validan y optimizan; los enlaces externos se muestran en un reproductor seguro del proveedor."
          : "JPG, PNG, GIF o WebP; hasta 200 MB. La carga es fragmentada cuando se necesita y el sistema valida y optimiza la imagen automáticamente."}
      </p>
      {invalidVideoSource && (
        <p className="text-xs text-destructive" role="alert">
          Enlace de video no compatible. Usa un archivo MP4, WebM, OGV o MOV, o una URL pública válida de YouTube o Vimeo.
        </p>
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
