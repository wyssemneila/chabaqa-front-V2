import type { ParsedApiError } from "@/lib/api/error-parser";

export interface ValidationResult {
  isValid: boolean;
  fieldErrors: Record<string, string>;
  globalErrors: string[];
}

type CreateFormData = {
  title?: string;
  description?: string;
  category?: string;
  difficulty?: string;
  duration?: string;
  sequentialProgression?: boolean;
  unlockMessage?: string;
  currency?: string;
  participationFee?: string;
  depositAmount?: string;
  maxParticipants?: string;
  rewards?: {
    completionReward?: string;
    topPerformerBonus?: string;
    streakBonus?: string;
  };
  steps?: Array<{
    day: number;
    title: string;
    description: string;
    deliverable: string;
    points: number;
    instructions: string;
    resources?: Array<{
      title: string;
      type: string;
      url: string;
    }>;
  }>;
};

export type ManageTask = {
  day: number | string;
  title: string;
  description: string;
  deliverable: string;
  points: number | string;
  instructions: string;
  resources?: Array<{
    title: string;
    type: string;
    url: string;
  }>;
};

export type ManageResource = {
  title: string;
  type: string;
  url: string;
};

const ALLOWED_DIFFICULTY = new Set(["beginner", "intermediate", "advanced"]);
const ALLOWED_TASK_RESOURCE_TYPES = new Set(["video", "article", "code", "tool"]);
const ALLOWED_CHALLENGE_RESOURCE_TYPES = new Set(["video", "article", "code", "tool", "pdf", "link"]);
const ALLOWED_CURRENCIES = new Set(["USD", "EUR", "TND"]);

function parseNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function normalizeDifficultyToBackend(value: string): "beginner" | "intermediate" | "advanced" {
  const normalized = value.toLowerCase();
  if (normalized === "beginner" || normalized === "all levels") return "beginner";
  if (normalized === "intermediate") return "intermediate";
  return "advanced";
}

function normalizeFieldKey(field?: string): string {
  if (!field) return "";
  return field
    .replace(/^tasks\.(\d+)\./, "steps.$1.")
    .replace(/^steps\[(\d+)\]\./, "steps.$1.")
    .replace(/^resources\[(\d+)\]\./, "resources.$1.");
}

function addError(errors: Record<string, string>, key: string, message: string) {
  if (!errors[key]) errors[key] = message;
}

export function validateTasks(steps: CreateFormData["steps"] = []): ValidationResult {
  const fieldErrors: Record<string, string> = {};
  const globalErrors: string[] = [];

  if (!steps || steps.length === 0) {
    globalErrors.push("Please add at least one challenge step.");
    return { isValid: false, fieldErrors, globalErrors };
  }

  const daySeen = new Map<number, number[]>();
  steps.forEach((step, index) => {
    const prefix = `steps.${index}`;
    const day = Number(step.day);

    if (!Number.isInteger(day) || day < 1) {
      addError(fieldErrors, `${prefix}.day`, "Day must be a positive integer.");
    } else {
      daySeen.set(day, [...(daySeen.get(day) || []), index]);
    }

    if (!step.title?.trim() || step.title.trim().length < 2) {
      addError(fieldErrors, `${prefix}.title`, "Title must be at least 2 characters.");
    }
    if (!step.description?.trim() || step.description.trim().length < 10) {
      addError(fieldErrors, `${prefix}.description`, "Description must be at least 10 characters.");
    }
    if (!step.deliverable?.trim() || step.deliverable.trim().length < 5) {
      addError(fieldErrors, `${prefix}.deliverable`, "Deliverable must be at least 5 characters.");
    }
    if (!step.instructions?.trim() || step.instructions.trim().length < 3) {
      addError(fieldErrors, `${prefix}.instructions`, "Instructions are required.");
    }
    if (Number(step.points) < 0) {
      addError(fieldErrors, `${prefix}.points`, "Points must be 0 or greater.");
    }

    (step.resources || []).forEach((resource, resourceIndex) => {
      const resourcePrefix = `${prefix}.resources.${resourceIndex}`;
      const title = (resource.title || "").trim();
      const type = (resource.type || "").trim();
      const url = (resource.url || "").trim();

      if (!title) addError(fieldErrors, `${resourcePrefix}.title`, "Resource title is required.");
      if (!type || !ALLOWED_TASK_RESOURCE_TYPES.has(type)) {
        addError(fieldErrors, `${resourcePrefix}.type`, "Resource type must be video, article, code, or tool.");
      }
      if (!url) {
        addError(fieldErrors, `${resourcePrefix}.url`, "Resource URL is required.");
      } else if (!isValidHttpUrl(url)) {
        addError(fieldErrors, `${resourcePrefix}.url`, "Resource URL must be a valid http/https URL.");
      }
    });
  });

  daySeen.forEach((indices) => {
    if (indices.length > 1) {
      indices.forEach((index) => addError(fieldErrors, `steps.${index}.day`, "Each task day must be unique."));
    }
  });

  return {
    isValid: Object.keys(fieldErrors).length === 0 && globalErrors.length === 0,
    fieldErrors,
    globalErrors,
  };
}

