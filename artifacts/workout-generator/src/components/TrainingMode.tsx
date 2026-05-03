import { useEffect, useMemo, useRef, useState } from "react";
import type { WorkoutResult } from "@/lib/workout";
import {
  type SessionLog,
  type SessionExerciseLog,
  type ExerciseStatus,
  newSessionId,
  saveSession,
} from "@/lib/sessions";
import {
  hapticSuccess,
  keepScreenAwake,
  scheduleRestDoneNotification,
  cancelRestNotification,
} from "@/lib/native";

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

// Среднее число повторений: «8–10 повторений» → 9, «12 повторений» → 12,
// «по 30 сек» → null (упражнение на время, считать репсами не имеет смысла).
function parseRepsAvg(sets: string): number | null {
  if (/сек/i.test(sets)) return null;
  const range = sets.match(/(\d+)\s*[–-]\s*(\d+)\s*повтор/);
  if (range) {
    return Math.round(
      (parseInt(range[1]!, 10) + parseInt(range[2]!, 10)) / 2,
    );
  }
  const single = sets.match(/(\d+)\s*повтор/);
  if (single) return parseInt(single[1]!, 10);
  return null;
}

// Достаём первый числовой вес в кг из строки веса. Поддерживает «20 кг»,
// «штанга 40 кг», «20»; гантели «по 12 кг» считаем как 12 (на одну руку).
function parseWeightKg(weight?: string): number | null {
  if (!weight) return null;
  const m = weight.match(/(\d+(?:[.,]\d+)?)\s*кг/i) || weight.match(/(\d+(?:[.,]\d+)?)/);
  if (!m) return null;
  const n = parseFloat(m[1]!.replace(",", "."));
  if (!isFinite(n) || n <= 0) return null;
  return n;
}

// Парсим отдых из строки.
// Примеры:
//   «4 подхода по 8–10 повторений · отдых между подходами 60 сек» → 60
//   «3 подхода по 30 сек · отдых между подходами 45 сек» → 45
//   «1.5–2.5 минуты» → 120
//   «60–90 секунд» → 75
// Базовые многосуставные движения, для которых имеет смысл удлинять отдых.
const HEAVY_LIFT_KEYWORDS = [
  "жим штанги",
  "жим гантел",
  "жим лёжа",
  "жим лежа",
  "присед",
  "становая",
  "тяга штанги",
  "тяга гантел",
  "тяга в наклоне",
  "подтягив",
  "выпад",
  "швунг",
  "толчок",
  "рывок",
  "армейский жим",
];

function isHeavyBaseLift(name: string): boolean {
  const n = name.toLowerCase();
  return HEAVY_LIFT_KEYWORDS.some((k) => n.includes(k));
}

function hasWeight(weight?: string): boolean {
  if (!weight) return false;
  // Игнорируем «без веса» / «свой вес» / пустую строку
  if (/без\s+вес|свой\s+вес/i.test(weight)) return false;
  return /\d/.test(weight);
}

// Парсит верхнюю границу «тяжёлого» отдыха из текста типа
// «60–90 секунд (можно до 2–3 мин на тяжёлых базовых)».
// Возвращает секунды или null, если такой части нет.
function parseHeavyRestSeconds(text: string): number | null {
  const m = text.match(/до\s+(\d+(?:[.,]\d+)?)(?:\s*[–-]\s*(\d+(?:[.,]\d+)?))?\s*(сек|мин)/i);
  if (!m) return null;
  const a = parseFloat(m[1]!.replace(",", "."));
  const b = m[2] ? parseFloat(m[2]!.replace(",", ".")) : a;
  const avg = (a + b) / 2;
  const isMinutes = /мин/i.test(m[3]!);
  return Math.max(30, Math.min(300, Math.round(avg * (isMinutes ? 60 : 1))));
}

