import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  isPro,
  listSessions,
  setPro,
  subscribePro,
  subscribeSessions,
  type SessionLog,
} from "@/lib/sessions";

const MUSCLE_COLORS: Record<string, string> = {
  Грудь: "#ef4444",
  Спина: "#0ea5e9",
  Плечи: "#f59e0b",
  Бицепс: "#8b5cf6",
  Трицепс: "#ec4899",
  Ноги: "#10b981",
  Ягодицы: "#14b8a6",
  Пресс: "#a3a3a3",
  Кор: "#a3a3a3",
  Кардио: "#f97316",
  "Всё тело": "#64748b",
};

function colorFor(muscle: string): string {
  return MUSCLE_COLORS[muscle] ?? "#94a3b8";
}

function ymdToDate(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y!, (m ?? 1) - 1, d ?? 1);
}

function startOfWeek(d: Date): Date {
  const day = (d.getDay() + 6) % 7; // понедельник = 0
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  r.setDate(r.getDate() - day);
  return r;
}

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// =====================================================================
//                              Расчёты
// =====================================================================

interface WeeklyVolume {
  week: string; // короткий лейбл «12 май»
  sets: number;
}

function weeklyVolume(sessions: SessionLog[], weeks = 8): WeeklyVolume[] {
  const today = startOfWeek(new Date());
  const buckets: WeeklyVolume[] = [];
  const months = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
  for (let i = weeks - 1; i >= 0; i--) {
    const start = new Date(today);
    start.setDate(today.getDate() - i * 7);
    buckets.push({
      week: `${start.getDate()} ${months[start.getMonth()]}`,
      sets: 0,
    });
  }
  for (const s of sessions) {
    const w = startOfWeek(new Date(s.ts));
    const diffWeeks = Math.floor(
      (today.getTime() - w.getTime()) / (7 * 24 * 3600 * 1000),
    );
    if (diffWeeks < 0 || diffWeeks >= weeks) continue;
    const idx = weeks - 1 - diffWeeks;
    if (buckets[idx]) buckets[idx].sets += s.doneSets;
  }
  return buckets;
}

interface WeeklyTonnage {
  week: string;
  tonnage: number; // в кг
}

// Парсим вес из строки веса (для совместимости со старыми сессиями,
// в которых нет числового weightKg). «≈ 17–21 кг на руку» → 21 (берём верх
// диапазона как реалистичный рабочий вес для подсчёта объёма).
function fallbackWeightKg(weight?: string): number | null {
  if (!weight) return null;
  if (/без\s+вес|свой\s+вес/i.test(weight)) return null;
  // Сначала ищем диапазон («17–21 кг») — берём верхнюю границу.
  const range = weight.match(/(\d+(?:[.,]\d+)?)\s*[–-]\s*(\d+(?:[.,]\d+)?)\s*кг/i);
  if (range) return parseFloat(range[2]!.replace(",", "."));
  // Иначе одиночное число с «кг».
  const single = weight.match(/(\d+(?:[.,]\d+)?)\s*кг/i);
  if (single) return parseFloat(single[1]!.replace(",", "."));
  return null;
}

// Извлекаем рабочий вес и повторения для упражнения с фолбэком на старые
// сессии: weightKg парсится из строки веса, reps без сохранённого значения
// принимается за разумный дефолт 10 (середина типичного диапазона 8–12).
function effectiveLoad(ex: SessionLog["exercises"][number]): {
  weightKg: number | null;
  reps: number | null;
} {
  const weightKg = ex.weightKg ?? fallbackWeightKg(ex.weight);
  const reps = ex.reps ?? (weightKg !== null ? 10 : null);
  return { weightKg, reps };
}

// Тоннаж = сумма (вес × повторения × выполненные подходы) по упражнениям.
function weeklyTonnage(sessions: SessionLog[], weeks = 8): WeeklyTonnage[] {
  const today = startOfWeek(new Date());
  const buckets: WeeklyTonnage[] = [];
  const months = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
  for (let i = weeks - 1; i >= 0; i--) {
    const start = new Date(today);
    start.setDate(today.getDate() - i * 7);
    buckets.push({
      week: `${start.getDate()} ${months[start.getMonth()]}`,
      tonnage: 0,
    });
  }
  for (const s of sessions) {
    const w = startOfWeek(new Date(s.ts));
    const diffWeeks = Math.floor(
      (today.getTime() - w.getTime()) / (7 * 24 * 3600 * 1000),
    );
    if (diffWeeks < 0 || diffWeeks >= weeks) continue;
    const idx = weeks - 1 - diffWeeks;
    if (!buckets[idx]) continue;
    let sessionTonnage = 0;
    for (const ex of s.exercises) {
      if (!ex.doneSets) continue;
      const { weightKg, reps } = effectiveLoad(ex);
      if (weightKg && reps) {
        sessionTonnage += weightKg * reps * ex.doneSets;
      }
    }
    buckets[idx].tonnage += Math.round(sessionTonnage);
  }
  return buckets;
}