export function validateCreateStep(
  step: number,
  formData: CreateFormData,
  dates: { startDate?: Date; endDate?: Date },
): ValidationResult {
  const fieldErrors: Record<string, string> = {};
  const globalErrors: string[] = [];

  if (step === 1) {
    if (!formData.title?.trim() || formData.title.trim().length < 2) {
      fieldErrors.title = "Title must be at least 2 characters.";
    }
    if (!formData.description?.trim() || formData.description.trim().length < 10) {
      fieldErrors.description = "Description must be at least 10 characters.";
    }
    if (!formData.category) fieldErrors.category = "Please select a category.";
    if (!formData.difficulty || !ALLOWED_DIFFICULTY.has(formData.difficulty)) {
      fieldErrors.difficulty = "Please select a valid difficulty.";
    }
    if (!formData.duration || !/(\d+)\s*days?/i.test(formData.duration)) {
      fieldErrors.duration = 'Duration must be in the format "7 days".';
    }
    if (formData.sequentialProgression && (formData.unlockMessage || "").length > 500) {
      fieldErrors.unlockMessage = "Unlock message must be 500 characters or less.";
    }
  }

  if (step === 2) {
    if (!dates.startDate) fieldErrors.startDate = "Please select a start date.";
    if (!dates.endDate) fieldErrors.endDate = "End date is required.";

    if (dates.startDate && dates.endDate && dates.endDate < dates.startDate) {
      fieldErrors.startDate = "Start date must be before end date.";
      fieldErrors.endDate = "End date must be after start date.";
    }

    const currency = formData.currency || "TND";
    if (!ALLOWED_CURRENCIES.has(currency)) {
      fieldErrors.currency = "Currency must be USD, EUR, or TND.";
    }

    const numericFields: Array<[string, unknown]> = [
      ["participationFee", formData.participationFee],
      ["depositAmount", formData.depositAmount],
      ["maxParticipants", formData.maxParticipants],
      ["completionReward", formData.rewards?.completionReward],
      ["topPerformerBonus", formData.rewards?.topPerformerBonus],
      ["streakBonus", formData.rewards?.streakBonus],
    ];

    numericFields.forEach(([key, value]) => {
      const parsed = parseNumber(value);
      if (value !== undefined && value !== "" && parsed === null) {
        fieldErrors[key] = "Must be a valid number.";
      } else if (parsed !== null && parsed < 0) {
        fieldErrors[key] = "Must be 0 or greater.";
      }
    });
  }

  if (step === 3) {
    const taskValidation = validateTasks(formData.steps || []);
    Object.assign(fieldErrors, taskValidation.fieldErrors);
    globalErrors.push(...taskValidation.globalErrors);
  }

  return {
    isValid: Object.keys(fieldErrors).length === 0 && globalErrors.length === 0,
    fieldErrors,
    globalErrors,
  };
}

export function validateManageDetails(formData: Record<string, any>): ValidationResult {
  const fieldErrors: Record<string, string> = {};

  if (!formData.title?.trim() || formData.title.trim().length < 2) {
    fieldErrors.title = "Title must be at least 2 characters.";
  }
  if (!formData.description?.trim() || formData.description.trim().length < 10) {
    fieldErrors.description = "Description must be at least 10 characters.";
  }

  if (!formData.startDate) fieldErrors.startDate = "Start date is required.";
  if (!formData.endDate) fieldErrors.endDate = "End date is required.";
  if (formData.startDate && formData.endDate) {
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    if (startDate >= endDate) {
      fieldErrors.startDate = "Start date must be before end date.";
      fieldErrors.endDate = "End date must be after start date.";
    }
  }

  if (formData.currency && !ALLOWED_CURRENCIES.has(formData.currency)) {
    fieldErrors.currency = "Currency must be USD, EUR, or TND.";
  }

  return {
    isValid: Object.keys(fieldErrors).length === 0,
    fieldErrors,
    globalErrors: [],
  };
}

