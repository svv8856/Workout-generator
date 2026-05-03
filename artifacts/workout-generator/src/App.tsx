import { useEffect, useRef, useState } from "react";
import {
  generateWorkout,
  generateCourse,
  clearWorkoutHistory,
  getHistorySummary,
  getFullHistory,
  trainingDaysInLast,
  subscribeHistory,
  subscribeProfiles,
  listProfiles,
  getActiveProfile,
  setActiveProfile,
  createProfile,
  deleteProfile,
  renameProfile,
  type Profile,
} from "./lib/workout";
import {
  type FormData,
  type Course,
  type CourseDays,
  type CourseWeeks,
  type FullHistoryEntry,
  type WorkoutResult,
  exerciseCountRange,
} from "@/lib/workout";
import {
  buildBackup,
  importBackup,
  type ImportResult,
} from "@/lib/sessions";
import { TrainingMode } from "@/components/TrainingMode";
import { Analytics } from "@/components/Analytics";
import { CourseProgress } from "@/components/CourseProgress";
import {
  isNative,
  loadReminderTime,
  scheduleDailyReminder,
  cancelDailyReminder,
} from "@/lib/native";
import { useLang, setLang, t } from "@/lib/i18n";

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

// Текстовый диапазон количества упражнений. Берём из единого источника
// правды exerciseCountRange() в lib/workout.ts — он же используется как
// потолок фит-итераций, поэтому подсказка всегда совпадает с реальностью.
function exerciseRangeFor(duration: number, gender?: "male" | "female"): string {
  const { min, max } = exerciseCountRange(duration, gender);
  return `${min}–${max}`;
}

function App() {
  const [theme, setTheme] = useTheme();
  const [activeProfile, setActiveProfileState] = useState<Profile | null>(() =>
    getActiveProfile(),
  );
  useEffect(
    () =>
      subscribeProfiles(() => {
        setActiveProfileState(getActiveProfile());
      }),
    [],
  );

  if (!activeProfile) {
    return <WelcomeScreen theme={theme} onToggleTheme={() => setTheme(theme === "dark" ? "light" : "dark")} />;
  }

  return <MainApp profile={activeProfile} theme={theme} setTheme={setTheme} />;
}