// Базовые упражнения, для которых имеет смысл считать 1RM (формула Эпли).
// Ключевые слова в названии — простой эвристический фильтр.
const ONE_RM_KEYWORDS = [
  "жим",
  "присед",
  "становая",
  "тяга",
  "подтягив",
  "выпад",
  "швунг",
  "толчок",
  "рывок",
];

function isBaseLift(name: string): boolean {
  const n = name.toLowerCase();
  return ONE_RM_KEYWORDS.some((k) => n.includes(k));
}

interface OneRmRow {
  name: string;
  current: number;
  previous: number | null;
  delta: number | null;
  lastDate: string;
}

// Эпли: 1RM ≈ weight × (1 + reps/30). Достоверно для 1–12 повторений.
function epley1RM(weight: number, reps: number): number {
  return weight * (1 + reps / 30);
}

function oneRmTable(sessions: SessionLog[]): OneRmRow[] {
  // Собираем по имени упражнения хронологическую серию оценок 1RM.
  const byEx = new Map<string, { ts: number; date: string; oneRm: number }[]>();
  for (const s of sessions) {
    for (const ex of s.exercises) {
      if (!isBaseLift(ex.name)) continue;
      if (ex.doneSets === 0) continue;
      const { weightKg, reps } = effectiveLoad(ex);
      if (!weightKg || !reps) continue;
      if (reps > 12) continue; // формула неточна для большого числа повторов
      const oneRm = epley1RM(weightKg, reps);
      const arr = byEx.get(ex.name) ?? [];
      arr.push({ ts: s.ts, date: s.date, oneRm });
      byEx.set(ex.name, arr);
    }
  }
  const rows: OneRmRow[] = [];
  for (const [name, points] of byEx) {
    points.sort((a, b) => a.ts - b.ts);
    // Берём максимум за каждую тренировку, потом последние 2 как «текущая» и «прошлая».
    const last = points[points.length - 1]!;
    const prev = points.length >= 2 ? points[points.length - 2]! : null;
    rows.push({
      name,
      current: Math.round(last.oneRm * 10) / 10,
      previous: prev ? Math.round(prev.oneRm * 10) / 10 : null,
      delta:
        prev !== null
          ? Math.round((last.oneRm - prev.oneRm) * 10) / 10
          : null,
      lastDate: last.date,
    });
  }
  return rows.sort((a, b) => b.current - a.current).slice(0, 5);
}

// Деload-детектор: за 4 недели RPE растёт, а тоннаж падает.
function deloadHint(sessions: SessionLog[]): Recommendation | null {
  const today = startOfWeek(new Date());
  const weeklyRpe: { sum: number; n: number; tonnage: number }[] = [
    { sum: 0, n: 0, tonnage: 0 },
    { sum: 0, n: 0, tonnage: 0 },
    { sum: 0, n: 0, tonnage: 0 },
    { sum: 0, n: 0, tonnage: 0 },
  ];
  for (const s of sessions) {
    const w = startOfWeek(new Date(s.ts));
    const diff = Math.floor(
      (today.getTime() - w.getTime()) / (7 * 24 * 3600 * 1000),
    );
    if (diff < 0 || diff > 3) continue;
    const idx = 3 - diff; // 0 = 3 нед назад, 3 = текущая
    const bucket = weeklyRpe[idx]!;
    if (typeof s.rpe === "number") {
      bucket.sum += s.rpe;
      bucket.n += 1;
    }
    for (const ex of s.exercises) {
      if (ex.weightKg && ex.reps && ex.doneSets) {
        bucket.tonnage += ex.weightKg * ex.reps * ex.doneSets;
      }
    }
  }
  // Нужно минимум 3 недели подряд с данными
  const filled = weeklyRpe.filter((w) => w.n > 0 && w.tonnage > 0);
  if (filled.length < 3) return null;
  // Сравним последние 2 недели с первыми 2
  const earlyRpe =
    (weeklyRpe[0]!.sum + weeklyRpe[1]!.sum) /
    Math.max(1, weeklyRpe[0]!.n + weeklyRpe[1]!.n);
  const lateRpe =
    (weeklyRpe[2]!.sum + weeklyRpe[3]!.sum) /
    Math.max(1, weeklyRpe[2]!.n + weeklyRpe[3]!.n);
  const earlyTon = weeklyRpe[0]!.tonnage + weeklyRpe[1]!.tonnage;
  const lateTon = weeklyRpe[2]!.tonnage + weeklyRpe[3]!.tonnage;
  if (earlyTon === 0 || earlyRpe === 0) return null;
  const rpeRise = lateRpe - earlyRpe;
  const tonDrop = (earlyTon - lateTon) / earlyTon;
  if (rpeRise >= 0.8 && tonDrop >= 0.15) {
    return {
      level: "warn",
      text: `За последние 2 недели RPE вырос (${earlyRpe.toFixed(1)} → ${lateRpe.toFixed(1)}), а тоннаж упал на ${Math.round(tonDrop * 100)}%. Это классические признаки накопленной усталости — рекомендуем разгрузочную неделю: сократите рабочие веса на 30–40% или количество подходов вдвое.`,
    };
  }
  return null;
}

