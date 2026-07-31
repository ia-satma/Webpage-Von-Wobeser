import { useRef, useState } from "react";
import { getAuthHeaders, loadAdminSession } from "@/lib/adminAuth";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, X, FileText } from "lucide-react";

export interface UploadedDoc {
  url: string;
  name: string;
}

const MAX_DOCUMENTS = 20;
const MAX_DOCUMENT_MB = 100;

/**
 * Subida de documentos de insumo para el Generador de Presentaciones. Permite elegir varios
 * archivos (.pdf/.docx/.pptx/.tex/.txt/.md); cada uno se sube a
 * /api/admin/presentations/upload y se acumula como {url, name}. El servidor extrae el texto
 * al generar la presentación. Los .doc/.ppt binarios legados se aceptan pero el servidor pedirá
 * convertirlos a .docx/.pptx.
 */
export function DocumentUpload({
  docs,
  onChange,
}: {
  docs: UploadedDoc[];
  onChange: (docs: UploadedDoc[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");

  const uploadFiles = async (files: FileList) => {
    setError("");
    setUploading(true);
    const next: UploadedDoc[] = [...docs];
    try {
      // Una pestaña restaurada puede conservar la cookie pero no el token CSRF en memoria.
      // Se renueva una sola vez antes del lote para que la carga múltiple no falle en silencio.
      await loadAdminSession(true);
      const candidates = Array.from(files).slice(0, Math.max(0, MAX_DOCUMENTS - docs.length));
      if (candidates.length < files.length) {
        setError(`Se admiten hasta ${MAX_DOCUMENTS} documentos por presentación.`);
      }
      for (let index = 0; index < candidates.length; index++) {
        const file = candidates[index];
        if (file.size > MAX_DOCUMENT_MB * 1024 * 1024) {
          setError(`"${file.name}" supera el máximo seguro de ${MAX_DOCUMENT_MB} MB por archivo.`);
          continue;
        }
        setUploadStatus(`Subiendo ${index + 1} de ${candidates.length}: ${file.name}`);
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/admin/presentations/upload", {
          method: "POST",
          headers: { ...getAuthHeaders() }, // sin Content-Type: el navegador pone el boundary
          body: fd,
          credentials: "include",
        });
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          setError(
            typeof body?.error === "string"
              ? body.error
              : `No se pudo subir "${file.name}" (máx ${MAX_DOCUMENT_MB} MB; .pdf/.docx/.pptx/.tex/.txt/.md).`,
          );
          continue;
        }
        const data = await res.json();
        if (data?.url) next.push({ url: data.url, name: data.name || file.name });
      }
      onChange(next);
    } catch {
      setError("Error al subir los documentos.");
    } finally {
      setUploading(false);
      setUploadStatus("");
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = (url: string) => onChange(docs.filter((d) => d.url !== url));

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.docx,.pptx,.doc,.ppt,.tex,.txt,.md"
        className="hidden"
        onChange={(e) => e.target.files && e.target.files.length > 0 && uploadFiles(e.target.files)}
        data-testid="input-presentation-docs"
      />
      <Button
        type="button"
        variant="outline"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        data-testid="button-upload-docs"
      >
        {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
        Subir documentos
      </Button>

      {error && <p className="text-xs text-red-600">{error}</p>}
      {uploadStatus && <p className="text-xs text-muted-foreground" aria-live="polite">{uploadStatus}</p>}
      <p className="text-xs text-muted-foreground">Hasta {MAX_DOCUMENTS} archivos, máximo {MAX_DOCUMENT_MB} MB por archivo.</p>

      {docs.length > 0 && (
        <ul className="space-y-1">
          {docs.map((d) => (
            <li key={d.url} className="flex items-center justify-between gap-2 text-sm border bg-muted/40 px-3 py-1.5 rounded-md">
              <span className="flex items-center gap-2 truncate">
                <FileText className="w-4 h-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{d.name}</span>
              </span>
              <button
                type="button"
                onClick={() => remove(d.url)}
                aria-label={`Quitar ${d.name}`}
                className="text-muted-foreground hover:text-red-600"
                data-testid={`button-remove-doc`}
              >
                <X className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
