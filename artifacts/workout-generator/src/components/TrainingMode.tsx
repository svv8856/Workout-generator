import { useEffect, useMemo, useRef, useState } from "react";
import type { WorkoutResult } from "@/lib/workout";
import {
  type SessionLog,
  type SessionExerciseLog,
  type ExerciseStatus,
  newSessionId,
  saveSession,
} from "@/lib/sessions";

// Парсим количество подходов из строки схемы — формат «N подходов … ».
function parseSetsCount(sets: string): number {
  const m = sets.match(/^(\d+)\s+подход/);
  return m ? parseInt(m[1]!, 10) : 3;
}

// Парсим длительность одного подхода в секундах для тайм-баз упражнений.
// Возвращает null если упражнение «по N повторений» — там тайм-аут не нужен.
function parseWorkSeconds(sets: string): number | null {
  const m = sets.match(/по\s+(\d+)\s*сек/);
  return m ? parseInt(m[1]!, 10) : null;
}

// Парсим отдых между подходами из строки restBetween.
// Примеры: «60–90 секунд», «1.5–2.5 минуты», «2–3 минуты (полное восстановление пульса)».
function parseRestSeconds(restBetween: string): number {
  // Берём ПЕРВЫЙ диапазон или число, поддерживая десятичные (1.5).
  const range = restBetween.match(
    /(\d+(?:[.,]\d+)?)\s*[–-]\s*(\d+(?:[.,]\d+)?)/,
  );
  let avg: number;
  if (range) {
    const a = parseFloat(range[1]!.replace(",", "."));
    const b = parseFloat(range[2]!.replace(",", "."));
    avg = (a + b) / 2;
  } else {
    const single = restBetween.match(/(\d+(?:[.,]\d+)?)/);
    if (!single) return 75;
    avg = parseFloat(single[1]!.replace(",", "."));
  }
  // Если в тексте написано «минут» — умножаем на 60.
  const isMinutes = /мин/i.test(restBetween);
  const sec = Math.round(avg * (isMinutes ? 60 : 1));
  // Безопасный диапазон: 10 сек … 5 минут.
  return Math.max(10, Math.min(300, sec));
}