function formatTonnage(kg: number): string {
  if (kg >= 1000) {
    return `${(kg / 1000).toFixed(1).replace(".", ",")} т`;
  }
  return `${kg} кг`;
}

interface MuscleSlice {
  muscle: string;
  sets: number;
}

function muscleBalance(sessions: SessionLog[], days = 30): MuscleSlice[] {
  const cutoff = Date.now() - days * 24 * 3600 * 1000;
  const map = new Map<string, number>();
  for (const s of sessions) {
    if (s.ts < cutoff) continue;
    for (const ex of s.exercises) {
      const m = String(ex.muscle);
      map.set(m, (map.get(m) ?? 0) + ex.doneSets);
    }
  }
  return Array.from(map.entries())
    .map(([muscle, sets]) => ({ muscle, sets }))
    .sort((a, b) => b.sets - a.sets);
}

interface RpePoint {
  date: string;
  rpe: number;
}

function rpeTrend(sessions: SessionLog[]): RpePoint[] {
  return sessions
    .filter((s) => typeof s.rpe === "number")
    .slice(-20)
    .map((s) => ({
      date: shortDate(s.date),
      rpe: s.rpe!,
    }));
}

interface TimePoint {
  date: string;
  planned: number;
  actual: number;
}

function timePlanVsActual(sessions: SessionLog[]): TimePoint[] {
  return sessions
    .filter((s) => typeof s.durationActual === "number")
    .slice(-12)
    .map((s) => ({
      date: shortDate(s.date),
      planned: s.durationPlanned,
      actual: s.durationActual!,
    }));
}

interface CalendarCell {
  date: string;
  level: 0 | 1 | 2 | 3 | 4;
  sets: number;
}

function calendarCells(sessions: SessionLog[], days = 49): CalendarCell[] {
  const cells: CalendarCell[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const byDate = new Map<string, number>();
  for (const s of sessions) {
    byDate.set(s.date, (byDate.get(s.date) ?? 0) + s.doneSets);
  }
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = ymd(d);
    const sets = byDate.get(key) ?? 0;
    let level: 0 | 1 | 2 | 3 | 4 = 0;
    if (sets > 0) level = 1;
    if (sets >= 10) level = 2;
    if (sets >= 18) level = 3;
    if (sets >= 28) level = 4;
    cells.push({ date: key, level, sets });
  }
  return cells;
}

// Сколько дней прошло с самой первой тренировки (включительно). Используется,
// чтобы развернуть «всю историю» в календаре.
function daysSinceFirstSession(sessions: SessionLog[]): number {
  if (sessions.length === 0) return 0;
  const first = sessions.reduce((m, s) => Math.min(m, s.ts), sessions[0]!.ts);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const firstDay = new Date(first);
  firstDay.setHours(0, 0, 0, 0);
  return Math.floor((today.getTime() - firstDay.getTime()) / (24 * 3600 * 1000)) + 1;
}

