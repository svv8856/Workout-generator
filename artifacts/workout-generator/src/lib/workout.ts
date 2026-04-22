export type Gender = "male" | "female";
export type Level = "beginner" | "intermediate" | "advanced";
export type Goal = "strength" | "endurance" | "fatburn";
export type Place = "home" | "gym" | "outdoor";
export type Muscle =
  | "legs"
  | "chest"
  | "back"
  | "shoulders"
  | "arms"
  | "core"
  | "cardio"
  | "glutes"
  | "fullbody";
export type Equipment =
  | "none"
  | "dumbbells"
  | "bands"
  | "barbell"
  | "machines"
  | "kettlebell"
  | "bar"; // турник/брусья

export interface FormData {
  age: number;
  weight: number;
  gender: Gender;
  level: Level;
  goal: Goal;
  place: Place;
  duration: number;
  homeDumbbells?: boolean;
  homeBands?: boolean;
}

export type LoadType =
  | "small_isolation" // бицепс, махи, разводка — лёгкая изоляция
  | "medium_unilateral" // выпады, тяги одной рукой
  | "medium_press" // жимы гантелей, армейский жим
  | "compound_dumbbell" // гоблет, румынка с гантелями
  | "compound_barbell" // присед, жим штанги
  | "deadlift" // становая
  | "kettlebell"; // махи гирей

export interface Exercise {
  name: string;
  muscle: Muscle;
  equipment: Equipment;
  jumping?: boolean;
  cardio?: boolean;
  highImpact?: boolean;
  goals: Goal[];
  minLevel?: Level;
  load?: LoadType;
}

export interface ExerciseOut {
  name: string;
  sets: string;
  muscle: string;
  weight?: string;
}

const setsByLevel: Record<Level, string> = {
  beginner: "3 подхода по 8–10 повторений · отдых между подходами 60 сек",
  intermediate: "4 подхода по 10–12 повторений · отдых между подходами 45 сек",
  advanced: "5 подходов по 12–15 повторений · отдых между подходами 30 сек",
};

const cardioByLevel: Record<Level, string> = {
  beginner: "3 подхода по 30 сек · отдых между подходами 60 сек",
  intermediate: "4 подхода по 45 сек · отдых между подходами 45 сек",
  advanced: "5 подходов по 60 сек · отдых между подходами 30 сек",
};

const isometricByLevel: Record<Level, string> = {
  beginner: "3 подхода по 30 сек удержания · отдых 60 сек",
  intermediate: "4 подхода по 45 сек удержания · отдых 45 сек",
  advanced: "5 подходов по 60 сек удержания · отдых 30 сек",
};

const muscleLabel: Record<Muscle, string> = {
  legs: "Ноги",
  chest: "Грудь",
  back: "Спина",
  shoulders: "Плечи",
  arms: "Руки",
  core: "Кор / пресс",
  cardio: "Кардио",
  glutes: "Ягодицы",
  fullbody: "Всё тело",
};

const levelOrder: Record<Level, number> = {
  beginner: 0,
  intermediate: 1,
  advanced: 2,
};

const ALL: Goal[] = ["strength", "endurance", "fatburn"];

