import { getAuthHeaders, loadAdminSession } from "@/lib/adminAuth";

export const MAX_ADMIN_MEDIA_MB = 200;
export const MAX_ADMIN_MEDIA_BYTES = MAX_ADMIN_MEDIA_MB * 1024 * 1024;
const CHUNKED_UPLOAD_THRESHOLD = 6 * 1024 * 1024;
const MIME_BY_EXTENSION: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".ogv": "video/ogg",
  ".mov": "video/quicktime",
};

export type AdminMediaUploadResult = {
  id?: string;
  path?: string;
  url?: string;
  filename?: string;
  originalName?: string;
  mimeType?: string;
  size?: number;
  available?: boolean;
  storageProvider?: string;
  error?: string;
  code?: string;
  [key: string]: unknown;
};

export class AdminMediaUploadError extends Error {
  constructor(message: string, public readonly code = "MEDIA_UPLOAD_FAILED") {
    super(message);
    this.name = "AdminMediaUploadError";
  }
}

async function responseBody(response: Response): Promise<AdminMediaUploadResult> {
  return response.json().catch(() => ({})) as Promise<AdminMediaUploadResult>;
}

function directUpload(
  file: File,
  headers: Record<string, string>,
  onProgress: (percent: number, status?: string) => void,
  alt?: string,
  altEs?: string,
): Promise<AdminMediaUploadResult> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("file", file);
    if (alt) form.append("alt", alt);
    if (altEs) form.append("altEs", altEs);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/admin/media/upload");
    xhr.withCredentials = true;
    xhr.timeout = 10 * 60 * 1000;
    xhr.setRequestHeader("Accept", "application/json");
    for (const [name, value] of Object.entries(headers)) xhr.setRequestHeader(name, value);
    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || event.total <= 0) return;
      onProgress(Math.max(1, Math.min(98, Math.round((event.loaded / event.total) * 98))), "Subiendo archivo…");
    };
    xhr.onload = () => {
      let body: AdminMediaUploadResult = {};
      try { body = JSON.parse(xhr.responseText); } catch { /* un proxy puede responder HTML */ }
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new AdminMediaUploadError(
          typeof body.error === "string"
            ? body.error
            : xhr.status === 413
              ? "El alojamiento rechazó la petición completa; se volverá a intentar mediante carga fragmentada."
              : "La carga fue rechazada antes de llegar al servidor.",
          typeof body.code === "string" ? body.code : `HTTP_${xhr.status}`,
        ));
        return;
      }
      onProgress(100, "Guardado en App Storage");
      resolve(body);
    };
    xhr.onerror = () => reject(new AdminMediaUploadError("La conexión se interrumpió durante la carga.", "NETWORK_ERROR"));
    xhr.ontimeout = () => reject(new AdminMediaUploadError("La carga tardó más de diez minutos.", "UPLOAD_TIMEOUT"));
    xhr.onabort = () => reject(new AdminMediaUploadError("La carga fue cancelada.", "UPLOAD_ABORTED"));
    xhr.send(form);
  });
}

async function uploadChunk(
  token: string,
  index: number,
  contents: Blob,
  headers: Record<string, string>,
  onChunkProgress: (loaded: number) => void,
): Promise<void> {
  // Cada fragmento viaja con su huella. El servidor vuelve a calcularla antes
  // de almacenarlo y otra vez al reconstruir el archivo desde App Storage.
  const digest = await crypto.subtle.digest("SHA-256", await contents.arrayBuffer());
  const checksum = Array.from(
    new Uint8Array(digest),
    (byte) => byte.toString(16).padStart(2, "0"),
  ).join("");
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", "/api/admin/media/upload/chunk");
        xhr.withCredentials = true;
        xhr.timeout = 3 * 60 * 1000;
        xhr.setRequestHeader("Content-Type", "application/octet-stream");
        xhr.setRequestHeader("X-Upload-Token", token);
        xhr.setRequestHeader("X-Chunk-Index", String(index));
        xhr.setRequestHeader("X-Chunk-SHA256", checksum);
        for (const [name, value] of Object.entries(headers)) xhr.setRequestHeader(name, value);
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) onChunkProgress(event.loaded);
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
            return;
          }
          let body: AdminMediaUploadResult = {};
          try { body = JSON.parse(xhr.responseText); } catch { /* respuesta no JSON del proxy */ }
          reject(new AdminMediaUploadError(
            typeof body.error === "string" ? body.error : "El alojamiento rechazó un fragmento del archivo.",
            typeof body.code === "string" ? body.code : `HTTP_${xhr.status}`,
          ));
        };
        xhr.onerror = () => reject(new AdminMediaUploadError("La conexión se interrumpió durante la carga.", "NETWORK_ERROR"));
        xhr.ontimeout = () => reject(new AdminMediaUploadError("Un fragmento tardó demasiado en subir.", "UPLOAD_TIMEOUT"));
        xhr.send(contents);
      });
      return;
    } catch (error) {
      lastError = error;
      if (error instanceof AdminMediaUploadError
        && !["NETWORK_ERROR", "UPLOAD_TIMEOUT", "HTTP_429"].includes(error.code)
        && !/^HTTP_5\d\d$/.test(error.code)) {
        throw error;
      }
      if (attempt < 2) await new Promise((resolve) => window.setTimeout(resolve, 500 * (attempt + 1)));
    }
  }
  throw lastError;
}

