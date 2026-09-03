export type CareerApplicationFailure = {
  code:
    | "CV_STORAGE_UNAVAILABLE"
    | "CV_MALWARE_SCANNER_UNAVAILABLE"
    | "CV_FILE_REJECTED"
    | "CAREER_APPLICATIONS_SCHEMA_PENDING"
    | "CAREER_APPLICATION_ENCRYPTION_UNAVAILABLE"
    | "CAREER_APPLICATION_PROCESSING_FAILED";
  status: 422 | 500 | 503;
  message: string;
};

const FAILURE_MESSAGES: Record<CareerApplicationFailure["code"], Omit<CareerApplicationFailure, "code">> = {
  CV_STORAGE_UNAVAILABLE: {
    status: 503,
    message: "La plataforma para recibir hojas de vida está temporalmente no disponible. Intenta de nuevo más tarde.",
  },
  CV_MALWARE_SCANNER_UNAVAILABLE: {
    status: 503,
    message: "La verificación de seguridad del archivo está temporalmente no disponible. Intenta de nuevo más tarde.",
  },
  CV_FILE_REJECTED: {
    status: 422,
    message: "El archivo no superó la revisión de seguridad. Selecciona otro documento e inténtalo de nuevo.",
  },
  CAREER_APPLICATIONS_SCHEMA_PENDING: {
    status: 503,
    message: "El sistema de solicitudes se está preparando. Intenta de nuevo en unos minutos.",
  },
  CAREER_APPLICATION_ENCRYPTION_UNAVAILABLE: {
    status: 503,
    message: "El sistema de solicitudes se está preparando. Intenta de nuevo en unos minutos.",
  },
  CAREER_APPLICATION_PROCESSING_FAILED: {
    status: 500,
    message: "No fue posible procesar la solicitud.",
  },
};

function errorCode(error: unknown): string {
  return typeof (error as { code?: unknown })?.code === "string"
    ? String((error as { code: string }).code).slice(0, 40)
    : "";
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "";
}

/**
 * La respuesta pública nunca expone el detalle de una candidatura ni la
 * configuración del servidor. Sí diferencia los bloqueos recuperables que el
 * equipo puede resolver en Replit de un error inesperado.
 */
export function classifyCareerApplicationFailure(error: unknown): CareerApplicationFailure {
  const code = errorCode(error);
  const message = errorMessage(error);
  const resolvedCode: CareerApplicationFailure["code"] =
    error instanceof Error && error.name === "PrivateDocumentStorageUnavailableError"
      ? "CV_STORAGE_UNAVAILABLE"
      : code === "42P01"
        ? "CAREER_APPLICATIONS_SCHEMA_PENDING"
        : message === "Malware scanner unavailable"
          ? "CV_MALWARE_SCANNER_UNAVAILABLE"
          : message === "Malware detected"
            ? "CV_FILE_REJECTED"
            : /^(?:Field encryption requires|APP_FIELD_ENCRYPTION_KEY)/.test(message)
              ? "CAREER_APPLICATION_ENCRYPTION_UNAVAILABLE"
              : "CAREER_APPLICATION_PROCESSING_FAILED";
  return { code: resolvedCode, ...FAILURE_MESSAGES[resolvedCode] };
}