// База упражнений — широкий пул для всех мест и инвентаря
const EXERCISES: Exercise[] = [
  // === Без инвентаря (дом / улица / зал — везде) ===
  { name: "Приседания с собственным весом", muscle: "legs", equipment: "none", goals: ALL },
  { name: "Глубокие приседания «сумо»", muscle: "legs", equipment: "none", goals: ALL },
  { name: "Болгарские сплит-приседания", muscle: "legs", equipment: "none", goals: ["strength", "fatburn"], minLevel: "intermediate" },
  { name: "Выпады на месте", muscle: "legs", equipment: "none", goals: ALL },
  { name: "Выпады в ходьбе", muscle: "legs", equipment: "none", goals: ALL },
  { name: "Боковые выпады", muscle: "legs", equipment: "none", goals: ALL },
  { name: "Подъёмы на носки", muscle: "legs", equipment: "none", goals: ALL },
  { name: "Пистолетик (присед на одной ноге)", muscle: "legs", equipment: "none", goals: ["strength"], minLevel: "advanced" },

  { name: "Ягодичный мост", muscle: "glutes", equipment: "none", goals: ALL },
  { name: "Ягодичный мост на одной ноге", muscle: "glutes", equipment: "none", goals: ["strength", "fatburn"], minLevel: "intermediate" },
  { name: "«Пожарный гидрант»", muscle: "glutes", equipment: "none", goals: ALL },
  { name: "Махи ногой назад в упоре", muscle: "glutes", equipment: "none", goals: ALL },

  { name: "Отжимания от пола", muscle: "chest", equipment: "none", goals: ALL },
  { name: "Отжимания с узкой постановкой", muscle: "chest", equipment: "none", goals: ["strength"], minLevel: "intermediate" },
  { name: "Отжимания с широкой постановкой", muscle: "chest", equipment: "none", goals: ALL },
  { name: "Отжимания с колен", muscle: "chest", equipment: "none", goals: ["endurance", "fatburn"] },
  { name: "Алмазные отжимания", muscle: "arms", equipment: "none", goals: ["strength"], minLevel: "intermediate" },
  { name: "Обратные отжимания от стула", muscle: "arms", equipment: "none", goals: ALL },
  { name: "Отжимания «щука»", muscle: "shoulders", equipment: "none", goals: ["strength"], minLevel: "intermediate" },

  { name: "Супермен", muscle: "back", equipment: "none", goals: ALL },
  { name: "Лодочка", muscle: "back", equipment: "none", goals: ALL },
  { name: "Обратная гиперэкстензия", muscle: "back", equipment: "none", goals: ALL },

  { name: "Планка", muscle: "core", equipment: "none", goals: ALL },
  { name: "Боковая планка", muscle: "core", equipment: "none", goals: ALL },
  { name: "Скручивания", muscle: "core", equipment: "none", goals: ALL },
  { name: "Обратные скручивания", muscle: "core", equipment: "none", goals: ALL },
  { name: "Велосипед лёжа", muscle: "core", equipment: "none", goals: ALL },
  { name: "«Мёртвый жук»", muscle: "core", equipment: "none", goals: ALL },
  { name: "Складка V-up", muscle: "core", equipment: "none", goals: ["strength", "fatburn"], minLevel: "intermediate" },
  { name: "Русские скручивания", muscle: "core", equipment: "none", goals: ALL },
  { name: "Подъёмы ног лёжа", muscle: "core", equipment: "none", goals: ALL },
  { name: "Планка с касанием плеч", muscle: "core", equipment: "none", goals: ALL },

  // Кардио / прыжковые
  { name: "Прыжки «джампинг джек»", muscle: "cardio", equipment: "none", jumping: true, cardio: true, highImpact: true, goals: ["endurance", "fatburn"] },
  { name: "Берпи", muscle: "fullbody", equipment: "none", jumping: true, cardio: true, highImpact: true, goals: ["endurance", "fatburn"] },
  { name: "Скалолаз (альпинист)", muscle: "core", equipment: "none", cardio: true, goals: ["endurance", "fatburn"] },
  { name: "Высокие колени", muscle: "cardio", equipment: "none", jumping: true, cardio: true, highImpact: true, goals: ["endurance", "fatburn"] },
  { name: "Захлёсты голени", muscle: "cardio", equipment: "none", cardio: true, goals: ["endurance", "fatburn"] },
  { name: "Бег на месте", muscle: "cardio", equipment: "none", cardio: true, goals: ["endurance", "fatburn"] },
  { name: "Прыжки в приседе", muscle: "legs", equipment: "none", jumping: true, cardio: true, highImpact: true, goals: ["fatburn", "strength"], minLevel: "intermediate" },
  { name: "Запрыгивания на возвышение", muscle: "legs", equipment: "none", jumping: true, cardio: true, highImpact: true, goals: ["strength", "fatburn"], minLevel: "intermediate" },
  { name: "Прыжки через скакалку", muscle: "cardio", equipment: "none", jumping: true, cardio: true, highImpact: true, goals: ["endurance", "fatburn"] },
  { name: "Конькобежец (skater)", muscle: "legs", equipment: "none", jumping: true, cardio: true, highImpact: true, goals: ["fatburn", "endurance"] },

  // === Гантели ===
  { name: "Приседания с гантелями (гоблет)", muscle: "legs", equipment: "dumbbells", goals: ALL, load: "compound_dumbbell" },
  { name: "Выпады с гантелями", muscle: "legs", equipment: "dumbbells", goals: ALL, load: "medium_unilateral" },
  { name: "Румынская тяга с гантелями", muscle: "glutes", equipment: "dumbbells", goals: ALL, load: "compound_dumbbell" },
  { name: "Зашагивания с гантелями", muscle: "legs", equipment: "dumbbells", goals: ALL, load: "medium_unilateral" },
  { name: "Жим гантелей лёжа (на полу)", muscle: "chest", equipment: "dumbbells", goals: ALL, load: "medium_press" },
  { name: "Разводка гантелей лёжа", muscle: "chest", equipment: "dumbbells", goals: ALL, load: "small_isolation" },
  { name: "Тяга гантели в наклоне", muscle: "back", equipment: "dumbbells", goals: ALL, load: "medium_unilateral" },
  { name: "Тяга гантелей в наклоне двумя руками", muscle: "back", equipment: "dumbbells", goals: ALL, load: "medium_press" },
  { name: "Жим гантелей сидя/стоя", muscle: "shoulders", equipment: "dumbbells", goals: ALL, load: "medium_press" },
  { name: "Махи гантелями в стороны", muscle: "shoulders", equipment: "dumbbells", goals: ALL, load: "small_isolation" },
  { name: "Махи гантелями в наклоне", muscle: "shoulders", equipment: "dumbbells", goals: ALL, load: "small_isolation" },
  { name: "Подъём гантелей на бицепс", muscle: "arms", equipment: "dumbbells", goals: ALL, load: "small_isolation" },
  { name: "Французский жим с гантелью", muscle: "arms", equipment: "dumbbells", goals: ALL, load: "small_isolation" },
  { name: "«Молотки» с гантелями", muscle: "arms", equipment: "dumbbells", goals: ALL, load: "small_isolation" },
  { name: "Шраги с гантелями", muscle: "back", equipment: "dumbbells", goals: ["strength"], load: "medium_press" },
  { name: "Турецкий подъём", muscle: "fullbody", equipment: "dumbbells", goals: ["strength"], minLevel: "intermediate", load: "medium_unilateral" },
  { name: "Свинг гантелью", muscle: "glutes", equipment: "dumbbells", cardio: true, goals: ["fatburn", "endurance"], load: "compound_dumbbell" },

  // === Резинки ===
  { name: "Тяга резинки к поясу сидя", muscle: "back", equipment: "bands", goals: ALL },
  { name: "Жим резинки от груди", muscle: "chest", equipment: "bands", goals: ALL },
  { name: "Разводка резинкой стоя", muscle: "chest", equipment: "bands", goals: ALL },
  { name: "Жим резинки над головой", muscle: "shoulders", equipment: "bands", goals: ALL },
  { name: "Отведение рук с резинкой", muscle: "shoulders", equipment: "bands", goals: ALL },
  { name: "Бицепс с резинкой", muscle: "arms", equipment: "bands", goals: ALL },
  { name: "Трицепс с резинкой из-за головы", muscle: "arms", equipment: "bands", goals: ALL },
  { name: "Приседания с резинкой над коленями", muscle: "legs", equipment: "bands", goals: ALL },
  { name: "Боковые шаги с резинкой («краб»)", muscle: "glutes", equipment: "bands", goals: ALL },
  { name: "Отведение бедра с резинкой", muscle: "glutes", equipment: "bands", goals: ALL },
  { name: "Ягодичный мост с резинкой", muscle: "glutes", equipment: "bands", goals: ALL },
  { name: "Тяга резинки к лицу", muscle: "shoulders", equipment: "bands", goals: ALL },
  { name: "«Раскрытие» плеч с резинкой", muscle: "back", equipment: "bands", goals: ALL },
  { name: "Подъёмы прямой ноги с резинкой", muscle: "glutes", equipment: "bands", goals: ALL },

  // === Зал: штанга / тренажёры ===
  { name: "Приседания со штангой", muscle: "legs", equipment: "barbell", goals: ALL, load: "compound_barbell" },
  { name: "Фронтальные приседания", muscle: "legs", equipment: "barbell", goals: ["strength"], minLevel: "intermediate", load: "compound_barbell" },
  { name: "Жим штанги лёжа", muscle: "chest", equipment: "barbell", goals: ALL, load: "compound_barbell" },
  { name: "Жим штанги под углом", muscle: "chest", equipment: "barbell", goals: ALL, load: "compound_barbell" },
  { name: "Становая тяга", muscle: "back", equipment: "barbell", goals: ["strength"], minLevel: "intermediate", load: "deadlift" },
  { name: "Румынская тяга со штангой", muscle: "glutes", equipment: "barbell", goals: ALL, load: "compound_barbell" },
  { name: "Тяга штанги в наклоне", muscle: "back", equipment: "barbell", goals: ALL, load: "compound_barbell" },
  { name: "Армейский жим", muscle: "shoulders", equipment: "barbell", goals: ALL, load: "medium_press" },
  { name: "Подъём штанги на бицепс", muscle: "arms", equipment: "barbell", goals: ALL, load: "medium_press" },
  { name: "Жим узким хватом", muscle: "arms", equipment: "barbell", goals: ALL, load: "compound_barbell" },

  { name: "Жим ногами в тренажёре", muscle: "legs", equipment: "machines", goals: ALL },
  { name: "Разгибания ног в тренажёре", muscle: "legs", equipment: "machines", goals: ALL },
  { name: "Сгибания ног в тренажёре", muscle: "legs", equipment: "machines", goals: ALL },
  { name: "Тяга верхнего блока", muscle: "back", equipment: "machines", goals: ALL },
  { name: "Горизонтальная тяга в блоке", muscle: "back", equipment: "machines", goals: ALL },
  { name: "Сведение в кроссовере", muscle: "chest", equipment: "machines", goals: ALL },
  { name: "Трицепс на блоке", muscle: "arms", equipment: "machines", goals: ALL },
  { name: "Беговая дорожка (интервалы)", muscle: "cardio", equipment: "machines", cardio: true, goals: ["endurance", "fatburn"] },
  { name: "Гребной тренажёр", muscle: "fullbody", equipment: "machines", cardio: true, goals: ["endurance", "fatburn"] },
  { name: "Эллипсоид", muscle: "cardio", equipment: "machines", cardio: true, goals: ["endurance", "fatburn"] },
  { name: "Велотренажёр", muscle: "cardio", equipment: "machines", cardio: true, goals: ["endurance", "fatburn"] },

  { name: "Махи гирей", muscle: "glutes", equipment: "kettlebell", cardio: true, goals: ["fatburn", "endurance", "strength"], load: "kettlebell" },
  { name: "Гоблет-присед с гирей", muscle: "legs", equipment: "kettlebell", goals: ALL, load: "kettlebell" },

  // === Улица / турник ===
  { name: "Подтягивания прямым хватом", muscle: "back", equipment: "bar", goals: ["strength", "endurance"], minLevel: "intermediate" },
  { name: "Подтягивания обратным хватом", muscle: "arms", equipment: "bar", goals: ["strength"], minLevel: "intermediate" },
  { name: "Австралийские подтягивания", muscle: "back", equipment: "bar", goals: ALL },
  { name: "Отжимания на брусьях", muscle: "chest", equipment: "bar", goals: ["strength"], minLevel: "intermediate" },
  { name: "Подъём коленей в висе", muscle: "core", equipment: "bar", goals: ALL },
  { name: "Подъём ног в висе", muscle: "core", equipment: "bar", goals: ["strength"], minLevel: "advanced" },
  { name: "Уголок в упоре на брусьях", muscle: "core", equipment: "bar", goals: ["strength"], minLevel: "intermediate" },
];