async function chunkedUpload(
  file: File,
  headers: Record<string, string>,
  onProgress: (percent: number, status?: string) => void,
  alt?: string,
  altEs?: string,
): Promise<AdminMediaUploadResult> {
  onProgress(1, "Preparando carga segura…");
  const start = await fetch("/api/admin/media/upload/start", {
    method: "POST",
    credentials: "include",
    headers: { Accept: "application/json", "Content-Type": "application/json", ...headers },
    body: JSON.stringify({ originalName: file.name, mimeType: file.type, size: file.size }),
  });
  const startBody = await responseBody(start);
  if (!start.ok || typeof startBody.token !== "string" || typeof startBody.chunkSize !== "number") {
    throw new AdminMediaUploadError(
      typeof startBody.error === "string" ? startBody.error : "No se pudo iniciar la carga fragmentada.",
      typeof startBody.code === "string" ? startBody.code : `HTTP_${start.status}`,
    );
  }

  const token = startBody.token;
  const chunkSize = startBody.chunkSize;
  const totalChunks = Math.ceil(file.size / chunkSize);
  try {
    let committedBytes = 0;
    for (let index = 0; index < totalChunks; index += 1) {
      const startByte = index * chunkSize;
      const chunk = file.slice(startByte, Math.min(file.size, startByte + chunkSize));
      await uploadChunk(token, index, chunk, headers, (loaded) => {
        const percent = Math.max(1, Math.min(94, Math.round(((committedBytes + loaded) / file.size) * 94)));
        onProgress(percent, `Subiendo fragmento ${index + 1} de ${totalChunks}…`);
      });
      committedBytes += chunk.size;
    }

    onProgress(96, file.type.startsWith("video/") ? "Verificando el video…" : "Procesando el archivo…");
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const complete = await fetch("/api/admin/media/upload/complete", {
        method: "POST",
        credentials: "include",
        headers: { Accept: "application/json", "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ token, alt: alt || "", altEs: altEs || "" }),
      });
      const completed = await responseBody(complete);
      if (complete.ok) {
        onProgress(100, "Guardado en App Storage");
        return completed;
      }
      if (complete.status === 503 && attempt < 2) {
        onProgress(97 + attempt, "El servidor está iniciando el verificador; reintentando…");
        await new Promise((resolve) => window.setTimeout(resolve, 1_000 * (attempt + 1)));
        continue;
      }
      throw new AdminMediaUploadError(
        typeof completed.error === "string" ? completed.error : "No se pudo reconstruir el archivo.",
        typeof completed.code === "string" ? completed.code : `HTTP_${complete.status}`,
      );
    }
    throw new AdminMediaUploadError("No se pudo verificar el archivo.", "MEDIA_VERIFICATION_FAILED");
  } catch (error) {
    await fetch("/api/admin/media/upload/abort", {
      method: "POST",
      credentials: "include",
      headers: { Accept: "application/json", "Content-Type": "application/json", ...headers },
      body: JSON.stringify({ token }),
    }).catch(() => undefined);
    throw error;
  }
}

function normalizedFile(file: File): File {
  if (file.type) return file;
  const extension = file.name.toLowerCase().match(/\.[a-z0-9]+$/)?.[0] || "";
  const inferred = MIME_BY_EXTENSION[extension];
  if (!inferred) return file;
  return new File([file], file.name, { type: inferred, lastModified: file.lastModified });
}

export async function uploadAdminMedia(
  file: File,
  options: {
    alt?: string;
    altEs?: string;
    onProgress?: (percent: number, status?: string) => void;
  } = {},
): Promise<AdminMediaUploadResult> {
  if (file.size <= 0 || file.size > MAX_ADMIN_MEDIA_BYTES) {
    throw new AdminMediaUploadError(
      `El archivo debe pesar como máximo ${MAX_ADMIN_MEDIA_MB} MB.`,
      "MEDIA_FILE_TOO_LARGE",
    );
  }
  await loadAdminSession(true);
  const uploadFile = normalizedFile(file);
  const headers = getAuthHeaders();
  const progress = options.onProgress || (() => undefined);
  if (uploadFile.size > CHUNKED_UPLOAD_THRESHOLD) {
    return chunkedUpload(uploadFile, headers, progress, options.alt, options.altEs);
  }
  try {
    return await directUpload(uploadFile, headers, progress, options.alt, options.altEs);
  } catch (error) {
    // Si el proxy aplica un límite menor al esperado, reintenta automáticamente
    // en fragmentos sin pedir al usuario que vuelva a seleccionar el archivo.
    if (error instanceof AdminMediaUploadError
      && ["HTTP_413", "VIDEO_VALIDATOR_UNAVAILABLE"].includes(error.code)) {
      return chunkedUpload(uploadFile, headers, progress, options.alt, options.altEs);
    }
    throw error;
  }
}
