function confirmationEmail(): string {
  const direct = process.argv.find((argument) => argument.startsWith("--confirm="));
  if (direct) return direct.slice("--confirm=".length).trim().toLowerCase();
  const flagIndex = process.argv.indexOf("--confirm");
  return flagIndex >= 0 ? String(process.argv[flagIndex + 1] || "").trim().toLowerCase() : "";
}

async function recoverAdmin(): Promise<void> {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  const connectionString = process.env.DATABASE_URL;
  const confirmation = confirmationEmail();

  if (!email || !password) {
    throw new Error("Configura ADMIN_EMAIL y ADMIN_BOOTSTRAP_PASSWORD en Replit Secrets.");
  }
  if (!connectionString) {
    throw new Error("Configura DATABASE_URL en el entorno antes de recuperar la cuenta.");
  }
  if (confirmation !== email) {
    throw new Error("Confirma el correo objetivo con --confirm=<correo>.");
  }

  // Las dependencias que abren PostgreSQL se cargan solo después de validar los
  // Secrets y la confirmación, evitando trazas técnicas o conexiones accidentales.
  const [
    { eq },
    { adminAuthChallenges, adminMfaCredentials, adminSessions, adminUsers },
    { hashPassword, validateNewPassword },
    { db },
  ] = await Promise.all([
    import("drizzle-orm"),
    import("../shared/schema"),
    import("../server/auth"),
    import("../server/db"),
  ]);

  const policy = validateNewPassword(password);
  if (!policy.valid) throw new Error(policy.error);

  const passwordHash = await hashPassword(password);
  const recovered = await db.transaction(async (tx) => {
    const [user] = await tx
      .select({ id: adminUsers.id })
      .from(adminUsers)
      .where(eq(adminUsers.email, email));
    if (!user) throw new Error("La cuenta indicada no existe; no se creó ninguna cuenta nueva.");

    await tx
      .update(adminUsers)
      .set({
        passwordHash,
        isActive: true,
        mustChangePassword: false,
        passwordChangedAt: new Date(),
      })
      .where(eq(adminUsers.id, user.id));
    await tx.delete(adminSessions).where(eq(adminSessions.userId, user.id));
    await tx.delete(adminAuthChallenges).where(eq(adminAuthChallenges.userId, user.id));
    await tx.delete(adminMfaCredentials).where(eq(adminMfaCredentials.userId, user.id));
    return true;
  });

  if (!recovered) throw new Error("No se pudo recuperar la cuenta.");
  console.log("[admin:recover] Cuenta reactivada; sesiones y enrolamiento MFA revocados.");
}

recoverAdmin()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    const message = error instanceof Error && (
      error.message.startsWith("Configura ")
      || error.message.startsWith("Confirma ")
      || error.message.startsWith("La cuenta ")
      || error.message.startsWith("La contraseña ")
      || error.message.startsWith("Elige ")
    )
      ? error.message
      : "No se pudo recuperar la cuenta. Verifica la conexión y las migraciones.";
    console.error(`[admin:recover] ${message}`);
    process.exit(1);
  });
