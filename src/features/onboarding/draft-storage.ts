import { STEPS, emptyDraft, type OnboardingDraft } from "./draft";

const KEY = "kilora.onboarding";

/**
 * O rascunho fica no localStorage do próprio dispositivo, a cada alteração,
 * para a pessoa voltar ao passo onde ficou. Apaga-se quando o carro é guardado.
 */
export function loadDraft(storage: Storage | undefined = globalThis.localStorage): OnboardingDraft | null {
  const text = storage?.getItem(KEY);
  if (!text) return null;
  try {
    const saved = JSON.parse(text) as Partial<OnboardingDraft>;
    const base = emptyDraft();
    const merged = { ...base };
    for (const key of Object.keys(base) as (keyof OnboardingDraft)[]) {
      if (typeof saved[key] === typeof base[key]) Object.assign(merged, { [key]: saved[key] });
    }
    if (saved.fuel) merged.fuel = saved.fuel;
    if (!STEPS.includes(merged.step)) merged.step = 1;
    return merged;
  } catch {
    return null;
  }
}

export function saveDraft(draft: OnboardingDraft, storage: Storage | undefined = globalThis.localStorage): void {
  storage?.setItem(KEY, JSON.stringify(draft));
}

export function clearDraft(storage: Storage | undefined = globalThis.localStorage): void {
  storage?.removeItem(KEY);
}