function formatMMSS(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface ExerciseState {
  doneSets: number;
  status: ExerciseStatus;
  replacedWith?: string;
}

export function TrainingMode({
  result,
  duration,
  onClose,
}: {
  result: WorkoutResult;
  duration: number;
  onClose: (saved: boolean) => void;
}) {
  // Глобальный отдых (фолбэк, если в схеме упражнения отдыха нет).
  const fallbackRestSec = useMemo(
    () => parseRestSeconds(result.restBetween),
    [result.restBetween],
  );

  const [startTs] = useState(() => Date.now());
  const [sessionId] = useState(() => newSessionId());
  const [currentIdx, setCurrentIdx] = useState(0);
  const [states, setStates] = useState<ExerciseState[]>(() =>
    result.exercises.map((ex) => ({
      doneSets: 0,
      status: "skipped" as ExerciseStatus,
    })),
  );
  // Активный таймер: 'rest' | 'work' | null. countdown = оставшиеся секунды.
  const [timerMode, setTimerMode] = useState<"rest" | "work" | null>(null);
  const [countdown, setCountdown] = useState(0);
  const tickRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const [phase, setPhase] = useState<"training" | "finish">("training");
  const [rpe, setRpe] = useState<number>(7);

  const exercises = result.exercises;
  const current = exercises[currentIdx];
  const currentState = states[currentIdx];
  const plannedSets = current ? parseSetsCount(current.sets) : 0;
  const workSec = current ? parseWorkSeconds(current.sets) : null;
  // Отдых читаем из схемы текущего упражнения (например «отдых 60 сек»).
  const restSec = current
    ? parseRestSeconds(current.sets) || fallbackRestSec
    : fallbackRestSec;

  // Заводим audio context лениво, при первом тике.
  function beep() {
    try {
      if (typeof window === "undefined") return;
      if (!audioCtxRef.current) {
        type WindowWithWebkit = typeof window & {
          webkitAudioContext?: typeof AudioContext;
        };
        const w = window as WindowWithWebkit;
        const Ctor = window.AudioContext ?? w.webkitAudioContext;
        if (!Ctor) return;
        audioCtxRef.current = new Ctor();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 880;
      gain.gain.value = 0.15;
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    } catch {}
  }

  // Тикер таймеров — 1 секунда.
  useEffect(() => {
    if (timerMode === null) return;
    tickRef.current = window.setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          beep();
          if (tickRef.current !== null) {
            window.clearInterval(tickRef.current);
            tickRef.current = null;
          }
          if (timerMode === "work") {
            // Закончили рабочий подход — отмечаем set done, переходим в отдых
            doSetDone(true);
          } else {
            // Закончили отдых — просто гасим таймер
            setTimerMode(null);
          }
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => {
      if (tickRef.current !== null) {
        window.clearInterval(tickRef.current);
        tickRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerMode]);

  function startRestTimer() {
    setTimerMode("rest");
    setCountdown(restSec);
  }

  function startWorkTimer() {
    if (!workSec) return;
    setTimerMode("work");
    setCountdown(workSec);
  }

  function stopTimer() {
    setTimerMode(null);
    setCountdown(0);
  }

  // Закрытие подхода: вручную или по тайму.
  function doSetDone(viaTimer = false) {
    setStates((prev) => {
      const next = [...prev];
      const cur = { ...next[currentIdx]! };
      cur.doneSets = Math.min(cur.doneSets + 1, plannedSets);
      cur.status = cur.doneSets === plannedSets ? "done" : "partial";
      next[currentIdx] = cur;
      return next;
    });
    // Если ещё остались подходы — отдых, иначе сразу убираем таймер
    const willHaveMore = (currentState?.doneSets ?? 0) + 1 < plannedSets;
    if (willHaveMore) {
      setTimerMode("rest");
      setCountdown(restSec);
    } else {
      // Все подходы выполнены — гасим таймер в любом случае
      setTimerMode(null);
      setCountdown(0);
    }
    void viaTimer;
  }

  function skipExercise() {
    setStates((prev) => {
      const next = [...prev];
      const cur = { ...next[currentIdx]! };
      cur.status = "skipped";
      next[currentIdx] = cur;
      return next;
    });
    stopTimer();
    goNext();
  }

  function markPartialAndNext() {
    setStates((prev) => {
      const next = [...prev];
      const cur = { ...next[currentIdx]! };
      cur.status =
        cur.doneSets === 0
          ? "skipped"
          : cur.doneSets >= plannedSets
            ? "done"
            : "partial";
      next[currentIdx] = cur;
      return next;
    });
    stopTimer();
    goNext();
  }

  function goNext() {
    if (currentIdx + 1 < exercises.length) {
      setCurrentIdx(currentIdx + 1);
    } else {
      setPhase("finish");
    }
  }

  function goPrev() {
    if (currentIdx > 0) {
      stopTimer();
      setCurrentIdx(currentIdx - 1);
    }
  }

  function finishEarly() {
    // Помечаем оставшиеся как skipped и идём в финиш
    setStates((prev) => {
      const next = [...prev];
      for (let i = currentIdx; i < next.length; i++) {
        const s = { ...next[i]! };
        if (s.doneSets === 0) s.status = "skipped";
        next[i] = s;
      }
      return next;
    });
    stopTimer();
    setPhase("finish");
  }

  function saveAndExit() {
    const endTs = Date.now();
    const log: SessionLog = {
      id: sessionId,
      ts: startTs,
      date: ymd(startTs),
      endTs,
      durationPlanned: duration,
      durationActual: Math.max(1, Math.round((endTs - startTs) / 60000)),
      focus: result.focusLabel ?? "Тренировка",
      muscles: Array.from(new Set(exercises.map((e) => e.muscle))),
      rpe,
      totalSets: exercises.reduce((s, ex) => s + parseSetsCount(ex.sets), 0),
      doneSets: states.reduce((s, st) => s + st.doneSets, 0),
      exercises: exercises.map<SessionExerciseLog>((ex, i) => ({
        name: ex.name,
        muscle: ex.muscle,
        plannedSets: parseSetsCount(ex.sets),
        doneSets: states[i]!.doneSets,
        status: states[i]!.status,
        weight: ex.weight,
        replacedWith: states[i]!.replacedWith,
      })),
    };
    saveSession(log);
    onClose(true);
  }

  function discardAndExit() {
    onClose(false);
  }

  // Прогресс по тренировке
  const totalSets = exercises.reduce(
    (s, ex) => s + parseSetsCount(ex.sets),
    0,
  );
  const doneSets = states.reduce((s, st) => s + st.doneSets, 0);
  const progressPct = totalSets > 0 ? Math.round((doneSets / totalSets) * 100) : 0;

  if (phase === "finish") {
    return (
      <Overlay>
        <div className="rounded-2xl border bg-card p-5 sm:p-6 shadow-xl space-y-4 max-w-lg w-full">
          <h2 className="text-xl font-bold">Тренировка завершена</h2>
          <div className="space-y-2 text-sm">
            <Row label="Подходов сделано">
              {doneSets} из {totalSets}
            </Row>
            <Row label="Время по факту">
              {Math.max(1, Math.round((Date.now() - startTs) / 60000))} мин
              <span className="text-muted-foreground"> · план {duration} мин</span>
            </Row>
            <Row label="Упражнений">
              {states.filter((s) => s.status === "done").length} полностью ·{" "}
              {states.filter((s) => s.status === "partial").length} частично ·{" "}
              {states.filter((s) => s.status === "skipped").length} пропущено
            </Row>
          </div>

          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-medium">Как было тяжело? (RPE)</span>
              <span className="text-lg font-bold">{rpe}</span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              value={rpe}
              onChange={(e) => setRpe(parseInt(e.target.value, 10))}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>1 — очень легко</span>
              <span>5 — средне</span>
              <span>10 — на пределе</span>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={discardAndExit}
              className="flex-1 rounded-lg border bg-background py-2.5 text-sm hover:bg-muted/60"
            >
              Не сохранять
            </button>
            <button
              type="button"
              onClick={saveAndExit}
              className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              Сохранить
            </button>
          </div>
        </div>
      </Overlay>
    );
  }

  if (!current) return null;

  const isTimeBased = workSec !== null;

  return (
    <Overlay>
      <div className="rounded-2xl border bg-card shadow-xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
        {/* Шапка */}
        <div className="sticky top-0 bg-card border-b px-4 sm:px-5 py-3 flex items-center gap-3 z-10">
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>
                Упражнение {currentIdx + 1} из {exercises.length}
              </span>
              <span>
                {doneSets}/{totalSets} подх. · {progressPct}%
              </span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={discardAndExit}
            className="rounded-md border bg-background px-2.5 py-1.5 text-xs hover:bg-muted/60"
            aria-label="Закрыть"
          >
            ✕
          </button>
        </div>

        {/* Тело: таймер либо упражнение */}
        <div className="p-4 sm:p-5 space-y-4">
          {timerMode !== null && (
            <div
              className={`rounded-xl p-5 text-center border-2 ${
                timerMode === "rest"
                  ? "border-sky-500/40 bg-sky-500/10"
                  : "border-emerald-500/40 bg-emerald-500/10"
              }`}
            >
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                {timerMode === "rest" ? "Отдых" : "Делайте упражнение"}
              </div>
              <div className="text-5xl sm:text-6xl font-bold tabular-nums">
                {formatMMSS(countdown)}
              </div>
              <button
                type="button"
                onClick={stopTimer}
                className="mt-3 text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
              >
                {timerMode === "rest" ? "Продолжить раньше" : "Остановить таймер"}
              </button>
            </div>
          )}

          <div>
            <div className="flex items-baseline justify-between gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-bold">{current.name}</h2>
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                {current.muscle}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{current.sets}</p>
            {current.weight && (
              <p className="mt-0.5 text-sm font-medium text-primary">
                Вес: {current.weight}
              </p>
            )}
            <p className="mt-2 text-sm">
              <span className="font-medium">Как делать:</span>{" "}
              <span className="text-muted-foreground">{current.cue}</span>
            </p>
            <div className="mt-1 flex flex-wrap gap-x-3 text-xs">
              <a
                href={current.videoYoutube}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary hover:underline"
              >
                ▶ YouTube
              </a>
              <a
                href={current.videoRutube}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary hover:underline"
              >
                ▶ RuTube
              </a>
            </div>
          </div>

          {/* Счётчик подходов */}
          <div className="rounded-lg border bg-muted/20 p-3">
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-sm font-medium">Подходы</span>
              <span className="text-sm tabular-nums">
                <span className="text-lg font-bold">
                  {currentState?.doneSets ?? 0}
                </span>
                <span className="text-muted-foreground"> / {plannedSets}</span>
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: plannedSets }).map((_, i) => {
                const done = i < (currentState?.doneSets ?? 0);
                return (
                  <span
                    key={i}
                    className={`flex h-7 w-7 items-center justify-center rounded-md text-xs font-semibold border ${
                      done
                        ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                        : "bg-background border-border text-muted-foreground"
                    }`}
                  >
                    {done ? "✓" : i + 1}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Кнопки действий */}
          <div className="grid grid-cols-2 gap-2">
            {currentState && currentState.doneSets < plannedSets ? (
              <button
                type="button"
                onClick={isTimeBased ? startWorkTimer : () => doSetDone(false)}
                disabled={timerMode === "work"}
                className="col-span-2 rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {isTimeBased
                  ? `Начать подход (${workSec} сек)`
                  : "Подход выполнен"}
              </button>
            ) : (
              <button
                type="button"
                onClick={markPartialAndNext}
                className="col-span-2 rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                {currentIdx + 1 === exercises.length
                  ? "Завершить тренировку"
                  : "К следующему упражнению"}
              </button>
            )}

            <button
              type="button"
              onClick={skipExercise}
              className="rounded-lg border bg-background py-2.5 text-sm hover:bg-muted/60"
            >
              Пропустить
            </button>
            <button
              type="button"
              onClick={goPrev}
              disabled={currentIdx === 0}
              className="rounded-lg border bg-background py-2.5 text-sm hover:bg-muted/60 disabled:opacity-50"
            >
              ← Предыдущее
            </button>
          </div>

          <button
            type="button"
            onClick={finishEarly}
            className="w-full text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
          >
            Закончить тренировку раньше
          </button>
        </div>
      </div>
    </Overlay>
  );
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div role="dialog" aria-modal="true" aria-label="Режим тренировки" className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      {children}
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground text-right">{children}</span>
    </div>
  );
}

function ymd(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
