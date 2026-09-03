import assert from "node:assert/strict";
import test from "node:test";
import { classifyCareerApplicationFailure } from "./careerApplicationFailure";

test("las solicitudes de Talento devuelven códigos seguros y accionables", () => {
  const storage = new Error("storage unavailable");
  storage.name = "PrivateDocumentStorageUnavailableError";
  assert.deepEqual(classifyCareerApplicationFailure(storage), {
    code: "CV_STORAGE_UNAVAILABLE",
    status: 503,
    message: "La plataforma para recibir hojas de vida está temporalmente no disponible. Intenta de nuevo más tarde.",
  });
  assert.deepEqual(classifyCareerApplicationFailure(new Error("Malware scanner unavailable")), {
    code: "CV_MALWARE_SCANNER_UNAVAILABLE",
    status: 503,
    message: "La verificación de seguridad del archivo está temporalmente no disponible. Intenta de nuevo más tarde.",
  });
  assert.deepEqual(classifyCareerApplicationFailure(new Error("Malware detected")), {
    code: "CV_FILE_REJECTED",
    status: 422,
    message: "El archivo no superó la revisión de seguridad. Selecciona otro documento e inténtalo de nuevo.",
  });
});

test("las incidencias de esquema o cifrado no exponen configuración al candidato", () => {
  assert.deepEqual(classifyCareerApplicationFailure({ code: "42P01" }), {
    code: "CAREER_APPLICATIONS_SCHEMA_PENDING",
    status: 503,
    message: "El sistema de solicitudes se está preparando. Intenta de nuevo en unos minutos.",
  });
  assert.deepEqual(classifyCareerApplicationFailure(new Error("Field encryption requires a valid key and key identifier")), {
    code: "CAREER_APPLICATION_ENCRYPTION_UNAVAILABLE",
    status: 503,
    message: "El sistema de solicitudes se está preparando. Intenta de nuevo en unos minutos.",
  });
  assert.deepEqual(classifyCareerApplicationFailure(new Error("unexpected")), {
    code: "CAREER_APPLICATION_PROCESSING_FAILED",
    status: 500,
    message: "No fue posible procesar la solicitud.",
  });
});
