export type PersistResult = "persisted" | "denied" | "unsupported";

/**
 * Pede ao navegador para não apagar os dados sozinho (o Safari no iPhone apaga dados
 * de sites não instalados após semanas sem uso). Não garante nada: o backup continua a ser preciso.
 */
export async function requestPersistentStorage(
  storage: StorageManager | null | undefined = globalThis.navigator?.storage,
): Promise<PersistResult> {
  if (!storage?.persist) return "unsupported";
  if (await storage.persisted?.()) return "persisted";
  return (await storage.persist()) ? "persisted" : "denied";
}