function isAllowed(
  ex: Exercise,
  f: FormData,
  excludeJumps: boolean,
): boolean {
  if (!ex.goals.includes(f.goal)) return false;
  if (ex.minLevel && levelOrder[f.level] < levelOrder[ex.minLevel]) return false;
  if (excludeJumps && ex.highImpact) return false;

  switch (f.place) {
    case "home": {
      if (ex.equipment === "none") return true;
      if (ex.equipment === "dumbbells") return !!f.homeDumbbells;
      if (ex.equipment === "bands") return !!f.homeBands;
      return false; // нет штанги/тренажёров/турника дома
    }
    case "gym": {
      // в зале есть всё, кроме улицы (брусья/турник опционально, но допустим)
      return ["none", "dumbbells", "bands", "barbell", "machines", "kettlebell", "bar"].includes(
        ex.equipment,
      );
    }
    case "outdoor": {
      // на улице нет штанги/тренажёров; гантели/резинки маловероятны
      return ex.equipment === "none" || ex.equipment === "bar";
    }
  }
}

// Рекомендованный вес снаряда (кг) — от веса пользователя, пола, уровня и типа упражнения
function recommendWeight(
  ex: Exercise,
  f: FormData,
): string | undefined {
  if (!ex.load) return undefined;

  // Базовая доля от массы тела (нижняя граница)
  const ratios: Record<LoadType, number> = {
    small_isolation: 0.07, // на одну руку
    medium_unilateral: 0.18, // на одну руку/ногу
    medium_press: 0.22, // на одну руку (для пары гантелей)
    compound_dumbbell: 0.35, // одна гантель/гиря двумя руками
    kettlebell: 0.3,
    compound_barbell: 0.85, // штанга
    deadlift: 1.1,
  };
  const base = ratios[ex.load] * f.weight;

  // Поправка на уровень
  const lvl = { beginner: 0.7, intermediate: 1.0, advanced: 1.3 }[f.level];
  // Поправка на пол
  const gen = f.gender === "female" ? 0.7 : 1.0;
  // Поправка на цель (выносливость / жиросжигание — легче)
  const goal =
    f.goal === "strength" ? 1.0 : f.goal === "endurance" ? 0.75 : 0.85;

  let lo = base * lvl * gen * goal;
  let hi = lo * 1.3;

  // Округление до приятных значений
  const round = (v: number): number => {
    if (v < 6) return Math.max(1, Math.round(v * 2) / 2); // шаг 0.5
    if (v < 30) return Math.round(v); // шаг 1
    return Math.round(v / 2.5) * 2.5; // шаг 2.5
  };
  lo = round(lo);
  hi = round(hi);
  if (hi <= lo) hi = lo + (lo < 10 ? 1 : 2.5);

  // Подпись с учётом «на руку / штанга / гиря»
  const isPerHand =
    ex.load === "small_isolation" ||
    ex.load === "medium_unilateral" ||
    ex.load === "medium_press";
  const suffix = isPerHand
    ? " на руку"
    : ex.load === "compound_barbell" || ex.load === "deadlift"
      ? " (включая гриф)"
      : "";

  return `≈ ${lo}–${hi} кг${suffix}`;
}

