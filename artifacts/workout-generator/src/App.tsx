import { useEffect, useState } from "react";
import {
  generateWorkout,
  generateCourse,
  clearWorkoutHistory,
  getHistorySummary,
  getFullHistory,
  trainingDaysInLast,
  type FormData,
  type Course,
  type CourseDays,
  type CourseWeeks,
  type FullHistoryEntry,
} from "@/lib/workout";

type Theme = "light" | "dark";

function useTheme(): [Theme, (t: Theme) => void] {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "light";
    const saved = window.localStorage.getItem("wg_theme");
    if (saved === "dark" || saved === "light") return saved;
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    window.localStorage.setItem("wg_theme", theme);
  }, [theme]);
  return [theme, setTheme];
}

type Mode = "single" | "course";

const initialForm: FormData = {
  age: 30,
  weight: 75,
  gender: "male",
  level: "beginner",
  goal: "strength",
  place: "home",
  duration: 30,
  homeDumbbells: false,
  homeBands: false,
};

const labels = {
  gender: { male: "Мужской", female: "Женский" } as const,
  level: {
    beginner: "Начинающий",
    intermediate: "Средний",
    advanced: "Продвинутый",
  } as const,
  goal: {
    strength: "Сила",
    endurance: "Выносливость",
    fatburn: "Жиросжигание",
  } as const,
  place: { home: "Дом", gym: "Зал", outdoor: "Улица" } as const,
};