function parseRestSeconds(text: string): number {
  // 1) Ищем фрагмент после слова «отдых» — он самый надёжный.
  const restPart = text.match(/отдых[^\d]*(\d[^·\n]*)/i);
  const target = restPart ? restPart[1]! : text;
  // 2) В этом фрагменте берём диапазон или одиночное число (с десятичной).
  //    Запоминаем позицию совпадения, чтобы корректно прочитать единицу
  //    сразу после числа (а не из любого «мин» в скобках).
  const range = target.match(
    /(\d+(?:[.,]\d+)?)\s*[–-]\s*(\d+(?:[.,]\d+)?)/,
  );
  let avg: number;
  let matchEnd: number;
  if (range) {
    const a = parseFloat(range[1]!.replace(",", "."));
    const b = parseFloat(range[2]!.replace(",", "."));
    avg = (a + b) / 2;
    matchEnd = (range.index ?? 0) + range[0]!.length;
  } else {
    const single = target.match(/(\d+(?:[.,]\d+)?)/);
    if (!single) return 75;
    avg = parseFloat(single[1]!.replace(",", "."));
    matchEnd = (single.index ?? 0) + single[0]!.length;
  }
  // 3) Единицу читаем из «хвоста» — первых ~10 символов сразу после числа,
  //    до запятой/скобки/точки/середины предложения. Это спасает от случаев
  //    типа «60–90 секунд (можно до 2–3 мин ...)» — здесь хвост = «секунд».
  const tail = target.slice(matchEnd, matchEnd + 12).split(/[(,.·]|\sили\s/)[0] ?? "";
  const isMinutes = /мин/i.test(tail);
  const sec = Math.round(avg * (isMinutes ? 60 : 1));
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
  level,
  onClose,
}: {
  result: WorkoutResult;
  duration: number;
  level?: "beginner" | "intermediate" | "advanced";
  onClose: (saved: boolean) => void;
}) {
  // Глобальный отдых (фолбэк, если в схеме упражнения отдыха нет).
  const fallbackRestSec = useMemo(
    () => parseRestSeconds(result.restBetween),
    [result.restBetween],
  );
  // Отдых между упражнениями — адаптивный.
  // Базовый отдых из общей строки тренировки (например «60–90 секунд»).
  const baseInterRestSec = useMemo(
    () => parseRestSeconds(result.restBetween),
    [result.restBetween],
  );
  // Если у строки отдыха есть верхняя граница (например «до 2–3 мин»), берём её
  // как «тяжёлый» лимит для базовых движений; иначе по умолчанию 150 сек.
  const heavyInterRestSec = useMemo(
    () => parseHeavyRestSeconds(result.restBetween) ?? 150,
    [result.restBetween],
  );
  // Подбираем отдых перед следующим упражнением: если оно базовое (жим/присед/
  // тяга/подтяг и т.п.) с указанным рабочим весом — даём больше; иначе обычный.
  function restBeforeNext(nextIdx: number): number {
    const ex = result.exercises[nextIdx];
    if (!ex) return baseInterRestSec;
    if (isHeavyBaseLift(ex.name) && hasWeight(ex.weight)) {
      return heavyInterRestSec;
    }
    return baseInterRestSec;
  }

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
  const [timerMode, setTimerMode] = useState<
    "rest" | "work" | "interExercise" | null
  >(null);
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

  // ID запланированного нативного уведомления (Android), чтобы можно было
  // его отменить, если пользователь остановил таймер раньше.
  const restNotifyIdRef = useRef<number | null>(null);

  // Тикер таймеров — 1 секунда.
  useEffect(() => {
    if (timerMode === null) return;
    tickRef.current = window.setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          beep();
          // Виброотклик в момент конца таймера — заметнее, чем звук, если
          // телефон в кармане или в шумном зале.
          void hapticSuccess();
          // Уведомление уже сработало само в системе — просто очистим id.
          restNotifyIdRef.current = null;
          if (tickRef.current !== null) {
            window.clearInterval(tickRef.current);
            tickRef.current = null;
          }
          if (timerMode === "work") {
            // Закончили рабочий подход — отмечаем set done, переходим в отдых
            doSetDone(true);
          } else if (timerMode === "interExercise") {
            // Закончился межупражненческий отдых — авто-переход к следующему
            setTimerMode(null);
            goNext();
          } else {
            // Закончили отдых между подходами — просто гасим таймер
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

  // Удерживаем экран включённым всё время, пока открыт режим тренировки.
  // На вебе — Wake Lock API (Android Chrome), на нативе — Capacitor KeepAwake.
  useEffect(() => {
    void keepScreenAwake(true);
    return () => {
      void keepScreenAwake(false);
      // На всякий случай отменяем любое запланированное уведомление,
      // если пользователь резко закрыл режим в середине отдыха.
      void cancelRestNotification(restNotifyIdRef.current);
      restNotifyIdRef.current = null;
    };
  }, []);

  // При запуске любого таймера отдыха планируем нативное уведомление,
  // чтобы пользователь узнал об окончании отдыха, даже если свернул
  // приложение или экран погас (на iOS/Android фоновый JS таймер не работает).
  function armRestNotification(secs: number) {
    void cancelRestNotification(restNotifyIdRef.current);
    restNotifyIdRef.current = null;
    void scheduleRestDoneNotification(secs).then((id) => {
      restNotifyIdRef.current = id;
    });
  }

  function startRestTimer() {
    setTimerMode("rest");
    setCountdown(restSec);
    armRestNotification(restSec);
  }

  function startWorkTimer() {
    if (!workSec) return;
    setTimerMode("work");
    setCountdown(workSec);
  }

  function stopTimer() {
    setTimerMode(null);
    setCountdown(0);
    void cancelRestNotification(restNotifyIdRef.current);
    restNotifyIdRef.current = null;
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
      armRestNotification(restSec);
    } else {
      // Все подходы выполнены. Если есть следующее упражнение —
      // запускаем таймер межупражненческого отдыха, иначе просто гасим.
      if (currentIdx + 1 < exercises.length) {
        const inter = restBeforeNext(currentIdx + 1);
        setTimerMode("interExercise");
        setCountdown(inter);
        armRestNotification(inter);
      } else {
        setTimerMode(null);
        setCountdown(0);
      }
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
      level,
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
        reps: parseRepsAvg(ex.sets) ?? undefined,
        weightKg: parseWeightKg(ex.weight) ?? undefined,
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
                timerMode === "work"
                  ? "border-emerald-500/40 bg-emerald-500/10"
                  : timerMode === "interExercise"
                    ? "border-amber-500/40 bg-amber-500/10"
                    : "border-sky-500/40 bg-sky-500/10"
              }`}
            >
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                {timerMode === "work"
                  ? "Делайте упражнение"
                  : timerMode === "interExercise"
                    ? "Отдых перед следующим упражнением"
                    : "Отдых между подходами"}
              </div>
              <div className="text-5xl sm:text-6xl font-bold tabular-nums">
                {formatMMSS(countdown)}
              </div>
              <button
                type="button"
                onClick={
                  timerMode === "interExercise"
                    ? () => {
                        setTimerMode(null);
                        setCountdown(0);
                        goNext();
                      }
                    : stopTimer
                }
                className="mt-3 text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
              >
                {timerMode === "work"
                  ? "Остановить таймер"
                  : timerMode === "interExercise"
                    ? "К следующему упражнению"
                    : "Продолжить раньше"}
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