function setsFor(ex: Exercise, level: Level): string {
  if (ex.cardio) return cardioByLevel[level];
  if (ex.muscle === "core" && (ex.name === "Планка" || ex.name === "Боковая планка")) {
    return isometricByLevel[level];
  }
  return setsByLevel[level];
}

// Перемешивание массива (Fisher–Yates)
function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

// Сбалансированный отбор: стараемся охватить разные группы мышц
function pickBalanced(pool: Exercise[], goal: Goal, target: number): Exercise[] {
  // Желаемое распределение по типам в зависимости от цели
  const priorityByGoal: Record<Goal, Muscle[]> = {
    strength: ["legs", "chest", "back", "shoulders", "arms", "core", "glutes"],
    endurance: ["cardio", "core", "legs", "fullbody", "back", "shoulders", "chest"],
    fatburn: ["cardio", "fullbody", "legs", "glutes", "core", "back", "chest"],
  };

  const priority = priorityByGoal[goal];
  const shuffled = shuffle(pool);
  const picked: Exercise[] = [];
  const usedMuscles = new Set<Muscle>();
  const usedNames = new Set<string>();

  // 1) Берём по одному из каждой приоритетной группы мышц
  for (const muscle of priority) {
    if (picked.length >= target) break;
    const found = shuffled.find(
      (e) => e.muscle === muscle && !usedNames.has(e.name),
    );
    if (found) {
      picked.push(found);
      usedNames.add(found.name);
      usedMuscles.add(found.muscle);
    }
  }

  // 2) Добиваем до target случайными оставшимися
  for (const ex of shuffled) {
    if (picked.length >= target) break;
    if (!usedNames.has(ex.name)) {
      picked.push(ex);
      usedNames.add(ex.name);
    }
  }

  // 3) Для жиросжигания — гарантируем минимум 1 кардио-движение, если оно есть в пуле
  const hasCardio = picked.some((e) => e.cardio);
  if (!hasCardio && (goal === "fatburn" || goal === "endurance")) {
    const cardio = shuffled.find((e) => e.cardio && !usedNames.has(e.name));
    if (cardio && picked.length > 0) {
      picked[picked.length - 1] = cardio;
    }
  }

  // 4) Перемешиваем порядок выполнения, но кардио — ближе к концу для силовых
  if (goal === "strength") {
    picked.sort((a, b) => Number(!!a.cardio) - Number(!!b.cardio));
  } else {
    // Для кардио/жиросжигания чередуем
    return shuffle(picked);
  }
  return picked;
}