function shortDate(ymdStr: string): string {
  const d = ymdToDate(ymdStr);
  return `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// Анализ для адаптивных рекомендаций
interface Recommendation {
  level: "info" | "warn" | "good";
  text: string;
}

// Определяем «текущий» уровень по последним тренировкам (если он сохранён).
function currentLevel(
  sessions: SessionLog[],
): "beginner" | "intermediate" | "advanced" | null {
  for (let i = sessions.length - 1; i >= 0; i--) {
    const lvl = sessions[i]!.level;
    if (lvl) return lvl;
  }
  return null;
}

function analyzeForAdaptation(sessions: SessionLog[]): Recommendation[] {
  const recs: Recommendation[] = [];
  if (sessions.length < 3) return recs;
  const recent = sessions.slice(-6);
  const lvl = currentLevel(sessions);

  // 1. Высокий / низкий RPE — советы зависят от уровня
  const rpes = recent
    .map((s) => s.rpe)
    .filter((r): r is number => typeof r === "number");
  if (rpes.length >= 3) {
    const avg = rpes.reduce((a, b) => a + b, 0) / rpes.length;
    if (avg >= 8.5) {
      // Тяжело. Если уже начинающий — никаких «ниже уровня», даём конкретику.
      if (lvl === "beginner" || lvl === null) {
        recs.push({
          level: "warn",
          text:
            `Средний RPE ${avg.toFixed(1)} из 10 — каждая тренировка идёт «на пределе». Что попробовать на этой неделе: ` +
            `1) сократите рабочие веса на 20–30% и сосредоточьтесь на технике; ` +
            `2) увеличьте отдых между подходами до 90–120 секунд; ` +
            `3) уменьшите длительность тренировки на 10–15 минут; ` +
            `4) проверьте сон (нужно 7–9 ч) и питание (≥1.6 г белка на кг веса). ` +
            `Если ощущения не изменятся за неделю — возьмите 3–4 дня полного отдыха.`,
        });
      } else if (lvl === "intermediate") {
        recs.push({
          level: "warn",
          text:
            `Средний RPE ${avg.toFixed(1)} из 10 — нагрузка стабильно тяжёлая. Варианты: ` +
            `неделя разгрузки (веса −30–40% или подходы вдвое), либо переключитесь на уровень «начинающий» на 1–2 недели — это даст накопленной усталости уйти, не теряя формы.`,
        });
      } else {
        recs.push({
          level: "warn",
          text:
            `Средний RPE ${avg.toFixed(1)} из 10. На уровне «продвинутый» это сигнал к плановой разгрузке: ` +
            `неделя на 60% от рабочих весов, либо переключение на уровень «средний» с акцентом на технику и подвижность.`,
        });
      }
    } else if (avg <= 4) {
      if (lvl === "advanced") {
        recs.push({
          level: "info",
          text:
            `Средний RPE ${avg.toFixed(1)} из 10 — слишком легко для уровня «продвинутый». ` +
            `Поднимите рабочие веса на 5–10% или добавьте по одному подходу к базовым движениям.`,
        });
      } else {
        recs.push({
          level: "info",
          text:
            `Средний RPE ${avg.toFixed(1)} из 10 — субъективно легко. ` +
            `Можно увеличить рабочие веса на 5–10% или ${
              lvl === "beginner" ? "перейти на уровень «средний»" : "перейти на уровень «продвинутый»"
            }.`,
        });
      }
    }
  }

  // 2. План vs факт по времени
  const timed = recent.filter((s) => typeof s.durationActual === "number");
  if (timed.length >= 3) {
    const ratios = timed.map((s) => s.durationActual! / s.durationPlanned);
    const avg = ratios.reduce((a, b) => a + b, 0) / ratios.length;
    if (avg <= 0.7) {
      recs.push({
        level: "info",
        text: `Тренировки в среднем на ${Math.round((1 - avg) * 100)}% короче плана. Можно либо выбрать длительность поменьше (сэкономит время), либо добавить 1–2 подхода к ключевым упражнениям.`,
      });
    } else if (avg >= 1.25) {
      recs.push({
        level: "warn",
        text: `Тренировки в среднем на ${Math.round((avg - 1) * 100)}% длиннее плана. Сократите отдых между подходами на 15–30 секунд, либо выберите длительность побольше — иначе будете спешить и портить технику.`,
      });
    }
  }

  // 3. Пропуски подходов
  const totalDone = recent.reduce((s, x) => s + x.doneSets, 0);
  const totalPlanned = recent.reduce((s, x) => s + x.totalSets, 0);
  if (totalPlanned > 0) {
    const ratio = totalDone / totalPlanned;
    if (ratio < 0.7) {
      if (lvl === "beginner" || lvl === null) {
        recs.push({
          level: "warn",
          text:
            `Выполняете лишь ${Math.round(ratio * 100)}% запланированных подходов. ` +
            `Сократите длительность тренировки или количество упражнений в форме — лучше регулярно делать меньше, чем эпизодически выгорать.`,
        });
      } else {
        recs.push({
          level: "warn",
          text: `Выполняете в среднем ${Math.round(ratio * 100)}% запланированных подходов — текущий уровень слишком тяжёлый. Попробуйте уровень ниже на 2–3 недели.`,
        });
      }
    } else if (ratio >= 0.95) {
      recs.push({
        level: "good",
        text: `Выполняете ${Math.round(ratio * 100)}% подходов — отличная стабильность. Можно постепенно увеличивать рабочие веса (по 2.5 кг каждые 1–2 недели на базовых движениях).`,
      });
    }
  }

  // 4. Перекос мышц
  const balance = muscleBalance(sessions, 30);
  if (balance.length >= 3) {
    const total = balance.reduce((s, m) => s + m.sets, 0);
    const top = balance[0]!;
    if (top.sets / total > 0.5) {
      recs.push({
        level: "warn",
        text: `За последние 30 дней более ${Math.round((top.sets / total) * 100)}% подходов пришлось на «${top.muscle}». Чтобы выровнять, выберите фокус «${oppositeFocus(top.muscle)}» в форме на следующих 2–3 тренировках.`,
      });
    }
  }

  // 5. Частота тренировок (кол-во за последние 14 дней)
  const cutoff14 = Date.now() - 14 * 24 * 3600 * 1000;
  const recent14 = sessions.filter((s) => s.ts >= cutoff14).length;
  if (recent14 === 0) {
    recs.push({
      level: "info",
      text: "За последние 2 недели завершённых тренировок нет. Даже одна короткая сессия в неделю лучше, чем длинный перерыв — попробуйте 20–25 минут на ближайший день.",
    });
  } else if (recent14 >= 8) {
    recs.push({
      level: "warn",
      text: `За 2 недели — ${recent14} тренировок. Это много даже для продвинутых: оставьте минимум 1 полный день отдыха между силовыми, иначе восстановление и прогресс встанут.`,
    });
  }

  if (recs.length === 0) {
    recs.push({
      level: "good",
      text: "Тренировочный план сбалансирован, динамика в норме. Продолжайте в том же духе.",
    });
  }
  return recs;
}

// Подсказываем «противоположный» фокус по перекосу — простая мапа.
function oppositeFocus(muscle: string): string {
  const m = muscle.toLowerCase();
  if (m.includes("грудь") || m.includes("плеч") || m.includes("трицеп")) return "Pull (спина + бицепс)";
  if (m.includes("спин") || m.includes("бицеп")) return "Push (грудь + плечи + трицепс)";
  if (m.includes("ног") || m.includes("ягод")) return "Push или Pull (верх тела)";
  return "противоположную группу мышц";
}

// =====================================================================
//                              Компоненты
// =====================================================================

export function Analytics() {
  const [sessions, setSessions] = useState<SessionLog[]>(() => listSessions());
  const [pro, setProState] = useState(() => isPro());

  useEffect(() => subscribeSessions(() => setSessions(listSessions())), []);
  useEffect(() => subscribePro(() => setProState(isPro())), []);

  const weeks = useMemo(() => weeklyVolume(sessions), [sessions]);
  const tonnage = useMemo(() => weeklyTonnage(sessions), [sessions]);
  const tonnageStats = useMemo(() => {
    const cur = tonnage[tonnage.length - 1]?.tonnage ?? 0;
    const prev = tonnage[tonnage.length - 2]?.tonnage ?? 0;
    const deltaKg = cur - prev;
    const deltaPct = prev > 0 ? Math.round((deltaKg / prev) * 100) : null;
    return { cur, prev, deltaKg, deltaPct };
  }, [tonnage]);
  const balance = useMemo(() => muscleBalance(sessions), [sessions]);
  const rpes = useMemo(() => rpeTrend(sessions), [sessions]);
  const times = useMemo(() => timePlanVsActual(sessions), [sessions]);
  const [calendarFull, setCalendarFull] = useState(false);
  const calendarDays = useMemo(
    () =>
      calendarFull
        ? Math.max(49, daysSinceFirstSession(sessions))
        : 49,
    [calendarFull, sessions],
  );
  const cells = useMemo(
    () => calendarCells(sessions, calendarDays),
    [sessions, calendarDays],
  );
  const oneRm = useMemo(() => oneRmTable(sessions), [sessions]);
  const recs = useMemo(() => {
    const base = analyzeForAdaptation(sessions);
    const deload = deloadHint(sessions);
    return deload ? [deload, ...base.filter((r) => r.level !== "good")] : base;
  }, [sessions]);

  if (sessions.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-6 text-center space-y-3">
        <h2 className="text-lg font-semibold">Аналитика пока пуста</h2>
        <p className="text-sm text-muted-foreground">
          Запустите тренировку с экрана «Тренировка» и нажмите «Тренируюсь
          сейчас» — после первой завершённой сессии здесь появятся графики и
          рекомендации.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Pro-переключатель */}
      <ProBanner pro={pro} />

      {/* Бесплатно: недельный объём */}
      <Card title="Объём по неделям" subtitle="Сделанные подходы за последние 8 недель">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={weeks}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="week" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Bar dataKey="sets" name="Подходы" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Бесплатно: календарь активности */}
      <Card
        title="Активность"
        subtitle={
          calendarFull
            ? `Вся история — ${sessions.length} тренировок с ${shortDate(
                cells[0]!.date,
              )}`
            : "Последние 7 недель — интенсивность по объёму подходов"
        }
      >
        <CalendarHeatmap cells={cells} />
        {sessions.length > 0 && daysSinceFirstSession(sessions) > 49 && (
          <button
            type="button"
            onClick={() => setCalendarFull((v) => !v)}
            className="mt-3 text-xs text-primary hover:underline"
          >
            {calendarFull ? "Свернуть до 7 недель" : "Показать всю историю"}
          </button>
        )}
      </Card>

      {/* Pro: тоннаж по неделям */}
      <ProCard
        pro={pro}
        title="Тоннаж: общий поднятый вес по неделям"
        subtitle="Сумма (вес × повторения × подходы) — главный показатель объёма силовой работы"
      >
        {tonnageStats.cur > 0 || tonnageStats.prev > 0 ? (
          <div className="space-y-3">
            <div className="flex items-baseline justify-between gap-3 flex-wrap">
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">
                  За эту неделю
                </div>
                <div className="text-3xl font-bold tabular-nums">
                  {formatTonnage(tonnageStats.cur)}
                </div>
              </div>
              {tonnageStats.prev > 0 && (
                <div
                  className={`rounded-md px-3 py-1.5 text-sm font-semibold ${
                    tonnageStats.deltaKg > 0
                      ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/40"
                      : tonnageStats.deltaKg < 0
                        ? "bg-rose-500/15 text-rose-300 border border-rose-500/40"
                        : "bg-muted text-muted-foreground border"
                  }`}
                >
                  {tonnageStats.deltaKg > 0 ? "+" : ""}
                  {formatTonnage(Math.abs(tonnageStats.deltaKg)).replace(
                    /^/,
                    tonnageStats.deltaKg < 0 ? "−" : "",
                  )}
                  {tonnageStats.deltaPct !== null &&
                    ` (${tonnageStats.deltaPct > 0 ? "+" : ""}${tonnageStats.deltaPct}%)`}
                  <span className="ml-1 text-xs opacity-75">vs пред. неделя</span>
                </div>
              )}
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={tonnage}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis
                  tick={{ fontSize: 11 }}
                  stroke="hsl(var(--muted-foreground))"
                  tickFormatter={(v: number) =>
                    v >= 1000 ? `${(v / 1000).toFixed(1)}т` : `${v}`
                  }
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v: number) => [formatTonnage(v), "Тоннаж"]}
                />
                <Bar dataKey="tonnage" name="Тоннаж" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <Empty>
            Нужен указанный вес и повторения в упражнениях. Откройте тренировку
            и впишите рабочий вес — после первой завершённой сессии тоннаж
            появится здесь.
          </Empty>
        )}
      </ProCard>

      {/* Pro: 1RM по базовым упражнениям */}
      <ProCard
        pro={pro}
        title="Прогноз 1ПМ (одноповторный максимум)"
        subtitle="Оценка по формуле Эпли для базовых упражнений с 1–10 повторениями"
      >
        {oneRm.length > 0 ? (
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b">
                  <th className="px-2 py-2 font-medium">Упражнение</th>
                  <th className="px-2 py-2 font-medium text-right">1ПМ</th>
                  <th className="px-2 py-2 font-medium text-right">Изменение</th>
                  <th className="px-2 py-2 font-medium text-right">Дата</th>
                </tr>
              </thead>
              <tbody>
                {oneRm.map((row) => (
                  <tr key={row.name} className="border-b last:border-0">
                    <td className="px-2 py-2">{row.name}</td>
                    <td className="px-2 py-2 text-right font-semibold tabular-nums">
                      {row.current} кг
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums">
                      {row.delta === null ? (
                        <span className="text-muted-foreground">—</span>
                      ) : row.delta > 0 ? (
                        <span className="text-emerald-300">+{row.delta} кг</span>
                      ) : row.delta < 0 ? (
                        <span className="text-rose-300">{row.delta} кг</span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </td>
                    <td className="px-2 py-2 text-right text-xs text-muted-foreground">
                      {shortDate(row.lastDate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty>
            Нужны базовые упражнения (жимы, приседы, тяги) с указанным весом и
            1–10 повторениями. После таких тренировок здесь появится оценка
            одноповторного максимума.
          </Empty>
        )}
      </ProCard>

      {/* Pro: баланс мышц */}
      <ProCard pro={pro} title="Баланс мышц за 30 дней">
        {balance.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={balance}
                dataKey="sets"
                nameKey="muscle"
                outerRadius={90}
                innerRadius={42}
                label={(entry: { muscle?: string; sets?: number }) =>
                  `${entry.muscle ?? ""}: ${entry.sets ?? 0}`
                }
                labelLine={false}
              >
                {balance.map((s, i) => (
                  <Cell key={i} fill={colorFor(s.muscle)} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <Empty>За 30 дней нет данных</Empty>
        )}
      </ProCard>

      {/* Pro: RPE тренд */}
      <ProCard
        pro={pro}
        title="Субъективная нагрузка (RPE)"
        subtitle="Шкала 1–10. Помогает увидеть, не перегружаетесь ли вы"
      >
        {rpes.length >= 2 ? (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={rpes}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis domain={[1, 10]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="rpe"
                name="RPE"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <Empty>Нужно минимум 2 завершённые тренировки с оценкой RPE</Empty>
        )}
      </ProCard>

      {/* Pro: план vs факт по времени */}
      <ProCard
        pro={pro}
        title="Время: план и факт"
        subtitle="Сколько вы планировали и сколько в действительности занимались"
      >
        {times.length >= 2 ? (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={times}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="planned" name="План" stroke="#94a3b8" strokeWidth={2} dot={{ r: 2 }} />
              <Line type="monotone" dataKey="actual" name="Факт" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <Empty>Нужно минимум 2 завершённые тренировки</Empty>
        )}
      </ProCard>

      {/* Pro: рекомендации */}
      <ProCard
        pro={pro}
        title="Рекомендации тренера"
        subtitle="Конкретные советы по последним 6 тренировкам — что сделать на следующей неделе"
      >
        <ul className="space-y-2">
          {recs.map((r, i) => (
            <li
              key={i}
              className={`rounded-md border p-3 text-sm ${
                r.level === "warn"
                  ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
                  : r.level === "good"
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                    : "border-sky-500/40 bg-sky-500/10 text-sky-200"
              }`}
            >
              {r.text}
            </li>
          ))}
        </ul>
      </ProCard>
    </div>
  );
}

function ProBanner({ pro }: { pro: boolean }) {
  return (
    <div
      className={`rounded-xl border p-4 flex items-center justify-between gap-3 ${
        pro
          ? "border-emerald-500/40 bg-emerald-500/10"
          : "border-amber-500/40 bg-amber-500/10"
      }`}
    >
      <div className="text-sm">
        <p className="font-semibold">
          {pro ? "Pro включён" : "Pro отключён"}
        </p>
        <p className="text-xs text-muted-foreground">
          {pro
            ? "Доступны баланс мышц, тренд RPE, план vs факт и автоанализ."
            : "На запуске Pro бесплатный — нажмите чтобы открыть аналитику полностью."}
        </p>
      </div>
      <button
        type="button"
        onClick={() => setPro(!pro)}
        className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
          pro
            ? "border bg-background hover:bg-muted/60"
            : "bg-primary text-primary-foreground hover:opacity-90"
        }`}
      >
        {pro ? "Выключить" : "Включить Pro"}
      </button>
    </div>
  );
}

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-card p-4 sm:p-5 shadow-sm">
      <div className="mb-3">
        <h3 className="font-semibold">{title}</h3>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  );
}

