// =====================================================================
// Расширенные логи тренировок и Pro-флаг.
//
// Что хранится:
// - SessionLog: одна реальная завершённая (или прерванная) тренировка с
//   разбивкой по упражнениям, RPE, фактическим временем и т.д.
// - Pro flag: один глобальный булев в localStorage, не привязан к профилю.
//
// Где хранится: localStorage (как и всё остальное в этом приложении).
// Ключ сессий — per-profile, чтобы не смешивать данные разных людей.
// =====================================================================

import { getActiveProfileId } from "./workout";
import type { Muscle } from "./workout";

const SESSIONS_KEY_BASE = "wg_sessions_v1";
const PRO_KEY = "wg_pro_v1";
// Потолок на профиль. ~1 КБ на сессию, 5000 сессий ≈ 5 МБ — впритык к лимиту
// localStorage, но с запасом на ~10+ лет тренировок при 3–4 в неделю.
const MAX_SESSIONS = 5000;

export type ExerciseStatus = "done" | "partial" | "skipped" | "replaced";

export interface SessionExerciseLog {
  name: string;
  muscle: Muscle | string;
  plannedSets: number;
  doneSets: number;
  status: ExerciseStatus;
  // Фактический вес (если пользователь отредактировал) — для прогресса
  weight?: string;
  // Среднее число повторений в подходе (из «8–10 повторений» → 9). Для тоннажа.
  reps?: number;
  // Извлечённый из weight числовой килограммаж (одна нога/одна рука уже учтена).
  weightKg?: number;
  // Если заменили — на что
  replacedWith?: string;
}

export interface SessionLog {
  id: string;
  ts: number; // момент старта
  date: string; // YYYY-MM-DD
  endTs?: number; // момент завершения (если завершена)
  durationPlanned: number; // мин (из формы)
  durationActual?: number; // мин (по факту: (endTs-ts)/60_000)
  level?: "beginner" | "intermediate" | "advanced"; // уровень на момент тренировки
  focus: string; // фокус тренировки (из result.focusLabel)
  muscles: string[]; // нормализованные русские названия
  rpe?: number; // 1-10 субъективная нагрузка
  // Подходы × повторения × расчётный объём (для аналитики)
  totalSets: number;
  doneSets: number;
  exercises: SessionExerciseLog[];
}

// ---- Подписки (как в основной части приложения) ----

const sessionListeners = new Set<() => void>();
const proListeners = new Set<() => void>();

export function subscribeSessions(cb: () => void): () => void {
  sessionListeners.add(cb);
  return () => {
    sessionListeners.delete(cb);
  };
}

export function subscribePro(cb: () => void): () => void {
  proListeners.add(cb);
  return () => {
    proListeners.delete(cb);
  };
}

function notifySessions() {
  sessionListeners.forEach((l) => l());
}

function notifyPro() {
  proListeners.forEach((l) => l());
}

// ---- Pro-флаг ----

export function isPro(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(PRO_KEY) === "1";
  } catch {
    return false;
  }
}

export function setPro(value: boolean) {
  if (typeof window === "undefined") return;
  try {
    if (value) window.localStorage.setItem(PRO_KEY, "1");
    else window.localStorage.removeItem(PRO_KEY);
    notifyPro();
  } catch {}
}

// ---- Сессии ----

function sessionsKey(): string | null {
  const id = getActiveProfileId();
  return id ? `${SESSIONS_KEY_BASE}:${id}` : null;
}

export function listSessions(): SessionLog[] {
  if (typeof window === "undefined") return [];
  const key = sessionsKey();
  if (!key) return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const arr = JSON.parse(raw) as SessionLog[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeSessions(arr: SessionLog[]) {
  if (typeof window === "undefined") return;
  const key = sessionsKey();
  if (!key) return;
  try {
    window.localStorage.setItem(
      key,
      JSON.stringify(arr.slice(-MAX_SESSIONS)),
    );
  } catch {}
}

export function saveSession(log: SessionLog): void {
  if (!sessionsKey()) return;
  const arr = listSessions();
  // Защита от дублей по id (если тренировку завершили дважды)
  const filtered = arr.filter((s) => s.id !== log.id);
  filtered.push(log);
  filtered.sort((a, b) => a.ts - b.ts);
  writeSessions(filtered);
  notifySessions();
}

export function deleteSession(id: string): void {
  const arr = listSessions().filter((s) => s.id !== id);
  writeSessions(arr);
  notifySessions();
}

export function clearSessions(): void {
  writeSessions([]);
  notifySessions();
}

export function newSessionId(): string {
  return `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// ---- Экспорт / импорт истории ----
//
// Формат бэкапа — простой JSON с маркером и версией. Это страховка от потери
// данных (localStorage чистится по любому чиху браузера) и одновременно мост
// для переезда в будущее мобильное приложение: оно сможет импортировать
// файл в нативное хранилище.

export const BACKUP_FORMAT = "wg-backup";
export const BACKUP_VERSION = 1;

export interface BackupFile {
  format: typeof BACKUP_FORMAT;
  version: number;
  exportedAt: string; // ISO
  profileName: string;
  sessionCount: number;
  sessions: SessionLog[];
}

export function buildBackup(profileName: string): BackupFile {
  const sessions = listSessions();
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    profileName,
    sessionCount: sessions.length,
    sessions,
  };
}

export interface ImportResult {
  added: number;
  updated: number;
  skipped: number;
  total: number;
}

// Сливаем импортируемые сессии с уже существующими по id. Если id новый —
// добавляем; если совпал — заменяем (полезно, если пользователь
// исправил данные на другом устройстве). Не валидные записи пропускаем.
export function importBackup(raw: unknown, mode: "merge" | "replace" = "merge"): ImportResult {
  if (!raw || typeof raw !== "object") {
    throw new Error("Файл не похож на бэкап (ожидался JSON-объект).");
  }
  const data = raw as Partial<BackupFile>;
  if (data.format !== BACKUP_FORMAT) {
    throw new Error("Это не файл резервной копии Генератора тренировок.");
  }
  if (typeof data.version !== "number" || data.version > BACKUP_VERSION) {
    throw new Error(
      `Версия файла (${String(data.version)}) новее, чем поддерживает приложение. Обновите приложение.`,
    );
  }
  if (!Array.isArray(data.sessions)) {
    throw new Error("В файле нет списка тренировок.");
  }
  const existing = mode === "replace" ? [] : listSessions();
  const byId = new Map<string, SessionLog>(existing.map((s) => [s.id, s]));
  let added = 0;
  let updated = 0;
  let skipped = 0;
  for (const s of data.sessions) {
    if (
      !s ||
      typeof s !== "object" ||
      typeof s.id !== "string" ||
      typeof s.ts !== "number" ||
      typeof s.date !== "string" ||
      !Array.isArray(s.exercises)
    ) {
      skipped++;
      continue;
    }
    if (byId.has(s.id)) updated++;
    else added++;
    byId.set(s.id, s as SessionLog);
  }
  const merged = Array.from(byId.values()).sort((a, b) => a.ts - b.ts);
  writeSessions(merged);
  notifySessions();
  return { added, updated, skipped, total: merged.length };
}
