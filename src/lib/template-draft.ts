import type { JobCategory, JobPriority } from "./types";
import type { JobTemplate } from "./templates";

export type TemplateDraft = {
  id: string;
  label: string;
  title: string;
  brief: string;
  amount: number;
  category: JobCategory;
  priority: JobPriority;
  tags: string[];
  audience?: string;
};

const STORAGE_KEY = "pwd-template-draft";

export function toTemplateDraft(
  template: Pick<
    JobTemplate,
    | "id"
    | "label"
    | "title"
    | "brief"
    | "amount"
    | "category"
    | "priority"
    | "tags"
  > & { audience?: string },
): TemplateDraft {
  return {
    id: template.id,
    label: template.label,
    title: template.title,
    brief: template.brief,
    amount: template.amount,
    category: template.category,
    priority: template.priority,
    tags: template.tags,
    audience: template.audience,
  };
}

export function saveTemplateDraft(draft: TemplateDraft) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
}

export function loadTemplateDraft(): TemplateDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TemplateDraft;
    if (!parsed?.title || !parsed?.brief) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearTemplateDraft() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
}