function ProCard({
  pro,
  title,
  subtitle,
  children,
}: {
  pro: boolean;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  if (pro) return <Card title={title} subtitle={subtitle}>{children}</Card>;
  return (
    <div className="relative rounded-xl border bg-card p-4 sm:p-5 shadow-sm overflow-hidden">
      <div className="mb-3">
        <h3 className="font-semibold flex items-center gap-2">
          {title}
          <span className="text-[10px] uppercase tracking-wider rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5">
            Pro
          </span>
        </h3>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
      <div className="opacity-30 pointer-events-none select-none blur-[2px]">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <button
          type="button"
          onClick={() => setPro(true)}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 shadow-lg"
        >
          Включить Pro
        </button>
      </div>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-sm text-muted-foreground text-center py-8">
      {children}
    </div>
  );
}

function CalendarHeatmap({ cells }: { cells: CalendarCell[] }) {
  // Раскладываем в колонки по неделям (как у GitHub): каждая колонка =
  // одна неделя, 7 строк = понедельник…воскресенье.
  // Если в первой неделе не хватает дней (история начинается со среды) —
  // первые ячейки пустые.
  const colorFor = (level: number): string => {
    if (level === 0) return "bg-muted/30 border-border";
    if (level === 1) return "bg-emerald-500/20 border-emerald-500/40";
    if (level === 2) return "bg-emerald-500/40 border-emerald-500/60";
    if (level === 3) return "bg-emerald-500/60 border-emerald-500/70";
    return "bg-emerald-500/80 border-emerald-500";
  };
  const dayLabels = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
  const months = [
    "янв",
    "фев",
    "мар",
    "апр",
    "мая",
    "июн",
    "июл",
    "авг",
    "сен",
    "окт",
    "ноя",
    "дек",
  ];

  if (cells.length === 0) return null;

  // Строим колонки. Каждая колонка — массив из 7 опциональных ячеек.
  const columns: (CalendarCell | null)[][] = [];
  let current: (CalendarCell | null)[] = Array(7).fill(null);
  let lastWeekIdx = -1;
  for (const c of cells) {
    const d = ymdToDate(c.date);
    const dow = (d.getDay() + 6) % 7; // 0 = пн
    // Считаем «индекс недели» относительно понедельника эпохи — для группировки
    const weekIdx = Math.floor(
      (Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) -
        Date.UTC(2020, 0, 6)) /
        (7 * 24 * 3600 * 1000),
    );
    if (lastWeekIdx === -1) lastWeekIdx = weekIdx;
    if (weekIdx !== lastWeekIdx) {
      columns.push(current);
      current = Array(7).fill(null);
      lastWeekIdx = weekIdx;
    }
    current[dow] = c;
  }
  columns.push(current);

  // Подписи месяцев: показываем там, где в колонке появляется новый месяц
  // (на любой ненулевой ячейке).
  const monthLabels: (string | null)[] = columns.map((col) => {
    const firstCell = col.find((c): c is CalendarCell => c !== null);
    if (!firstCell) return null;
    const d = ymdToDate(firstCell.date);
    return d.getDate() <= 7 ? months[d.getMonth()]! : null;
  });
  // Подписи года — где меняется год
  let lastYear = -1;
  const yearLabels: (string | null)[] = columns.map((col) => {
    const firstCell = col.find((c): c is CalendarCell => c !== null);
    if (!firstCell) return null;
    const y = ymdToDate(firstCell.date).getFullYear();
    if (y !== lastYear) {
      lastYear = y;
      return String(y);
    }
    return null;
  });

  return (
    <div className="space-y-1 overflow-x-auto">
      <div className="inline-block min-w-full">
        {/* Год */}
        <div className="flex gap-[3px] pl-7 mb-1">
          {yearLabels.map((y, i) => (
            <div
              key={`y-${i}`}
              className="w-[14px] text-[10px] text-muted-foreground font-medium"
            >
              {y ?? ""}
            </div>
          ))}
        </div>
        {/* Месяц */}
        <div className="flex gap-[3px] pl-7 mb-1">
          {monthLabels.map((m, i) => (
            <div
              key={`m-${i}`}
              className="w-[14px] text-[10px] text-muted-foreground"
            >
              {m ?? ""}
            </div>
          ))}
        </div>
        {/* Сетка: дни недели слева + колонки */}
        <div className="flex gap-1.5">
          <div className="flex flex-col gap-[3px] w-5 shrink-0">
            {dayLabels.map((l, i) => (
              <span
                key={i}
                className="text-[10px] text-muted-foreground h-3.5 leading-3.5"
              >
                {i % 2 === 0 ? l : ""}
              </span>
            ))}
          </div>
          <div className="flex gap-[3px]">
            {columns.map((col, ci) => (
              <div key={ci} className="flex flex-col gap-[3px]">
                {col.map((c, ri) =>
                  c ? (
                    <div
                      key={c.date}
                      title={`${c.date}: ${c.sets} подх.`}
                      className={`h-3.5 w-3.5 rounded-sm border ${colorFor(c.level)}`}
                    />
                  ) : (
                    <div key={ri} className="h-3.5 w-3.5" />
                  ),
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <span>меньше</span>
        {[0, 1, 2, 3, 4].map((l) => (
          <div
            key={l}
            className={`h-3 w-3 rounded-sm border ${colorFor(l)}`}
          />
        ))}
        <span>больше</span>
      </div>
    </div>
  );
}
