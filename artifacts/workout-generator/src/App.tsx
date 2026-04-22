import { useState } from "react";
import { generateWorkout, type FormData } from "@/lib/workout";

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
  const [result, setResult] = useState<ReturnType<typeof generateWorkout> | null>(
    null,
  );

  const update = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setResult(generateWorkout(form));
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:py-10">
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Генератор тренировок
          </h1>
          <p className="mt-2 text-muted-foreground">
            Подберём 5–6 упражнений под вашу цель, уровень и место занятий.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-[1fr_1.2fr]">
          <form
            onSubmit={onSubmit}
            className="rounded-xl border bg-card p-4 sm:p-6 shadow-sm space-y-5"
          >
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

            <button
              type="submit"
              className="w-full rounded-lg bg-primary py-3 font-semibold text-primary-foreground transition hover:opacity-90 active:scale-[.99]"
            >
              Сгенерировать тренировку
            </button>
          </form>

          {result ? (
            <div className="rounded-xl border bg-card p-4 sm:p-6 shadow-sm">
              <ResultView result={result} duration={form.duration} />
            </div>
          ) : (
            <div className="hidden md:flex rounded-xl border bg-card p-6 shadow-sm h-full min-h-[300px] items-center justify-center text-center text-muted-foreground">
              <p>
                Заполните форму слева и нажмите
                <br />
                <span className="font-medium text-foreground">
                  «Сгенерировать тренировку»
                </span>
              </p>
            </div>
          )}
        </div>

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
        "min-w-0 w-full rounded-lg border px-2 py-2 text-xs sm:text-sm font-medium leading-tight whitespace-normal break-words text-center transition " +
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
        <p className="mb-2 text-sm font-semibold text-accent-foreground">
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

export default App;
