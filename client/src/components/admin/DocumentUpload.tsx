import { useRef, useState } from "react";
import { getAuthHeaders } from "@/lib/adminAuth";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, X, FileText } from "lucide-react";

export interface UploadedDoc {
  url: string;
  name: string;
}

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

  const uploadFiles = async (files: FileList) => {
    setError("");
    setUploading(true);
    const next: UploadedDoc[] = [...docs];
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/admin/presentations/upload", {
          method: "POST",
          headers: { ...getAuthHeaders() }, // sin Content-Type: el navegador pone el boundary
          body: fd,
          credentials: "include",
        });
        if (!res.ok) {
          setError(`No se pudo subir "${file.name}" (máx 30 MB; .pdf/.docx/.pptx/.tex/.txt/.md).`);
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