function App() {
  const [form, setForm] = useState<FormData>(initialForm);
  const [mode, setMode] = useState<Mode>("single");
  const [weeksCount, setWeeksCount] = useState<CourseWeeks>(4);
  const [daysPerWeek, setDaysPerWeek] = useState<CourseDays>(3);
  const [result, setResult] = useState<ReturnType<typeof generateWorkout> | null>(
    null,
  );
  const [course, setCourse] = useState<Course | null>(null);
  const [historyTick, setHistoryTick] = useState(0);
  const [theme, setTheme] = useTheme();
  // historyTick triggers re-read of history after mutations
  void historyTick;
  const history = getHistorySummary();
  const fullHistory = getFullHistory();
  const recentDays = trainingDaysInLast(7);
  const showCourseSuggestion = mode === "single" && recentDays >= 4;

  const update = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "single") {
      setResult(generateWorkout(form));
      setCourse(null);
    } else {
      setCourse(generateCourse(form, weeksCount, daysPerWeek));
      setResult(null);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:py-10">
        <header className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Генератор тренировок
            </h1>
            <p className="mt-2 text-muted-foreground">
              Подберём 5–6 упражнений под вашу цель, уровень и место занятий.
            </p>
          </div>
          <button
            type="button"
            aria-label="Переключить тему"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="shrink-0 rounded-lg border bg-card px-3 py-2 text-sm hover:bg-muted/60 transition flex items-center gap-2"
          >
            <span className="text-base leading-none">
              {theme === "dark" ? "☀" : "☾"}
            </span>
            <span className="hidden sm:inline">
              {theme === "dark" ? "Светлая" : "Тёмная"}
            </span>
          </button>
        </header>

        <div className="grid gap-6 md:grid-cols-[1fr_1.2fr]">
          <form
            onSubmit={onSubmit}
            className="rounded-xl border bg-card p-4 sm:p-6 shadow-sm space-y-5"
          >
            <Field label="Тип">
              <div className="grid grid-cols-2 gap-2">
                <Pill active={mode === "single"} onClick={() => setMode("single")}>
                  Одна тренировка
                </Pill>
                <Pill active={mode === "course"} onClick={() => setMode("course")}>
                  Курс
                </Pill>
              </div>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Возраст">
                <input
                  type="number"
                  min={10}
                  max={100}
                  value={form.age}
                  onChange={(e) => update("age", Number(e.target.value))}
                  className={inputClass}
                />
              </Field>
              <Field label="Вес, кг">
                <input
                  type="number"
                  min={30}
                  max={250}
                  value={form.weight}
                  onChange={(e) => update("weight", Number(e.target.value))}
                  className={inputClass}
                />
              </Field>
            </div>

            <Field label="Пол">
              <div className="grid grid-cols-2 gap-2">
                {(["male", "female"] as const).map((g) => (
                  <Pill
                    key={g}
                    active={form.gender === g}
                    onClick={() => update("gender", g)}
                  >
                    {labels.gender[g]}
                  </Pill>
                ))}
              </div>
            </Field>

            <Field label="Уровень подготовки">
              <div className="grid grid-cols-3 gap-2">
                {(["beginner", "intermediate", "advanced"] as const).map((l) => (
                  <Pill
                    key={l}
                    active={form.level === l}
                    onClick={() => update("level", l)}
                  >
                    {labels.level[l]}
                  </Pill>
                ))}
              </div>
            </Field>

            <Field label="Цель">
              <div className="grid grid-cols-3 gap-2">
                {(["strength", "endurance", "fatburn"] as const).map((g) => (
                  <Pill
                    key={g}
                    active={form.goal === g}
                    onClick={() => update("goal", g)}
                  >
                    {labels.goal[g]}
                  </Pill>
                ))}
              </div>
            </Field>

            <Field label="Место занятий">
              <div className="grid grid-cols-3 gap-2">
                {(["home", "gym", "outdoor"] as const).map((p) => (
                  <Pill
                    key={p}
                    active={form.place === p}
                    onClick={() => update("place", p)}
                  >
                    {labels.place[p]}
                  </Pill>
                ))}
              </div>
            </Field>

            {form.place === "home" && (
              <Field label="Инвентарь дома (необязательно)">
                <div className="grid grid-cols-2 gap-2">
                  <Pill
                    active={!!form.homeDumbbells}
                    onClick={() => update("homeDumbbells", !form.homeDumbbells)}
                  >
                    Гантели
                  </Pill>
                  <Pill
                    active={!!form.homeBands}
                    onClick={() => update("homeBands", !form.homeBands)}
                  >
                    Резинки
                  </Pill>
                </div>
              </Field>
            )}

            {mode === "single" && (
              <Field label={`Длительность: ${form.duration} мин`}>
                <input
                  type="range"
                  min={10}
                  max={90}
                  step={5}
                  value={form.duration}
                  onChange={(e) => update("duration", Number(e.target.value))}
                  className="w-full accent-[hsl(var(--primary))]"
                />
              </Field>
            )}

            {mode === "course" && (
              <>
                <Field label="Длительность курса">
                  <div className="grid grid-cols-4 gap-2">
                    {([2, 4, 8, 12] as CourseWeeks[]).map((w) => (
                      <Pill
                        key={w}
                        active={weeksCount === w}
                        onClick={() => setWeeksCount(w)}
                      >
                        {w} нед
                      </Pill>
                    ))}
                  </div>
                </Field>
                <Field label="Тренировок в неделю">
                  <div className="grid grid-cols-4 gap-2">
                    {([2, 3, 4, 5] as CourseDays[]).map((d) => (
                      <Pill
                        key={d}
                        active={daysPerWeek === d}
                        onClick={() => setDaysPerWeek(d)}
                      >
                        {d}
                      </Pill>
                    ))}
                  </div>
                </Field>
                <p className="text-xs text-muted-foreground">
                  Рекомендуем: новичкам — 3 раза/нед, средним — 3–4, продвинутым —
                  4–5. Оптимальный курс — 4–8 недель.
                </p>
              </>
            )}

            {mode === "single" && history.lastFocus && (
              <div className="rounded-md border bg-muted/40 px-3 py-2 text-xs flex items-center justify-between gap-2">
                <span>
                  <span className="text-muted-foreground">Прошлая тренировка:</span>{" "}
                  <span className="font-medium text-foreground">
                    {history.lastFocus}
                  </span>{" "}
                  <span className="text-muted-foreground">· {history.lastWhen}</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    clearWorkoutHistory();
                    setHistoryTick((t) => t + 1);
                  }}
                  className="text-muted-foreground hover:text-foreground underline underline-offset-2"
                >
                  сбросить
                </button>
              </div>
            )}

            {showCourseSuggestion && (
              <div className="rounded-md border border-accent/40 bg-accent/10 px-3 py-2.5 text-xs space-y-1.5">
                <p>
                  <b>Вы тренируетесь {recentDays} дней за последнюю неделю.</b>{" "}
                  Если занимаетесь регулярно — лучше переключиться на режим
                  «Курс»: там сплит по дням и периодизация (втягивающая →
                  пиковая → разгрузочная), а не случайные тренировки.
                </p>
                <button
                  type="button"
                  onClick={() => setMode("course")}
                  className="text-accent-foreground bg-accent rounded px-2 py-1 text-[11px] font-medium hover:opacity-90"
                >
                  Перейти на курс →
                </button>
              </div>
            )}

            <button
              type="submit"
              className="w-full rounded-lg bg-primary py-3 font-semibold text-primary-foreground transition hover:opacity-90 active:scale-[.99]"
            >
              {mode === "single" ? "Сгенерировать тренировку" : "Построить курс"}
            </button>
          </form>

          {result ? (
            <div className="rounded-xl border bg-card p-4 sm:p-6 shadow-sm">
              <ResultView result={result} duration={form.duration} />
            </div>
          ) : course ? (
            <div className="rounded-xl border bg-card p-4 sm:p-6 shadow-sm">
              <CourseView course={course} />
            </div>
          ) : (
            <div className="hidden md:flex rounded-xl border bg-card p-6 shadow-sm h-full min-h-[300px] items-center justify-center text-center text-muted-foreground">
              <p>
                Заполните форму слева и нажмите кнопку.
              </p>
            </div>
          )}
        </div>

        {fullHistory.length > 0 && (
          <div className="mt-8">
            <HistoryCalendar
              entries={fullHistory}
              onClear={() => {
                clearWorkoutHistory();
                setHistoryTick((t) => t + 1);
              }}
            />
          </div>
        )}

        <footer className="mt-10 text-center text-xs text-muted-foreground">
          Это базовые рекомендации. При проблемах со здоровьем
          проконсультируйтесь с врачом.
        </footer>
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "min-w-0 w-full rounded-lg border px-1.5 py-2 text-[11px] sm:text-sm font-medium leading-tight whitespace-nowrap overflow-hidden text-ellipsis text-center transition " +
        (active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-input bg-background hover:bg-secondary")
      }
    >
      {children}
    </button>
  );
}