function MainApp({
  profile,
  theme,
  setTheme,
}: {
  profile: Profile;
  theme: Theme;
  setTheme: (t: Theme) => void;
}) {
  const [form, setForm] = useState<FormData>(initialForm);
  const [mode, setMode] = useState<Mode>("single");
  const [weeksCount, setWeeksCount] = useState<CourseWeeks>(4);
  const [daysPerWeek, setDaysPerWeek] = useState<CourseDays>(3);
  const [result, setResult] = useState<ReturnType<typeof generateWorkout> | null>(() => {
    try {
      const s = window.localStorage.getItem(`wg_result_v1_${getActiveProfile()?.id ?? ""}`);
      return s ? (JSON.parse(s) as ReturnType<typeof generateWorkout>) : null;
    } catch {
      return null;
    }
  });
  const [course, setCourse] = useState<Course | null>(() => {
    try {
      const s = window.localStorage.getItem(`wg_course_v1_${getActiveProfile()?.id ?? ""}`);
      return s ? (JSON.parse(s) as Course) : null;
    } catch {
      return null;
    }
  });
  const [historyTick, setHistoryTick] = useState(0);
  const [tab, setTab] = useState<"workout" | "analytics">("workout");
  // Активный режим тренировки: показываем оверлей с таймерами и галочками.
  const [training, setTraining] = useState<{
    result: WorkoutResult;
    duration: number;
    level: "beginner" | "intermediate" | "advanced";
  } | null>(null);
  // historyTick triggers re-read of history after mutations
  void historyTick;
  useEffect(() => subscribeHistory(() => setHistoryTick((t) => t + 1)), []);
  // При смене профиля восстанавливаем результат и курс этого профиля
  useEffect(() => {
    try {
      const sr = window.localStorage.getItem(`wg_result_v1_${profile.id}`);
      setResult(sr ? (JSON.parse(sr) as ReturnType<typeof generateWorkout>) : null);
    } catch {
      setResult(null);
    }
    try {
      const sc = window.localStorage.getItem(`wg_course_v1_${profile.id}`);
      setCourse(sc ? (JSON.parse(sc) as Course) : null);
    } catch {
      setCourse(null);
    }
    setTraining(null);
    setTab("workout");
  }, [profile.id]);

  // Сохраняем результат при каждом изменении
  useEffect(() => {
    if (result) {
      window.localStorage.setItem(`wg_result_v1_${profile.id}`, JSON.stringify(result));
    } else {
      window.localStorage.removeItem(`wg_result_v1_${profile.id}`);
    }
  }, [result, profile.id]);

  // Сохраняем курс при каждом изменении
  useEffect(() => {
    if (course) {
      window.localStorage.setItem(`wg_course_v1_${profile.id}`, JSON.stringify(course));
    } else {
      window.localStorage.removeItem(`wg_course_v1_${profile.id}`);
    }
  }, [course, profile.id]);
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
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="/logo.jpg"
              alt="Логотип"
              className="w-12 h-12 rounded-xl object-cover shrink-0 shadow"
            />
            <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Генератор тренировок
            </h1>
            <p className="mt-2 text-muted-foreground">
              Подберём {exerciseRangeFor(form.duration, form.gender)} упражнений под вашу
              цель, уровень и место занятий.
            </p>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <ProfileMenu profile={profile} />
            <button
              type="button"
              aria-label="Переключить тему"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-lg border bg-card px-3 py-2 text-sm hover:bg-muted/60 transition flex items-center gap-2"
            >
              <span className="text-base leading-none">
                {theme === "dark" ? "☀" : "☾"}
              </span>
              <span className="hidden sm:inline">
                {theme === "dark" ? "Светлая" : "Тёмная"}
              </span>
            </button>
          </div>
        </header>

        {/* Вкладки: тренировка и аналитика */}
        <div className="mb-6 inline-flex rounded-lg border bg-card p-1 text-sm">
          <button
            type="button"
            onClick={() => setTab("workout")}
            className={`px-3 sm:px-4 py-1.5 rounded-md font-medium transition ${
              tab === "workout"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Тренировка
          </button>
          <button
            type="button"
            onClick={() => setTab("analytics")}
            className={`px-3 sm:px-4 py-1.5 rounded-md font-medium transition ${
              tab === "analytics"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Аналитика
          </button>
        </div>

        {tab === "analytics" ? (
          <Analytics />
        ) : (
        <>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
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
                  inputMode="numeric"
                  min={16}
                  max={100}
                  value={form.age || ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    update("age", v === "" ? 0 : Number(v));
                  }}
                  className={inputClass}
                />
                <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
                  Для младше 16 лет рекомендуем заниматься под присмотром тренера.
                </p>
              </Field>
              <Field label="Вес, кг">
                <input
                  type="number"
                  inputMode="numeric"
                  min={30}
                  max={250}
                  value={form.weight || ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    update("weight", v === "" ? 0 : Number(v));
                  }}
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
            <div className="rounded-xl border bg-card p-4 sm:p-6 shadow-sm space-y-4">
              <ResultView result={result} duration={form.duration} />
              <button
                type="button"
                onClick={() =>
                  setTraining({ result, duration: form.duration, level: form.level })
                }
                className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-500 py-3 text-sm font-semibold text-white transition"
              >
                ▶ Тренируюсь сейчас
              </button>
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
        </>
        )}

        <footer className="mt-10 text-center text-xs text-muted-foreground">
          Это базовые рекомендации. При проблемах со здоровьем
          проконсультируйтесь с врачом.
        </footer>
      </div>

      {training && (
        <TrainingMode
          result={training.result}
          duration={training.duration}
          level={training.level}
          onClose={(saved) => {
            setTraining(null);
            if (saved) setTab("analytics");
          }}
        />
      )}
    </div>
  );
}

// =====================================================================
//                        ЭКРАН ПРИВЕТСТВИЯ
// =====================================================================