export interface WorkoutResult {
  exercises: ExerciseOut[];
  calories: number;
  warnings: string[];
  tips: string[];
  summary: string;
}

export function generateWorkout(f: FormData): WorkoutResult {
  const excludeJumps = f.age > 45 && f.weight > 100;
  const pool = EXERCISES.filter((e) => isAllowed(e, f, excludeJumps));

  // Целевое количество — 5–6 упражнений
  const target = Math.random() < 0.5 ? 5 : 6;
  const picked = pickBalanced(pool, f.goal, Math.min(target, pool.length));

  const exercises: ExerciseOut[] = picked.map((ex) => ({
    name: ex.name,
    sets: setsFor(ex, f.level),
    muscle: muscleLabel[ex.muscle],
    weight: recommendWeight(ex, f),
  }));

  // Калории: вес × 0.075 × минуты × поправка
  const levelMul = { beginner: 0.9, intermediate: 1, advanced: 1.15 }[f.level];
  const goalMul = { strength: 1, endurance: 1.1, fatburn: 1.25 }[f.goal];
  const calories = Math.round(f.weight * 0.075 * f.duration * levelMul * goalMul);

  // Сводка по задействованным группам
  const muscles = Array.from(new Set(picked.map((e) => muscleLabel[e.muscle])));
  const summary = muscles.join(" · ");

  // Предупреждения
  const warnings: string[] = [];
  if (f.age > 60) {
    warnings.push(
      "Возраст более 60 лет — начните с разминки 10 минут и контролируйте пульс.",
    );
  }
  if (excludeJumps) {
    warnings.push(
      "Прыжковые упражнения исключены: возраст > 45 и вес > 100 кг (нагрузка на суставы).",
    );
  }
  if (f.weight > 110) {
    warnings.push(
      "При большом весе избегайте резких движений и используйте мягкое покрытие.",
    );
  }
  if (f.age < 16) {
    warnings.push(
      "Подросткам не рекомендуется работа с большими весами — делайте акцент на технику.",
    );
  }
  if (f.place === "home" && !f.homeDumbbells && !f.homeBands && f.goal === "strength") {
    warnings.push(
      "Силовая тренировка дома без инвентаря ограничена. Подключите гантели или резинки для большего эффекта.",
    );
  }

  // Советы
  const tips: string[] = [];
  tips.push("Перед тренировкой — разминка 5–10 минут (суставная гимнастика).");
  if (f.goal === "strength") {
    tips.push("Между тренировками одной группы мышц — 48 часов отдыха.");
    tips.push("Спите не менее 7–8 часов: рост мышц происходит во сне.");
  }
  if (f.goal === "endurance") {
    tips.push("Чередуйте интенсивные дни с лёгкими восстановительными.");
    tips.push("Пейте воду небольшими глотками во время занятия.");
  }
  if (f.goal === "fatburn") {
    tips.push("Добавьте 7–10 тыс. шагов в день для усиления эффекта.");
    tips.push("Контролируйте питание — без дефицита калорий жир не уйдёт.");
  }
  if (f.level === "advanced") {
    tips.push("Раз в 6–8 недель устраивайте разгрузочную неделю.");
  } else {
    tips.push("Не тренируйтесь чаще 3–4 раз в неделю на старте.");
  }
  tips.push("После тренировки — заминка и растяжка 5 минут.");

  return { exercises, calories, warnings, tips, summary };
}
