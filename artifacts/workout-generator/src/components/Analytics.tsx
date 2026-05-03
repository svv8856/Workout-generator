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

function shortDate(ymdStr: string): string {
  const d = ymdToDate(ymdStr);
  return `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// Анализ для адаптивных рекомендаций
interface Recommendation {
  level: "info" | "warn" | "good";
  text: string;
}

function analyzeForAdaptation(sessions: SessionLog[]): Recommendation[] {
  const recs: Recommendation[] = [];
  if (sessions.length < 3) return recs;
  const recent = sessions.slice(-6);

  // 1. Высокий RPE стабильно
  const rpes = recent.map((s) => s.rpe).filter((r): r is number => typeof r === "number");
  if (rpes.length >= 3) {
    const avg = rpes.reduce((a, b) => a + b, 0) / rpes.length;
    if (avg >= 8.5) {
      recs.push({
        level: "warn",
        text: `Средний RPE последних тренировок ${avg.toFixed(1)} из 10 — нагрузка стабильно тяжёлая. Рекомендуем неделю восстановления или выбрать на уровень меньше.`,
      });
    } else if (avg <= 4) {
      recs.push({
        level: "info",
        text: `Средний RPE ${avg.toFixed(1)} из 10 — нагрузка субъективно лёгкая. Можно увеличить веса или перейти на уровень выше.`,
      });
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
        text: `Тренировки в среднем на ${Math.round((1 - avg) * 100)}% короче плана. Попробуйте выбрать длительность поменьше — это сэкономит время.`,
      });
    } else if (avg >= 1.25) {
      recs.push({
        level: "warn",
        text: `Тренировки в среднем на ${Math.round((avg - 1) * 100)}% длиннее плана. Возможно, стоит выбрать длительность побольше или сократить количество подходов.`,
      });
    }
  }

  // 3. Пропуски подходов
  const totalDone = recent.reduce((s, x) => s + x.doneSets, 0);
  const totalPlanned = recent.reduce((s, x) => s + x.totalSets, 0);
  if (totalPlanned > 0) {
    const ratio = totalDone / totalPlanned;
    if (ratio < 0.7) {
      recs.push({
        level: "warn",
        text: `Выполняете в среднем ${Math.round(ratio * 100)}% запланированных подходов. Возможно, текущий уровень слишком тяжёлый — попробуйте на ступень ниже.`,
      });
    } else if (ratio >= 0.95) {
      recs.push({
        level: "good",
        text: `Выполняете ${Math.round(ratio * 100)}% подходов — отличная стабильность. Можно постепенно увеличивать рабочие веса.`,
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
        text: `За последние 30 дней более ${Math.round((top.sets / total) * 100)}% подходов пришлось на «${top.muscle}». Стоит больше внимания уделить остальным группам мышц.`,
      });
    }
  }

  if (recs.length === 0) {
    recs.push({
      level: "good",
      text: "Тренировочный план сбалансирован, динамика в норме. Продолжайте в том же духе.",
    });
  }
  return recs;
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
  const balance = useMemo(() => muscleBalance(sessions), [sessions]);
  const rpes = useMemo(() => rpeTrend(sessions), [sessions]);
  const times = useMemo(() => timePlanVsActual(sessions), [sessions]);
  const cells = useMemo(() => calendarCells(sessions), [sessions]);
  const recs = useMemo(() => analyzeForAdaptation(sessions), [sessions]);

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
      <Card title="Активность" subtitle="Последние 7 недель — интенсивность по объёму подходов">
        <CalendarHeatmap cells={cells} />
      </Card>

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
        title="Что подкрутить"
        subtitle="Автоматический анализ последних 6 тренировок"
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
  // 7 строк × N столбцов; ставим понедельник вверху
  const rows: CalendarCell[][] = [[], [], [], [], [], [], []];
  for (const c of cells) {
    const d = ymdToDate(c.date);
    const row = (d.getDay() + 6) % 7; // 0=пн
    rows[row]!.push(c);
  }
  const colorFor = (level: number): string => {
    if (level === 0) return "bg-muted/30 border-border";
    if (level === 1) return "bg-emerald-500/20 border-emerald-500/40";
    if (level === 2) return "bg-emerald-500/40 border-emerald-500/60";
    if (level === 3) return "bg-emerald-500/60 border-emerald-500/70";
    return "bg-emerald-500/80 border-emerald-500";
  };
  const labels = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
  return (
    <div className="space-y-1">
      {rows.map((row, ri) => (
        <div key={ri} className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground w-5 shrink-0">
            {labels[ri]}
          </span>
          <div className="flex gap-1 flex-wrap">
            {row.map((c) => (
              <div
                key={c.date}
                title={`${c.date}: ${c.sets} подх.`}
                className={`h-3.5 w-3.5 rounded-sm border ${colorFor(c.level)}`}
              />
            ))}
          </div>
        </div>
      ))}
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