function WelcomeScreen({
  theme,
  onToggleTheme,
}: {
  theme: Theme;
  onToggleTheme: () => void;
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const profiles = listProfiles();

  const onCreate = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      createProfile(name);
      // активный профиль сменится → App перерисуется
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось создать профиль");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-md px-4 py-10 sm:py-16">
        <div className="flex justify-end mb-6">
          <button
            type="button"
            aria-label="Переключить тему"
            onClick={onToggleTheme}
            className="rounded-lg border bg-card px-3 py-2 text-sm hover:bg-muted/60 transition"
          >
            <span className="text-base leading-none">
              {theme === "dark" ? "☀" : "☾"}
            </span>
          </button>
        </div>

        <div className="rounded-2xl border bg-card p-6 sm:p-8 shadow-sm space-y-5">
          <div className="flex justify-center">
            <img
              src="/logo.jpg"
              alt="Логотип"
              className="w-24 h-24 rounded-2xl object-cover shadow-md"
            />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Добро пожаловать
            </h1>
            <p className="text-sm text-muted-foreground">
              Как к вам обращаться? Имя сохранится на устройстве — все
              тренировки будут привязаны к нему. Можно создать несколько
              профилей (например, для семьи).
            </p>
          </div>

          <form onSubmit={onCreate} className="space-y-3">
            <div>
              <label htmlFor="welcome-name" className="mb-1.5 block text-sm font-medium">
                Ваше имя
              </label>
              <input
                id="welcome-name"
                autoFocus
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                }}
                placeholder="Например, Анна"
                maxLength={40}
                className={inputClass}
              />
              {error && (
                <p className="mt-1.5 text-xs text-destructive">{error}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={!name.trim()}
              className="w-full rounded-lg bg-primary py-3 font-semibold text-primary-foreground transition hover:opacity-90 active:scale-[.99] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Продолжить
            </button>
          </form>

          {profiles.length > 0 && (
            <div className="pt-2 border-t space-y-2">
              <p className="text-xs text-muted-foreground">
                Или войдите как существующий пользователь:
              </p>
              <ul className="space-y-1.5">
                {profiles.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => setActiveProfile(p.id)}
                      className="w-full text-left rounded-lg border bg-background px-3 py-2 text-sm hover:bg-muted/60 transition flex items-center justify-between"
                    >
                      <span className="font-medium">{p.name}</span>
                      <span className="text-xs text-muted-foreground">
                        войти →
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Все данные хранятся только на этом устройстве. Ничего не передаётся в
          интернет.
        </p>
      </div>
    </div>
  );
}

// =====================================================================
//                          МЕНЮ ПРОФИЛЯ
// =====================================================================

function LanguageSwitcher() {
  const lang = useLang();
  return (
    <div className="grid grid-cols-2 gap-1 px-1">
      <button
        type="button"
        onClick={() => setLang("ru")}
        className={`rounded-md px-2 py-1.5 text-sm border transition ${
          lang === "ru"
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-background hover:bg-muted/60"
        }`}
      >
        {t("langRu")}
      </button>
      <button
        type="button"
        onClick={() => setLang("en")}
        className={`rounded-md px-2 py-1.5 text-sm border transition ${
          lang === "en"
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-background hover:bg-muted/60"
        }`}
      >
        {t("langEn")}
      </button>
    </div>
  );
}

function ProfileMenu({ profile }: { profile: Profile }) {
  // Подписываемся на смену языка, чтобы переключатель и подписи в меню
  // обновлялись сразу.
  useLang();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<
    "menu" | "add" | "rename" | "confirm-delete" | "import-result" | "notifications"
  >("menu");
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [profilesTick, setProfilesTick] = useState(0);
  void profilesTick;
  useEffect(() => subscribeProfiles(() => setProfilesTick((t) => t + 1)), []);
  const ref = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Закрытие при клике вне
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        closeMenu();
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const closeMenu = () => {
    setOpen(false);
    setView("menu");
    setDraft("");
    setError(null);
    setImportResult(null);
  };

  const onExport = async () => {
    try {
      const backup = buildBackup(profile.name);
      const json = JSON.stringify(backup, null, 2);
      const safeName = profile.name.replace(/[^\p{L}\p{N}_-]+/gu, "_") || "профиль";
      const date = new Date().toISOString().slice(0, 10);
      const fileName = `workout-backup-${safeName}-${date}.json`;

      const { Capacitor } = await import("@capacitor/core");
      if (Capacitor.isNativePlatform()) {
        const { Filesystem, Directory, Encoding } = await import(
          "@capacitor/filesystem"
        );
        const { Share } = await import("@capacitor/share");
        const writeRes = await Filesystem.writeFile({
          path: fileName,
          data: json,
          directory: Directory.Cache,
          encoding: Encoding.UTF8,
        });
        await Share.share({
          title: "Резервная копия тренировок",
          text: fileName,
          url: writeRes.uri,
          dialogTitle: "Сохранить резервную копию",
        });
        return;
      }

      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось сохранить файл");
      setView("import-result");
    }
  };

  const onPickImport = () => {
    fileInputRef.current?.click();
  };

  const onImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // позволяем повторно выбрать тот же файл
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text) as unknown;
      const res = importBackup(data, "merge");
      setImportResult(res);
      setError(null);
      setView("import-result");
    } catch (err) {
      setImportResult(null);
      setError(err instanceof Error ? err.message : "Не удалось прочитать файл");
      setView("import-result");
    }
  };

  const profiles = listProfiles();
  const others = profiles.filter((p) => p.id !== profile.id);

  const onSwitch = (id: string) => {
    setActiveProfile(id);
    closeMenu();
  };

  const onAdd = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      createProfile(draft);
      closeMenu();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    }
  };

  const onRename = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      renameProfile(profile.id, draft);
      closeMenu();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    }
  };

  const onDelete = () => {
    deleteProfile(profile.id);
    closeMenu();
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => (open ? closeMenu() : setOpen(true))}
        className="rounded-lg border bg-card px-3 py-2 text-sm hover:bg-muted/60 transition flex items-center gap-2"
        aria-expanded={open}
      >
        <span
          className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground"
          aria-hidden="true"
        >
          {profile.name.slice(0, 1).toUpperCase()}
        </span>
        <span className="hidden sm:inline max-w-[120px] truncate font-medium">
          {profile.name}
        </span>
        <span className="text-xs text-muted-foreground">▾</span>
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-72 rounded-xl border bg-card p-3 shadow-lg text-sm">
          {view === "menu" && (
            <>
              <div className="px-2 pb-2 mb-2 border-b">
                <p className="text-xs text-muted-foreground">Текущий пользователь</p>
                <p className="font-semibold truncate">{profile.name}</p>
              </div>

              {others.length > 0 && (
                <div className="mb-2">
                  <p className="px-2 pb-1 text-xs text-muted-foreground">
                    Сменить пользователя
                  </p>
                  <ul className="space-y-0.5">
                    {others.map((p) => (
                      <li key={p.id}>
                        <button
                          type="button"
                          onClick={() => onSwitch(p.id)}
                          className="w-full text-left rounded-md px-2 py-1.5 hover:bg-muted/60 transition flex items-center gap-2"
                        >
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-semibold">
                            {p.name.slice(0, 1).toUpperCase()}
                          </span>
                          <span className="truncate">{p.name}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-1 border-t space-y-1">
                <p className="px-2 pt-1 pb-0.5 text-xs text-muted-foreground">
                  {t("languageSection")}
                </p>
                <LanguageSwitcher />
              </div>

              <div className="pt-1 border-t space-y-0.5">
                <button
                  type="button"
                  onClick={() => setView("notifications")}
                  className="w-full text-left rounded-md px-2 py-1.5 hover:bg-muted/60 transition"
                >
                  {t("remindersMenu")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setView("add");
                    setDraft("");
                  }}
                  className="w-full text-left rounded-md px-2 py-1.5 hover:bg-muted/60 transition"
                >
                  + Добавить пользователя
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setView("rename");
                    setDraft(profile.name);
                  }}
                  className="w-full text-left rounded-md px-2 py-1.5 hover:bg-muted/60 transition"
                >
                  Переименовать «{profile.name}»
                </button>
                <button
                  type="button"
                  onClick={() => setView("confirm-delete")}
                  className="w-full text-left rounded-md px-2 py-1.5 hover:bg-destructive/10 text-destructive transition"
                >
                  Удалить «{profile.name}»
                </button>
              </div>

              <div className="pt-1 mt-1 border-t space-y-0.5">
                <p className="px-2 pt-1 pb-0.5 text-xs text-muted-foreground">
                  Резервная копия
                </p>
                <button
                  type="button"
                  onClick={onExport}
                  className="w-full text-left rounded-md px-2 py-1.5 hover:bg-muted/60 transition"
                  title="Скачать всю историю в JSON-файл"
                >
                  Экспортировать историю
                </button>
                <button
                  type="button"
                  onClick={onPickImport}
                  className="w-full text-left rounded-md px-2 py-1.5 hover:bg-muted/60 transition"
                  title="Загрузить историю из JSON-файла"
                >
                  Импортировать из файла…
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={onImportFile}
                />
              </div>
            </>
          )}

          {view === "import-result" && (
            <div className="space-y-3">
              {error ? (
                <>
                  <p className="text-sm font-semibold text-destructive">
                    Не получилось импортировать
                  </p>
                  <p className="text-xs text-muted-foreground">{error}</p>
                </>
              ) : importResult ? (
                <>
                  <p className="text-sm font-semibold">Импорт завершён</p>
                  <ul className="text-xs text-muted-foreground space-y-0.5">
                    <li>Добавлено новых: <b>{importResult.added}</b></li>
                    <li>Обновлено существующих: <b>{importResult.updated}</b></li>
                    {importResult.skipped > 0 && (
                      <li>
                        Пропущено повреждённых: <b>{importResult.skipped}</b>
                      </li>
                    )}
                    <li>Всего тренировок в профиле: <b>{importResult.total}</b></li>
                  </ul>
                </>
              ) : null}
              <button
                type="button"
                onClick={() => setView("menu")}
                className="w-full rounded-md border bg-background py-2 text-sm hover:bg-muted/60"
              >
                Готово
              </button>
            </div>
          )}

          {view === "add" && (
            <form onSubmit={onAdd} className="space-y-2">
              <p className="px-1 text-xs text-muted-foreground">
                Имя нового пользователя
              </p>
              <input
                autoFocus
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value);
                  setError(null);
                }}
                placeholder="Например, Иван"
                maxLength={40}
                className={inputClass}
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setView("menu")}
                  className="flex-1 rounded-md border bg-background py-2 text-sm hover:bg-muted/60"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={!draft.trim()}
                  className="flex-1 rounded-md bg-primary py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
                >
                  Создать
                </button>
              </div>
            </form>
          )}

          {view === "rename" && (
            <form onSubmit={onRename} className="space-y-2">
              <p className="px-1 text-xs text-muted-foreground">Новое имя</p>
              <input
                autoFocus
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value);
                  setError(null);
                }}
                maxLength={40}
                className={inputClass}
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setView("menu")}
                  className="flex-1 rounded-md border bg-background py-2 text-sm hover:bg-muted/60"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={!draft.trim() || draft.trim() === profile.name}
                  className="flex-1 rounded-md bg-primary py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
                >
                  Сохранить
                </button>
              </div>
            </form>
          )}

          {view === "confirm-delete" && (
            <div className="space-y-3">
              <p className="text-sm">
                Удалить профиль <b>«{profile.name}»</b> вместе со всей его
                историей тренировок? Это действие нельзя отменить.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setView("menu")}
                  className="flex-1 rounded-md border bg-background py-2 text-sm hover:bg-muted/60"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={onDelete}
                  className="flex-1 rounded-md bg-destructive py-2 text-sm font-semibold text-destructive-foreground hover:opacity-90"
                >
                  Удалить
                </button>
              </div>
            </div>
          )}

          {view === "notifications" && (
            <NotificationsView onBack={() => setView("menu")} />
          )}
        </div>
      )}
    </div>
  );
}