function ResultView({
  result,
  duration,
}: {
  result: NonNullable<ReturnType<typeof generateWorkout>>;
  duration: number;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold">Ваша тренировка</h2>
        <p className="text-sm text-muted-foreground">
          {duration} минут · сожжёте ≈{" "}
          <span className="font-semibold text-foreground">
            {result.calories}
          </span>{" "}
          ккал
        </p>
      </div>
      {result.warnings.length > 0 && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4">
          <p className="mb-2 text-sm font-semibold text-destructive">
            Предупреждения
          </p>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {result.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}
      {result.focusLabel && (
        <div className="rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
          <span className="font-semibold">Фокус сегодня:</span> {result.focusLabel}
          {result.focusNote && (
            <span className="block text-xs text-muted-foreground mt-0.5">
              {result.focusNote}
            </span>
          )}
        </div>
      )}
      {result.summary && (
        <p className="text-xs text-muted-foreground">
          Задействуем: {result.summary}
        </p>
      )}
      <div className="rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
        <span className="font-semibold">Отдых между упражнениями:</span>{" "}
        {result.restBetween}
      </div>
      <ol className="space-y-2">
        {result.exercises.map((ex, i) => (
          <li
            key={i}
            className="flex items-start gap-3 rounded-lg border bg-background p-3"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              {i + 1}
            </span>
            <div className="flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <p className="font-medium">{ex.name}</p>
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  {ex.muscle}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{ex.sets}</p>
              {ex.weight && (
                <p className="mt-0.5 text-sm font-medium text-primary">
                  Вес: {ex.weight}
                </p>
              )}
              <p className="mt-1.5 text-sm">
                <span className="mr-1">🎥</span>
                <span className="font-medium">Как делать:</span>{" "}
                <span className="text-muted-foreground">{ex.cue}</span>
              </p>
              <a
                href={ex.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                ▶ Видео техники на YouTube
              </a>
            </div>
          </li>
        ))}
      </ol>
      <div className="rounded-lg border border-accent/30 bg-accent/10 p-4">
        <p className="mb-2 text-sm font-semibold text-[#593636]">
          Советы по отдыху
        </p>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {result.tips.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
      </div>
      <div className="rounded-lg border border-muted bg-muted/30 p-4 text-xs leading-relaxed text-muted-foreground">
        <p className="mb-1 font-semibold text-foreground">Откуда эти данные</p>
        <p className="mb-2">
          Программа подбирается по общепринятым рекомендациям спортивной науки:
          протоколы NSCA и ACSM (подходы/повторения/отдых), компендиум физической
          активности Ainsworth (расчёт калорий), типичные тренерские нормы для
          расчёта рабочих весов от массы тела с поправкой на пол, уровень и цель.
        </p>
        <p>
          <span className="font-semibold text-foreground">Важно:</span> это
          ориентир для здоровых людей, а не индивидуальный план. При проблемах со
          здоровьем, травмах, беременности или серьёзных спортивных целях
          проконсультируйтесь с врачом и тренером. Слушайте своё тело и
          останавливайтесь при боли.
        </p>
      </div>
    </div>
  );
}

function HistoryCalendar({
  entries,
  onClear,
}: {
  entries: FullHistoryEntry[];
  onClear: () => void;
}) {
  // Сетка последних 14 дней (новые слева)
  const days: { date: string; label: string; entry?: FullHistoryEntry }[] = [];
  const ru = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
  const months = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    days.push({
      date: key,
      label: `${ru[d.getDay()]}\n${d.getDate()} ${months[d.getMonth()]}`,
      entry: entries.find((e) => e.date === key),
    });
  }

  const focusColor = (focus: string): string => {
    if (/push/i.test(focus)) return "bg-rose-500/20 border-rose-500/40 text-rose-300";
    if (/pull/i.test(focus)) return "bg-sky-500/20 border-sky-500/40 text-sky-300";
    if (/legs|ноги/i.test(focus)) return "bg-emerald-500/20 border-emerald-500/40 text-emerald-300";
    if (/всё тело|тело/i.test(focus)) return "bg-amber-500/20 border-amber-500/40 text-amber-300";
    return "bg-primary/20 border-primary/40 text-primary";
  };

  return (
    <div className="rounded-xl border bg-card p-4 sm:p-6 shadow-sm">
      <div className="flex items-baseline justify-between gap-3 mb-3 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold">Календарь тренировок</h2>
          <p className="text-xs text-muted-foreground">
            Последние 14 дней. Сегодня — слева.
          </p>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
        >
          очистить историю
        </button>
      </div>

      <div className="grid grid-cols-7 sm:grid-cols-14 gap-1.5">
        {days.map((d, i) => (
          <div
            key={d.date}
            className={`relative rounded-md border p-1.5 sm:p-2 min-h-[64px] flex flex-col gap-1 ${
              d.entry
                ? focusColor(d.entry.focus)
                : "bg-muted/30 border-border text-muted-foreground"
            } ${i === 0 ? "ring-2 ring-primary/40" : ""}`}
            title={d.entry ? d.entry.focus : "День отдыха"}
          >
            <div className="text-[10px] leading-tight whitespace-pre-line opacity-80">
              {d.label}
            </div>
            {d.entry ? (
              <div className="text-[10px] font-semibold leading-tight line-clamp-2">
                {d.entry.focus.replace(/\s*\([^)]*\)/g, "")}
              </div>
            ) : (
              <div className="text-[10px] opacity-50">отдых</div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-muted-foreground">
        <Legend color="bg-rose-500/40" label="Push" />
        <Legend color="bg-sky-500/40" label="Pull" />
        <Legend color="bg-emerald-500/40" label="Legs" />
        <Legend color="bg-amber-500/40" label="Всё тело" />
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`inline-block w-2.5 h-2.5 rounded-sm ${color}`} />
      {label}
    </span>
  );
}

function CourseView({ course }: { course: Course }) {
  const [openWeek, setOpenWeek] = useState<number>(1);

  const phaseColor = (pct: number) => {
    if (pct >= 100) return "bg-red-500/15 text-red-400 border-red-500/30";
    if (pct >= 80) return "bg-amber-500/15 text-amber-400 border-amber-500/30";
    if (pct >= 60) return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    return "bg-sky-500/15 text-sky-400 border-sky-500/30";
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Курс на {course.weeksCount} нед</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Сплит: <b>{course.splitName}</b> · {course.daysPerWeek} тренировок в
          неделю · всего <b>{course.totalSessions}</b> занятий
        </p>
      </div>

      <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5">
        {course.generalTips.map((t, i) => (
          <p key={i} className="text-xs text-muted-foreground">
            • {t}
          </p>
        ))}
      </div>

      <div className="space-y-2">
        {course.weeks.map((w) => {
          const isOpen = openWeek === w.week;
          return (
            <div key={w.week} className="rounded-lg border overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenWeek(isOpen ? 0 : w.week)}
                className="w-full flex items-center justify-between gap-3 px-3 sm:px-4 py-3 text-left hover:bg-muted/40 transition"
              >
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-semibold">Неделя {w.week}</span>
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full border ${phaseColor(w.intensityPct)}`}
                  >
                    {w.phase} · {w.intensityPct}%
                  </span>
                </div>
                <span className="text-muted-foreground text-sm">
                  {isOpen ? "▾" : "▸"}
                </span>
              </button>

              {isOpen && (
                <div className="px-3 sm:px-4 pb-4 space-y-4 border-t bg-background/50">
                  <p className="text-xs text-muted-foreground pt-3">
                    {w.description}
                  </p>
                  {w.days.map((d) => (
                    <div key={d.day} className="space-y-2">
                      <div className="flex items-baseline justify-between gap-2 flex-wrap">
                        <h3 className="font-medium">
                          День {d.day} · {d.weekday}
                        </h3>
                        <span className="text-xs text-muted-foreground">
                          {d.type}
                        </span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                          <thead>
                            <tr className="text-left text-xs text-muted-foreground border-b">
                              <th className="py-1.5 pr-2 font-normal">Упражнение</th>
                              <th className="py-1.5 px-2 font-normal whitespace-nowrap">Подходы</th>
                              <th className="py-1.5 pl-2 font-normal whitespace-nowrap">Вес</th>
                            </tr>
                          </thead>
                          <tbody>
                            {d.exercises.map((ex, i) => (
                              <tr key={i} className="border-b last:border-0 align-top">
                                <td className="py-2 pr-2">
                                  <a
                                    href={ex.videoUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-foreground hover:text-primary hover:underline"
                                  >
                                    {ex.name}
                                  </a>
                                  <div className="text-[11px] text-muted-foreground mt-0.5">
                                    {ex.muscle}
                                  </div>
                                </td>
                                <td className="py-2 px-2 whitespace-nowrap text-muted-foreground">
                                  {ex.sets}
                                </td>
                                <td className="py-2 pl-2 whitespace-nowrap text-muted-foreground">
                                  {ex.weight ?? "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default App;