export function validateManageTask(
  task: ManageTask,
  existingDays: number[],
  currentTaskDay?: number,
): ValidationResult {
  const fieldErrors: Record<string, string> = {};
  const day = Number(task.day);

  if (!Number.isInteger(day) || day < 1) fieldErrors.day = "Day must be a positive integer.";
  if (Number(task.points) < 0) fieldErrors.points = "Points must be 0 or greater.";
  if (!task.title?.trim() || task.title.trim().length < 2) fieldErrors.title = "Title must be at least 2 characters.";
  if (!task.description?.trim() || task.description.trim().length < 10) fieldErrors.description = "Description must be at least 10 characters.";
  if (!task.deliverable?.trim() || task.deliverable.trim().length < 5) fieldErrors.deliverable = "Deliverable must be at least 5 characters.";
  if (!task.instructions?.trim() || task.instructions.trim().length < 3) fieldErrors.instructions = "Instructions are required.";

  const duplicate = existingDays.some((d) => d === day && d !== currentTaskDay);
  if (duplicate) fieldErrors.day = "Each task day must be unique.";

  (task.resources || []).forEach((resource, index) => {
    const title = (resource.title || "").trim();
    const type = (resource.type || "").trim();
    const url = (resource.url || "").trim();
    if (!title) addError(fieldErrors, `resources.${index}.title`, "Resource title is required.");
    if (!type || !ALLOWED_TASK_RESOURCE_TYPES.has(type)) {
      addError(fieldErrors, `resources.${index}.type`, "Resource type must be video, article, code, or tool.");
    }
    if (!url) {
      addError(fieldErrors, `resources.${index}.url`, "Resource URL is required.");
    } else if (!isValidHttpUrl(url)) {
      addError(fieldErrors, `resources.${index}.url`, "Resource URL must be a valid http/https URL.");
    }
  });

  return {
    isValid: Object.keys(fieldErrors).length === 0,
    fieldErrors,
    globalErrors: [],
  };
}

export function validateManageResource(resource: ManageResource): ValidationResult {
  const fieldErrors: Record<string, string> = {};
  const title = (resource.title || "").trim();
  const type = (resource.type || "").trim();
  const url = (resource.url || "").trim();

  if (!title) fieldErrors.title = "Resource title is required.";
  if (!type || !ALLOWED_CHALLENGE_RESOURCE_TYPES.has(type)) {
    fieldErrors.type = "Resource type is invalid.";
  }
  if (!url) {
    fieldErrors.url = "Resource URL is required.";
  } else if (!isValidHttpUrl(url)) {
    fieldErrors.url = "Resource URL must be a valid http/https URL.";
  }

  return {
    isValid: Object.keys(fieldErrors).length === 0,
    fieldErrors,
    globalErrors: [],
  };
}

export function mapBackendErrorsToCreatorFields(parsed: ParsedApiError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};

  Object.entries(parsed.fieldErrors || {}).forEach(([field, message]) => {
    const key = normalizeFieldKey(field);
    if (key) fieldErrors[key] = message;
  });

  (parsed.rawDetails || []).forEach((detail) => {
    if (detail.field) {
      const key = normalizeFieldKey(detail.field);
      if (key && !fieldErrors[key]) fieldErrors[key] = detail.message;
    }
  });

  const message = parsed.globalMessage || "";

  if (/date de début|start date|before.*end date|after.*start date/i.test(message)) {
    if (!fieldErrors.startDate) fieldErrors.startDate = "Start date must be before end date.";
    if (!fieldErrors.endDate) fieldErrors.endDate = "End date must be after start date.";
  }
  if (/numéro de jour unique|day.*unique|duplicate.*day|jour unique/i.test(message)) {
    fieldErrors.tasks = "Each task day must be unique.";
  }
  if (/au moins une tâche|at least one task/i.test(message)) {
    fieldErrors.tasks = "At least one task is required.";
  }
  if (/abonnement actif|active subscription|subscription/i.test(message)) {
    fieldErrors.subscription = "An active subscription is required for this action.";
  }
  if (/créateur|creator/i.test(message) && /community|challenge|défi|communauté/i.test(message)) {
    fieldErrors.permission = "You do not have permission to perform this action.";
  }
  if (/chaque tâche doit avoir un numéro de jour valide/i.test(message)) {
    fieldErrors.tasks = "Each task must have a valid day number (>= 1).";
  }
  if (/task.*description.*minLength|description.*10/i.test(message)) {
    fieldErrors.tasks = "Task description must be at least 10 characters.";
  }

  return fieldErrors;
}
