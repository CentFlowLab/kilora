import messages from "./pt-PT.json";

type Messages = typeof messages;

type Path<T> = {
  [K in keyof T & string]: T[K] extends string ? K : `${K}.${Path<T[K]>}`;
}[keyof T & string];

export type MessageKey = Path<Messages>;

export function t(key: MessageKey, vars?: Record<string, string | number>): string {
  const value = key
    .split(".")
    .reduce<unknown>((node, part) => (node as Record<string, unknown>)[part], messages);

  if (typeof value !== "string") {
    throw new Error(`Texto em falta: ${key}`);
  }

  if (!vars) return value;
  return value.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}