function NotificationsView({ onBack }: { onBack: () => void }) {
  const saved = loadReminderTime();
  const [enabled, setEnabled] = useState(saved !== null);
  const [hour, setHour] = useState(saved?.hour ?? 10);
  const [min, setMin] = useState(saved?.min ?? 0);
  const [saving, setSaving] = useState(false);
  const [saved2, setSaved2] = useState(false);
  const native = isNative();

  const onSave = async () => {
    setSaving(true);
    if (enabled) {
      await scheduleDailyReminder(hour, min);
    } else {
      await cancelDailyReminder();
    }
    setSaving(false);
    setSaved2(true);
    setTimeout(() => setSaved2(false), 2000);
  };

  return (
    <div className="space-y-4">
      <p className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Напоминания
      </p>
      {!native && (
        <p className="text-xs text-muted-foreground rounded-md bg-muted/50 px-3 py-2">
          Напоминания работают только в мобильном приложении.
        </p>
      )}
      <label className="flex items-center justify-between gap-3 cursor-pointer">
        <span className="text-sm">Ежедневное напоминание</span>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          disabled={!native}
          onClick={() => setEnabled((v) => !v)}
          className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none disabled:opacity-40 ${enabled ? "bg-primary" : "bg-muted"}`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md transition-transform ${enabled ? "translate-x-5" : "translate-x-0"}`}
          />
        </button>
      </label>
      {enabled && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Время:</span>
          <input
            type="number"
            min={0}
            max={23}
            value={hour}
            onChange={(e) => setHour(Math.max(0, Math.min(23, Number(e.target.value))))}
            disabled={!native}
            className="w-14 rounded-md border bg-background px-2 py-1 text-center text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-40"
          />
          <span className="font-semibold">:</span>
          <input
            type="number"
            min={0}
            max={59}
            value={min}
            onChange={(e) => setMin(Math.max(0, Math.min(59, Number(e.target.value))))}
            disabled={!native}
            className="w-14 rounded-md border bg-background px-2 py-1 text-center text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-40"
          />
        </div>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 rounded-md border bg-background py-2 text-sm hover:bg-muted/60"
        >
          Назад
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={!native || saving}
          className="flex-1 rounded-md bg-primary py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "..." : saved2 ? "Сохранено" : "Сохранить"}
        </button>
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
        "min-w-0 w-full min-h-[40px] rounded-lg border px-2 py-1.5 text-[10px] sm:text-xs md:text-sm font-medium leading-tight text-center break-words hyphens-auto flex items-center justify-center transition " +
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
          Цель {duration} мин · реально ~
          <span className="font-semibold text-foreground">
            {result.estimatedMinutes}
          </span>{" "}
          мин · сожжёте ≈{" "}
          <span className="font-semibold text-foreground">
            {result.calories}
          </span>{" "}
          ккал
        </p>
        {result.estimatedMinutes > duration * 1.15 && (
          <p className="text-xs text-amber-400 mt-1">
            Тренировка займёт больше выбранного окна. Сократите количество
            подходов или увеличьте длительность в форме.
          </p>
        )}
        {result.estimatedMinutes < duration * 0.7 && (
          <p className="text-xs text-sky-400 mt-1">
            Можно добавить ещё одно упражнение или увеличить количество
            подходов — окно позволяет.
          </p>
        )}
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
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                <span className="text-muted-foreground">Видео техники:</span>
                <a
                  href={ex.videoYoutube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                >
                  ▶ YouTube
                </a>
                <a
                  href={ex.videoRutube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                >
                  ▶ RuTube
                </a>
              </div>
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
    if (/push|жим/i.test(focus)) return "bg-rose-500/20 border-rose-500/40 text-rose-300";
    if (/pull|тяга/i.test(focus)) return "bg-sky-500/20 border-sky-500/40 text-sky-300";
    if (/ноги|низ/i.test(focus)) return "bg-emerald-500/20 border-emerald-500/40 text-emerald-300";
    if (/верх/i.test(focus)) return "bg-amber-500/20 border-amber-500/40 text-amber-300";
    if (/всё тело|тело/i.test(focus)) return "bg-slate-500/20 border-slate-500/40 text-slate-300";
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
        <Legend color="bg-emerald-500/40" label="Ноги" />
        <Legend color="bg-amber-500/40" label="Верх" />
        <Legend color="bg-slate-500/40" label="Всё тело (мало инвентаря)" />
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

      <CourseProgress courseId={course.splitName + "_" + course.weeksCount} />

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
                      <ol className="space-y-2">
                        {d.exercises.map((ex, i) => (
                          <li
                            key={i}
                            className="rounded-md border bg-card/40 p-2.5 sm:p-3"
                          >
                            <div className="flex items-baseline justify-between gap-2 flex-wrap">
                              <div className="font-medium text-foreground break-words min-w-0 flex-1">
                                <span className="text-muted-foreground mr-1">
                                  {i + 1}.
                                </span>
                                {ex.name}
                              </div>
                              <span className="text-[11px] text-muted-foreground shrink-0">
                                {ex.muscle}
                              </span>
                            </div>

                            <div className="mt-1.5 grid gap-1 text-[12px] sm:grid-cols-2">
                              <div className="text-muted-foreground">
                                <span className="font-medium text-foreground/80">
                                  Подходы:
                                </span>{" "}
                                {ex.sets}
                              </div>
                              <div className="text-muted-foreground">
                                <span className="font-medium text-foreground/80">
                                  Вес:
                                </span>{" "}
                                {ex.weight ?? "—"}
                              </div>
                            </div>

                            {ex.cue && (
                              <div className="mt-1.5 text-[11px] text-muted-foreground leading-snug">
                                <span className="font-medium text-foreground/80">
                                  Как делать:
                                </span>{" "}
                                {ex.cue}
                              </div>
                            )}

                            <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px]">
                              <a
                                href={ex.videoYoutube}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium text-primary hover:underline"
                              >
                                ▶ YouTube
                              </a>
                              <a
                                href={ex.videoRutube}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium text-primary hover:underline"
                              >
                                ▶ RuTube
                              </a>
                            </div>
                          </li>
                        ))}
                      </ol>
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
