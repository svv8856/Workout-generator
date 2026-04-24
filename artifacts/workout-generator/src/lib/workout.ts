export type Gender = "male" | "female";
export type Level = "beginner" | "intermediate" | "advanced";
export type Goal = "strength" | "endurance" | "fatburn";
export type Place = "home" | "gym" | "outdoor";
export type Muscle =
  | "legs"
  | "chest"
  | "back"
  | "shoulders"
  | "biceps"
  | "triceps"
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
  cue: string;
  videoUrl: string;
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
  biceps: "Бицепс",
  triceps: "Трицепс",
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

// База упражнений — широкий пул для всех мест и инвентаря.
// Сгруппирована по инвентарю → мышечной группе. Биц/трицепс разделены строго.
const EXERCISES: Exercise[] = [
  // ============================================================
  // === БЕЗ ИНВЕНТАРЯ (дом / улица / зал) ===
  // ============================================================

  // --- Ноги (квадрицепс / бицепс бедра / икры) ---
  { name: "Приседания с собственным весом", muscle: "legs", equipment: "none", goals: ALL },
  { name: "Глубокие приседания «сумо»", muscle: "legs", equipment: "none", goals: ALL },
  { name: "Болгарские сплит-приседания", muscle: "legs", equipment: "none", goals: ["strength", "fatburn"], minLevel: "intermediate" },
  { name: "Сисси-приседания у опоры", muscle: "legs", equipment: "none", goals: ["strength"], minLevel: "intermediate" },
  { name: "Выпады на месте", muscle: "legs", equipment: "none", goals: ALL },
  { name: "Выпады в ходьбе", muscle: "legs", equipment: "none", goals: ALL },
  { name: "Обратные выпады", muscle: "legs", equipment: "none", goals: ALL },
  { name: "Реверанс-выпады", muscle: "legs", equipment: "none", goals: ALL },
  { name: "Боковые выпады", muscle: "legs", equipment: "none", goals: ALL },
  { name: "Зашагивания на стул", muscle: "legs", equipment: "none", goals: ALL },
  { name: "Подъёмы на носки", muscle: "legs", equipment: "none", goals: ALL },
  { name: "Подъём на носки на одной ноге", muscle: "legs", equipment: "none", goals: ALL, minLevel: "intermediate" },
  { name: "Пистолетик (присед на одной ноге)", muscle: "legs", equipment: "none", goals: ["strength"], minLevel: "advanced" },
  { name: "Сгибание голени «нордик» (партнёр/опора)", muscle: "legs", equipment: "none", goals: ["strength"], minLevel: "advanced" },

  // --- Ягодицы ---
  { name: "Ягодичный мост", muscle: "glutes", equipment: "none", goals: ALL },
  { name: "Ягодичный мост на одной ноге", muscle: "glutes", equipment: "none", goals: ["strength", "fatburn"], minLevel: "intermediate" },
  { name: "Лягушачий мост", muscle: "glutes", equipment: "none", goals: ALL },
  { name: "«Пожарный гидрант»", muscle: "glutes", equipment: "none", goals: ALL },
  { name: "«Раковина» (clamshell)", muscle: "glutes", equipment: "none", goals: ALL },
  { name: "Махи ногой назад в упоре", muscle: "glutes", equipment: "none", goals: ALL },
  { name: "Махи ногой в сторону лёжа", muscle: "glutes", equipment: "none", goals: ALL },

  // --- Грудь ---
  { name: "Отжимания от пола", muscle: "chest", equipment: "none", goals: ALL },
  { name: "Отжимания с узкой постановкой", muscle: "chest", equipment: "none", goals: ["strength"], minLevel: "intermediate" },
  { name: "Отжимания с широкой постановкой", muscle: "chest", equipment: "none", goals: ALL },
  { name: "Отжимания с колен", muscle: "chest", equipment: "none", goals: ["endurance", "fatburn"] },
  { name: "Отжимания с возвышения (от опоры)", muscle: "chest", equipment: "none", goals: ALL },
  { name: "Отжимания с ногами на возвышении", muscle: "chest", equipment: "none", goals: ["strength"], minLevel: "intermediate" },
  { name: "Отжимания «лучник»", muscle: "chest", equipment: "none", goals: ["strength"], minLevel: "advanced" },
  { name: "Плиометрические отжимания (с хлопком)", muscle: "chest", equipment: "none", jumping: true, highImpact: true, goals: ["strength"], minLevel: "advanced" },

  // --- Спина (без инвентаря) ---
  { name: "Супермен", muscle: "back", equipment: "none", goals: ALL },
  { name: "Лодочка", muscle: "back", equipment: "none", goals: ALL },
  { name: "Обратная гиперэкстензия лёжа", muscle: "back", equipment: "none", goals: ALL },
  { name: "Y-T-W подъёмы лёжа на животе", muscle: "back", equipment: "none", goals: ALL },

  // --- Плечи (без инвентаря) ---
  { name: "Отжимания «щука»", muscle: "shoulders", equipment: "none", goals: ["strength"], minLevel: "intermediate" },
  { name: "Стойка на руках у стены — удержание", muscle: "shoulders", equipment: "none", goals: ["strength"], minLevel: "intermediate" },
  { name: "Отжимания в стойке на руках у стены", muscle: "shoulders", equipment: "none", goals: ["strength"], minLevel: "advanced" },

  // --- Трицепс (без инвентаря) ---
  { name: "Алмазные отжимания", muscle: "triceps", equipment: "none", goals: ["strength"], minLevel: "intermediate" },
  { name: "Обратные отжимания от стула", muscle: "triceps", equipment: "none", goals: ALL },
  { name: "Отжимания с узкой постановкой (трицепсовые)", muscle: "triceps", equipment: "none", goals: ALL },

  // --- Бицепс (без инвентаря — ограниченный набор, но он есть) ---
  { name: "Изометрический подъём на бицепс с полотенцем", muscle: "biceps", equipment: "none", goals: ALL },
  { name: "Сгибания на бицепс с рюкзаком", muscle: "biceps", equipment: "none", goals: ALL },
  { name: "Перевёрнутая тяга обратным хватом (под столом)", muscle: "biceps", equipment: "none", goals: ALL },

  // --- Кор / пресс (без инвентаря) ---
  { name: "Планка", muscle: "core", equipment: "none", goals: ALL },
  { name: "Боковая планка", muscle: "core", equipment: "none", goals: ALL },
  { name: "Боковая планка с подъёмом таза", muscle: "core", equipment: "none", goals: ["strength", "fatburn"], minLevel: "intermediate" },
  { name: "Планка с касанием плеч", muscle: "core", equipment: "none", goals: ALL },
  { name: "Планка с подъёмом ноги", muscle: "core", equipment: "none", goals: ALL },
  { name: "Скручивания", muscle: "core", equipment: "none", goals: ALL },
  { name: "Обратные скручивания", muscle: "core", equipment: "none", goals: ALL },
  { name: "Велосипед лёжа", muscle: "core", equipment: "none", goals: ALL },
  { name: "«Мёртвый жук»", muscle: "core", equipment: "none", goals: ALL },
  { name: "Птица-собака (Bird dog)", muscle: "core", equipment: "none", goals: ALL },
  { name: "Полая удержка (Hollow hold)", muscle: "core", equipment: "none", goals: ["strength"], minLevel: "intermediate" },
  { name: "Складка V-up", muscle: "core", equipment: "none", goals: ["strength", "fatburn"], minLevel: "intermediate" },
  { name: "Русские скручивания", muscle: "core", equipment: "none", goals: ALL },
  { name: "Подъёмы ног лёжа", muscle: "core", equipment: "none", goals: ALL },
  { name: "Касания носков лёжа", muscle: "core", equipment: "none", goals: ALL },

  // --- Кардио / прыжковые ---
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
  { name: "Шэдоубоксинг", muscle: "cardio", equipment: "none", cardio: true, goals: ["endurance", "fatburn"] },

  // ============================================================
  // === ГАНТЕЛИ ===
  // ============================================================

  // --- Ноги ---
  { name: "Приседания с гантелями (гоблет)", muscle: "legs", equipment: "dumbbells", goals: ALL, load: "compound_dumbbell" },
  { name: "Выпады с гантелями", muscle: "legs", equipment: "dumbbells", goals: ALL, load: "medium_unilateral" },
  { name: "Обратные выпады с гантелями", muscle: "legs", equipment: "dumbbells", goals: ALL, load: "medium_unilateral" },
  { name: "Болгарский присед с гантелями", muscle: "legs", equipment: "dumbbells", goals: ALL, load: "medium_unilateral", minLevel: "intermediate" },
  { name: "Зашагивания с гантелями", muscle: "legs", equipment: "dumbbells", goals: ALL, load: "medium_unilateral" },
  { name: "Подъём на носки с гантелями", muscle: "legs", equipment: "dumbbells", goals: ALL, load: "medium_press" },

  // --- Ягодицы ---
  { name: "Румынская тяга с гантелями", muscle: "glutes", equipment: "dumbbells", goals: ALL, load: "compound_dumbbell" },
  { name: "Становая на одной ноге с гантелью", muscle: "glutes", equipment: "dumbbells", goals: ALL, load: "medium_unilateral", minLevel: "intermediate" },
  { name: "Свинг гантелью", muscle: "glutes", equipment: "dumbbells", cardio: true, goals: ["fatburn", "endurance"], load: "compound_dumbbell" },
  { name: "Ягодичный мост с гантелью", muscle: "glutes", equipment: "dumbbells", goals: ALL, load: "compound_dumbbell" },

  // --- Грудь ---
  { name: "Жим гантелей лёжа (на полу)", muscle: "chest", equipment: "dumbbells", goals: ALL, load: "medium_press" },
  { name: "Жим гантелей под углом вверх", muscle: "chest", equipment: "dumbbells", goals: ALL, load: "medium_press" },
  { name: "Жим гантелей под углом вниз", muscle: "chest", equipment: "dumbbells", goals: ALL, load: "medium_press", minLevel: "intermediate" },
  { name: "Разводка гантелей лёжа", muscle: "chest", equipment: "dumbbells", goals: ALL, load: "small_isolation" },
  { name: "Пуловер с гантелью", muscle: "chest", equipment: "dumbbells", goals: ALL, load: "compound_dumbbell" },

  // --- Спина ---
  { name: "Тяга гантели в наклоне одной рукой", muscle: "back", equipment: "dumbbells", goals: ALL, load: "medium_unilateral" },
  { name: "Тяга гантелей в наклоне двумя руками", muscle: "back", equipment: "dumbbells", goals: ALL, load: "medium_press" },
  { name: "Тяга гантелей лёжа на наклонной (chest-supported)", muscle: "back", equipment: "dumbbells", goals: ALL, load: "medium_press" },
  { name: "Шраги с гантелями", muscle: "back", equipment: "dumbbells", goals: ["strength"], load: "medium_press" },

  // --- Плечи ---
  { name: "Жим гантелей сидя/стоя", muscle: "shoulders", equipment: "dumbbells", goals: ALL, load: "medium_press" },
  { name: "Жим Арнольда", muscle: "shoulders", equipment: "dumbbells", goals: ALL, load: "medium_press", minLevel: "intermediate" },
  { name: "Махи гантелями в стороны", muscle: "shoulders", equipment: "dumbbells", goals: ALL, load: "small_isolation" },
  { name: "Махи гантелями в наклоне", muscle: "shoulders", equipment: "dumbbells", goals: ALL, load: "small_isolation" },
  { name: "Подъёмы гантелей перед собой", muscle: "shoulders", equipment: "dumbbells", goals: ALL, load: "small_isolation" },

  // --- Бицепс ---
  { name: "Подъём гантелей на бицепс", muscle: "biceps", equipment: "dumbbells", goals: ALL, load: "small_isolation" },
  { name: "«Молотки» с гантелями", muscle: "biceps", equipment: "dumbbells", goals: ALL, load: "small_isolation" },
  { name: "Концентрированный подъём на бицепс", muscle: "biceps", equipment: "dumbbells", goals: ALL, load: "small_isolation" },
  { name: "Сгибания на бицепс на наклонной скамье", muscle: "biceps", equipment: "dumbbells", goals: ALL, load: "small_isolation", minLevel: "intermediate" },
  { name: "Подъём бицепса с супинацией (Цоттмана)", muscle: "biceps", equipment: "dumbbells", goals: ALL, load: "small_isolation", minLevel: "intermediate" },

  // --- Трицепс ---
  { name: "Французский жим с гантелью", muscle: "triceps", equipment: "dumbbells", goals: ALL, load: "small_isolation" },
  { name: "Разгибание из-за головы с гантелью двумя руками", muscle: "triceps", equipment: "dumbbells", goals: ALL, load: "small_isolation" },
  { name: "Разгибание гантели в наклоне («кикбэк»)", muscle: "triceps", equipment: "dumbbells", goals: ALL, load: "small_isolation" },
  { name: "Лёжа разгибания гантелей («черепа»)", muscle: "triceps", equipment: "dumbbells", goals: ALL, load: "small_isolation", minLevel: "intermediate" },

  // --- Всё тело ---
  { name: "Турецкий подъём", muscle: "fullbody", equipment: "dumbbells", goals: ["strength"], minLevel: "intermediate", load: "medium_unilateral" },
  { name: "Трастер с гантелями (присед + жим)", muscle: "fullbody", equipment: "dumbbells", cardio: true, goals: ["fatburn", "endurance", "strength"], load: "medium_press", minLevel: "intermediate" },

  // ============================================================
  // === РЕЗИНКИ ===
  // ============================================================

  // --- Спина ---
  { name: "Тяга резинки к поясу сидя", muscle: "back", equipment: "bands", goals: ALL },
  { name: "Тяга резинки сверху сидя на полу", muscle: "back", equipment: "bands", goals: ALL },
  { name: "«Раскрытие» плеч с резинкой", muscle: "back", equipment: "bands", goals: ALL },

  // --- Грудь ---
  { name: "Жим резинки от груди", muscle: "chest", equipment: "bands", goals: ALL },
  { name: "Разводка резинкой стоя", muscle: "chest", equipment: "bands", goals: ALL },

  // --- Плечи ---
  { name: "Жим резинки над головой", muscle: "shoulders", equipment: "bands", goals: ALL },
  { name: "Отведение рук с резинкой", muscle: "shoulders", equipment: "bands", goals: ALL },
  { name: "Тяга резинки к лицу", muscle: "shoulders", equipment: "bands", goals: ALL },

  // --- Бицепс ---
  { name: "Бицепс с резинкой", muscle: "biceps", equipment: "bands", goals: ALL },

  // --- Трицепс ---
  { name: "Трицепс с резинкой из-за головы", muscle: "triceps", equipment: "bands", goals: ALL },
  { name: "Разгибание резинки вниз стоя (как блок)", muscle: "triceps", equipment: "bands", goals: ALL },

  // --- Ноги / ягодицы ---
  { name: "Приседания с резинкой над коленями", muscle: "legs", equipment: "bands", goals: ALL },
  { name: "Сгибание ноги стоя с резинкой", muscle: "legs", equipment: "bands", goals: ALL },
  { name: "Боковые шаги с резинкой («краб»)", muscle: "glutes", equipment: "bands", goals: ALL },
  { name: "Отведение бедра с резинкой", muscle: "glutes", equipment: "bands", goals: ALL },
  { name: "Ягодичный мост с резинкой", muscle: "glutes", equipment: "bands", goals: ALL },
  { name: "Подъёмы прямой ноги с резинкой", muscle: "glutes", equipment: "bands", goals: ALL },

  // ============================================================
  // === ЗАЛ: ШТАНГА ===
  // ============================================================

  // --- Ноги ---
  { name: "Приседания со штангой", muscle: "legs", equipment: "barbell", goals: ALL, load: "compound_barbell" },
  { name: "Фронтальные приседания", muscle: "legs", equipment: "barbell", goals: ["strength"], minLevel: "intermediate", load: "compound_barbell" },
  { name: "Сплит-присед со штангой", muscle: "legs", equipment: "barbell", goals: ALL, load: "compound_barbell", minLevel: "intermediate" },
  { name: "Подъём на носки со штангой", muscle: "legs", equipment: "barbell", goals: ALL, load: "compound_barbell" },

  // --- Ягодицы / спина (тазодоминантные) ---
  { name: "Становая тяга", muscle: "back", equipment: "barbell", goals: ["strength"], minLevel: "intermediate", load: "deadlift" },
  { name: "Сумо-становая тяга", muscle: "glutes", equipment: "barbell", goals: ["strength"], minLevel: "intermediate", load: "deadlift" },
  { name: "Румынская тяга со штангой", muscle: "glutes", equipment: "barbell", goals: ALL, load: "compound_barbell" },
  { name: "Ягодичный мост со штангой (hip thrust)", muscle: "glutes", equipment: "barbell", goals: ALL, load: "compound_barbell" },
  { name: "«Гуд морнинг» со штангой", muscle: "glutes", equipment: "barbell", goals: ["strength"], minLevel: "intermediate", load: "compound_barbell" },

  // --- Грудь ---
  { name: "Жим штанги лёжа", muscle: "chest", equipment: "barbell", goals: ALL, load: "compound_barbell" },
  { name: "Жим штанги под углом вверх", muscle: "chest", equipment: "barbell", goals: ALL, load: "compound_barbell" },
  { name: "Жим штанги под углом вниз", muscle: "chest", equipment: "barbell", goals: ALL, load: "compound_barbell", minLevel: "intermediate" },
  { name: "Пуловер со штангой", muscle: "chest", equipment: "barbell", goals: ALL, load: "medium_press" },

  // --- Спина ---
  { name: "Тяга штанги в наклоне", muscle: "back", equipment: "barbell", goals: ALL, load: "compound_barbell" },
  { name: "Тяга штанги в наклоне обратным хватом", muscle: "back", equipment: "barbell", goals: ALL, load: "compound_barbell", minLevel: "intermediate" },
  { name: "Шраги со штангой", muscle: "back", equipment: "barbell", goals: ["strength"], load: "compound_barbell" },
  { name: "Тяга «снэтч-грипом» с плинтов", muscle: "back", equipment: "barbell", goals: ["strength"], minLevel: "advanced", load: "deadlift" },

  // --- Плечи ---
  { name: "Армейский жим", muscle: "shoulders", equipment: "barbell", goals: ALL, load: "medium_press" },
  { name: "Жим штанги из-за головы сидя", muscle: "shoulders", equipment: "barbell", goals: ["strength"], minLevel: "intermediate", load: "medium_press" },
  { name: "Тяга штанги к подбородку", muscle: "shoulders", equipment: "barbell", goals: ALL, load: "medium_press" },

  // --- Бицепс ---
  { name: "Подъём штанги на бицепс", muscle: "biceps", equipment: "barbell", goals: ALL, load: "medium_press" },
  { name: "Подъём EZ-штанги на бицепс", muscle: "biceps", equipment: "barbell", goals: ALL, load: "medium_press" },

  // --- Трицепс ---
  { name: "Жим узким хватом", muscle: "triceps", equipment: "barbell", goals: ALL, load: "compound_barbell" },
  { name: "Французский жим со штангой лёжа («черепа»)", muscle: "triceps", equipment: "barbell", goals: ALL, load: "medium_press", minLevel: "intermediate" },

  // ============================================================
  // === ЗАЛ: ТРЕНАЖЁРЫ ===
  // ============================================================

  // --- Ноги ---
  { name: "Жим ногами в тренажёре", muscle: "legs", equipment: "machines", goals: ALL },
  { name: "Гак-присед в тренажёре", muscle: "legs", equipment: "machines", goals: ALL, minLevel: "intermediate" },
  { name: "Разгибания ног в тренажёре", muscle: "legs", equipment: "machines", goals: ALL },
  { name: "Сгибания ног в тренажёре", muscle: "legs", equipment: "machines", goals: ALL },
  { name: "Подъём на носки в тренажёре сидя", muscle: "legs", equipment: "machines", goals: ALL },

  // --- Ягодицы ---
  { name: "Отведение бедра в тренажёре", muscle: "glutes", equipment: "machines", goals: ALL },
  { name: "Махи назад в кроссовере", muscle: "glutes", equipment: "machines", goals: ALL },

  // --- Спина ---
  { name: "Тяга верхнего блока", muscle: "back", equipment: "machines", goals: ALL },
  { name: "Тяга верхнего блока обратным хватом", muscle: "back", equipment: "machines", goals: ALL },
  { name: "Горизонтальная тяга в блоке", muscle: "back", equipment: "machines", goals: ALL },
  { name: "Тяга в Т-грифе", muscle: "back", equipment: "machines", goals: ALL, minLevel: "intermediate" },
  { name: "Прямые руки в верхнем блоке (пуловер на блоке)", muscle: "back", equipment: "machines", goals: ALL },

  // --- Грудь ---
  { name: "Сведение в кроссовере", muscle: "chest", equipment: "machines", goals: ALL },
  { name: "Жим в тренажёре сидя для груди", muscle: "chest", equipment: "machines", goals: ALL },
  { name: "Сведение «бабочка» (пек-дек)", muscle: "chest", equipment: "machines", goals: ALL },

  // --- Плечи ---
  { name: "Жим в тренажёре для плеч", muscle: "shoulders", equipment: "machines", goals: ALL },
  { name: "Махи в стороны в блоке стоя", muscle: "shoulders", equipment: "machines", goals: ALL },
  { name: "Обратная «бабочка» (rear delt fly)", muscle: "shoulders", equipment: "machines", goals: ALL },

  // --- Бицепс ---
  { name: "Бицепс в нижнем блоке", muscle: "biceps", equipment: "machines", goals: ALL },
  { name: "Бицепс на скамье Скотта", muscle: "biceps", equipment: "machines", goals: ALL },

  // --- Трицепс ---
  { name: "Трицепс на блоке (прямая рукоять)", muscle: "triceps", equipment: "machines", goals: ALL },
  { name: "Трицепс на блоке канатной рукоятью", muscle: "triceps", equipment: "machines", goals: ALL },
  { name: "Трицепс из-за головы в блоке", muscle: "triceps", equipment: "machines", goals: ALL },

  // --- Кардио-тренажёры ---
  { name: "Беговая дорожка (интервалы)", muscle: "cardio", equipment: "machines", cardio: true, goals: ["endurance", "fatburn"] },
  { name: "Гребной тренажёр", muscle: "fullbody", equipment: "machines", cardio: true, goals: ["endurance", "fatburn"] },
  { name: "Эллипсоид", muscle: "cardio", equipment: "machines", cardio: true, goals: ["endurance", "fatburn"] },
  { name: "Велотренажёр", muscle: "cardio", equipment: "machines", cardio: true, goals: ["endurance", "fatburn"] },
  { name: "Эйрбайк (assault bike)", muscle: "cardio", equipment: "machines", cardio: true, goals: ["endurance", "fatburn"], minLevel: "intermediate" },

  // ============================================================
  // === ГИРИ ===
  // ============================================================
  { name: "Махи гирей", muscle: "glutes", equipment: "kettlebell", cardio: true, goals: ["fatburn", "endurance", "strength"], load: "kettlebell" },
  { name: "Гоблет-присед с гирей", muscle: "legs", equipment: "kettlebell", goals: ALL, load: "kettlebell" },
  { name: "Становая тяга с гирей", muscle: "glutes", equipment: "kettlebell", goals: ALL, load: "kettlebell" },
  { name: "Тяга гири в наклоне одной рукой", muscle: "back", equipment: "kettlebell", goals: ALL, load: "kettlebell" },
  { name: "Жим гири стоя одной рукой", muscle: "shoulders", equipment: "kettlebell", goals: ALL, load: "kettlebell" },

  // ============================================================
  // === УЛИЦА / ТУРНИК / БРУСЬЯ ===
  // ============================================================
  { name: "Подтягивания прямым хватом", muscle: "back", equipment: "bar", goals: ["strength", "endurance"], minLevel: "intermediate" },
  { name: "Подтягивания широким хватом", muscle: "back", equipment: "bar", goals: ["strength"], minLevel: "advanced" },
  { name: "Подтягивания нейтральным хватом", muscle: "back", equipment: "bar", goals: ["strength", "endurance"], minLevel: "intermediate" },
  { name: "Подтягивания обратным хватом", muscle: "biceps", equipment: "bar", goals: ["strength"], minLevel: "intermediate" },
  { name: "Австралийские подтягивания", muscle: "back", equipment: "bar", goals: ALL },
  { name: "Отжимания на брусьях", muscle: "chest", equipment: "bar", goals: ["strength"], minLevel: "intermediate" },
  { name: "Отжимания на брусьях вертикально (трицепсовые)", muscle: "triceps", equipment: "bar", goals: ["strength"], minLevel: "intermediate" },
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
// Возрастной коэффициент силы — пик в 25–35, далее снижение
// (по данным NSCA / ACSM: ~0.5–1% в год после 35 лет)
function ageStrengthFactor(age: number): number {
  if (age < 16) return 0.55;
  if (age < 18) return 0.7;
  if (age <= 30) return 1.0;
  if (age <= 40) return 0.95;
  if (age <= 50) return 0.87;
  if (age <= 60) return 0.78;
  if (age <= 70) return 0.68;
  return 0.55;
}

// Возрастной коэффициент метаболизма (BMR падает с возрастом)
function ageMetabolismFactor(age: number): number {
  if (age <= 25) return 1.05;
  if (age <= 35) return 1.0;
  if (age <= 45) return 0.95;
  if (age <= 55) return 0.9;
  if (age <= 65) return 0.85;
  return 0.8;
}

function recommendWeight(
  ex: Exercise,
  f: FormData,
  loadScale: number = 1.0,
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
  // Поправка на возраст
  const ageF = ageStrengthFactor(f.age);

  let lo = base * lvl * gen * goal * ageF * loadScale;
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

// Краткая подсказка по технике — подбирается по ключевым словам в названии
function cueFor(name: string): string {
  const n = name.toLowerCase();
  const rules: Array<[RegExp, string]> = [
    // --- Новые / специфические упражнения (специальные паттерны идут первыми) ---
    [/трастер/, "Гантели/гири у плеч, присед до параллели → взрывной выход + жим над головой одним движением."],
    [/гак.*присед/, "Стопы на платформе чуть впереди, спина прижата, опускайтесь до 90° в колене, не отрывайте таз."],
    [/сплит.*присед/, "Ноги в шахматную стойку, опускайтесь вертикально вниз, заднее колено почти касается пола."],
    [/сисси/, "Держитесь за опору, опускайтесь назад на носки, разгибая бёдра, колени уходят далеко вперёд."],
    [/нордик/, "Колени на мягкой опоре, стопы зафиксированы, медленно опускайте корпус вперёд, удерживая прямую линию."],
    [/обратн.*выпад/, "Шаг назад, опускайтесь до 90° в обоих коленях, корпус вертикально, упор на переднюю ногу."],
    [/реверанс/, "Шаг по диагонали назад крест-накрест, опускайтесь в выпад, корпус прямой."],
    [/зашагив|шагив/, "Полная стопа на возвышение, толчок передней ногой (не задней), полное разгибание сверху."],
    [/лучник/, "Опускаясь, переносите вес на одну руку, вторая прямая в сторону. Чередуйте стороны."],
    [/плиомет|хлопк/, "Резко выталкивайте корпус вверх, оторвав ладони от пола, мягко приземляйтесь."],
    [/стойка на рук.*стен.*удерж/, "Ладони на ширине плеч, тело прямое, удерживайте равновесие, дышите ровно."],
    [/отжим.*стойк.*на рук/, "В стойке у стены опускайте макушку к полу, локти под 45°."],
    [/лягушач.*мост/, "Стопы вместе, колени в стороны, поднимайте таз сжимая ягодицы."],
    [/раковин|clamshell/, "Лёжа на боку, колени согнуты, поднимайте верхнее колено, не разворачивая таз."],
    [/махи.*в сторон.*лёж/, "Лёжа на боку, поднимайте прямую верхнюю ногу до 45°, контролируя движение."],
    [/y-t-w|y\sтаз/, "Лёжа на животе, поднимайте руки в форме букв Y, T, W, сводя лопатки."],
    [/птица.*собак|bird ?dog/, "На четвереньках, одновременно вытягивайте противоположные руку и ногу, удерживайте 2 сек."],
    [/полая|hollow/, "Лёжа на спине, поясница прижата, поднимайте плечи и прямые ноги, удерживайте позу."],
    [/планк.*подъём.*ног|планк.*ног.*возвыш/, "В планке поочерёдно поднимайте прямую ногу, таз не вращайте."],
    [/боков.*планк.*подъём.*таз/, "В боковой планке опускайте и поднимайте таз, контролируя движение."],
    [/касан.*носк/, "Лёжа на спине, прямые ноги вверх, тянитесь руками к носкам, отрывая лопатки."],
    [/изометр.*полотенц/, "Полотенце под стопу, тяните его на себя силой бицепса, удерживайте натяжение 20–40 сек."],
    [/концентр.*бицепс/, "Сидя, локоть упирается во внутреннюю сторону бедра, поднимайте гантель строго бицепсом."],
    [/наклон.*скам.*бицепс|бицепс.*наклон.*скам/, "Сидя на наклонной скамье, руки полностью свисают, поднимайте гантели бицепсом."],
    [/цоттман|зоттман/, "Поднимаете как обычный бицепс, в верхней точке разворачиваете кисти и опускаете «молотком»."],
    [/кикбэк|kickback/, "Корпус параллельно полу, плечо прижато, разгибайте только в локте, фиксируя кисть."],
    [/череп|skullcrush/, "Лёжа, локти зафиксированы вертикально, опускайте снаряд ко лбу, не разводя локти."],
    [/из-за головы.*гантел|разгиб.*из-за головы/, "Гантель/штангу за голову, локти зафиксированы у головы, разгибаете только в локтевом суставе."],
    [/пуловер.*блок|прям.*рук.*блок/, "Стоя у блока, прямые руки тянут гриф вниз вдоль корпуса широчайшими."],
    [/пуловер/, "Лёжа поперёк скамьи, прямые руки с гантелью опускайте за голову, растягивая широчайшие."],
    [/гуд.*морнинг|good.?morning/, "Штанга на плечах, спина прямая, наклон с ровной спиной до параллели, толчок ягодицами обратно."],
    [/сумо.*стано|стано.*сумо/, "Ноги шире плеч, носки развёрнуты, хват внутри ног, тяга вертикально вверх."],
    [/снэтч|снетч|плинт/, "Широкий хват, тяга с возвышения, спина прямая, толчок ногами."],
    [/тяг.*т-?гриф|т-?гриф/, "Ноги по бокам грифа, наклон 45°, тяните рукоять к низу живота, лопатки сводим."],
    [/перевёрнут.*тяг.*обратн.*хват|тяг.*обратн.*хват.*стол|под столом/, "Лягте на пол под устойчивым столом, возьмитесь за край стола хватом снизу (ладони к себе) на ширине плеч. Тело прямое, пятки на полу. Подтягивайте грудь к краю стола, сводя лопатки и держа локти близко к корпусу. Стол должен быть тяжёлым/упёртым в стену, чтобы не опрокинулся."],
    [/тяг.*обратн.*хват/, "Тяга штанги к поясу хватом снизу, локти прижаты, активная работа широчайших."],
    [/шраг.*штанг/, "Штанга в опущенных руках, поднимайте плечи строго вверх, без вращения."],
    [/тяг.*подбородк/, "Хват уже плеч, тяните штангу вдоль корпуса до уровня груди, локти выше кистей."],
    [/арнольд/, "Гантели у груди ладонями к себе → жим вверх с разворотом, в верхней точке ладони от себя."],
    [/перед собой|подъём.*перед/, "Поднимайте гантель перед собой до уровня плеч, локоть слегка согнут."],
    [/жим.*из-за головы.*шт/, "Сидя, штанга на плечах сзади, выжимайте строго вверх, не сводя лопатки до конца."],
    [/жим.*тренаж.*плеч|тренаж.*для плеч/, "Спина плотно прижата, выжимайте рукояти строго вверх, не разгибая локти до конца."],
    [/жим.*тренаж.*груд|тренаж.*сид.*для груд/, "Спина прижата, рукояти на уровне груди, жим вперёд, контроль возврата."],
    [/бабочк.*обратн|rear ?delt|обратн.*бабочк/, "Сидя лицом к спинке, разводите рукояти в стороны до сведения лопаток сзади."],
    [/бабочк|пек.?дек/, "Локти на уровне плеч, сводите подушки перед грудью, чувствуя сокращение грудных."],
    [/махи.*в стороны.*блок|махи.*в сторон.*блок|махи.*блок/, "В блоке стоя боком, поднимайте рукоять в сторону до уровня плеча."],
    [/махи.*назад.*кросс/, "В нижнем блоке стоя, отводите ногу назад, сжимая ягодицу в верхней точке."],
    [/отвед.*бедр.*тренаж/, "Сидя в тренажёре, разводите бёдра в стороны, пауза в верхней точке."],
    [/скамь.*скотт|скотт/, "Локти упираются в подушку, поднимайте снаряд бицепсом без раскачки корпуса."],
    [/нижн.*блок.*бицепс|бицепс.*нижн.*блок/, "Стоя у блока, локти прижаты к корпусу, поднимайте рукоять бицепсом."],
    [/трицепс.*канат|канат.*рукоят/, "Локти прижаты к корпусу, разгибайте руки и в нижней точке разводите канат в стороны."],
    [/трицепс.*из-за головы.*блок/, "Лицом от блока, гриф за головой, разгибайте руки строго в локтях."],
    [/трицепс.*рукоят|трицепс.*блок|трицепс.*пряма/, "Локти прижаты к корпусу, разгибайте только в локтевом суставе, без помощи плеча."],
    [/тяг.*верхн.*блок.*обратн/, "Хват чуть уже плеч ладонями к себе, тяните гриф к верху груди, локти вниз."],
    [/тяг.*резинк.*сверх/, "Сидя на полу, резинка над собой, тяните вниз и в стороны, сводя лопатки."],
    [/жим.*тренаж|жим в тренажёр/, "Спина прижата, контролируемое движение по полной амплитуде."],
    [/жим.*гир.*стоя/, "Гиря на плече («рекомпозиция»), выжимаете строго вверх, корпус напряжён."],
    [/тяг.*гир.*наклон/, "Свободная рука на опоре, тяните гирю к поясу, локоть вдоль корпуса."],
    [/стано.*с гир|стано.*гир/, "Гиря между стоп, спина прямая, поднимайте за счёт ног и тяги бёдрами."],
    [/нейтрал.*хват|параллел.*хват/, "Хват ладонями друг к другу, тяните до касания перекладины верхом груди."],
    [/широк.*хват.*подтя|подтя.*широк/, "Хват шире плеч, тянитесь грудью к перекладине, активно сводя лопатки."],
    [/австралийск/, "Тело прямое под низкой перекладиной, тяните грудь к грифу, лопатки сводим."],
    [/EZ|еz|ез-штанг/, "EZ-гриф уменьшает нагрузку на запястья, в остальном техника как обычного бицепса со штангой."],
    [/трицепс.*брус|брус.*вертикал|брус.*трицепс/, "На брусьях держите корпус вертикально, опускайтесь только за счёт сгибания локтей."],
    [/эйрбайк|assault/, "Работают руки и ноги, удерживайте равномерный темп, спина прямая."],
    [/шэдоу|тень/, "Имитация боя: лёгкие шаги, удары без полного выпрямления, защита поднята."],
    [/сгиб.*ног.*стоя.*резинк/, "Стоя, резинка на щиколотке, сгибайте ногу в колене, тяните пятку к ягодице."],
    [/разгиб.*резинк.*вниз/, "Резинка над головой, локти прижаты, разгибайте руки вниз только в локтях."],
    [/тренаж.*для груд.*бабочк|сведен.*бабочк/, "Локти на уровне плеч, сводите подушки перед грудью."],
    [/мост.*штанг|hip ?thrust/, "Лопатки на скамье, штанга на тазу, поднимайте таз до прямой линии корпус-бёдра."],
    [/чест.*support|тяг.*наклон.*скам|тяг.*на наклон/, "Лёжа грудью на наклонной скамье, тяните гантели к поясу, локти вдоль корпуса."],
    [/носки.*на одной/, "Стоя на одной ноге у опоры, поднимайтесь на носок максимально высоко."],
    [/носки.*тренаж|икры.*тренаж|подъём на носк.*тренаж/, "Плечи под валиками, поднимайтесь на носки максимально, в верхней точке пауза."],

    [/берпи/, "Присед → упор лёжа → отжимание → прыжок вверх с хлопком. Спина прямая."],
    [/прыж.* присед/, "Присед до параллели → взрывной прыжок вверх → мягкое приземление на полусогнутые."],
    [/запрыгив/, "Полуприсед → мощный прыжок на возвышение, мягко приземляйтесь, спина прямая."],
    [/конькобеж|skater/, "Прыжок в сторону на одну ногу, вторая уходит за опорную, корпус слегка наклонён."],
    [/скакалк/, "Прыгайте на носках, локти прижаты, кисти крутят верёвку, колени слегка согнуты."],
    [/высокие колени/, "Бег на месте с подъёмом колен до уровня пояса, активно работайте руками."],
    [/захлёст/, "Бег на месте, пятками старайтесь коснуться ягодиц."],
    [/джампинг|jumping jack/, "Прыжком расставляйте ноги в стороны, руки поднимайте над головой."],
    [/скалолаз|альпинист/, "Упор лёжа, поочерёдно подтягивайте колени к груди в быстром темпе."],
    [/гоблет.*присед|присед.*гирей|присед.*гантел/, "Гантель/гиря у груди, локти вниз, присед до параллели бёдер с полом, колени по носкам."],
    [/присед.*штанг|фронтальн.*присед/, "Штанга на трапециях (или на плечах), спина прямая, присед до параллели, колени по носкам."],
    [/присед.*сумо/, "Ноги шире плеч, носки развёрнуты, присед глубокий, колени смотрят в стороны."],
    [/присед/, "Ноги на ширине плеч, таз отводим назад, спина прямая, колени по линии носков."],
    [/болгар/, "Задняя нога на возвышении, опорная впереди, опускайтесь до прямого угла в колене."],
    [/выпад/, "Шаг вперёд, опускайтесь до прямого угла в обоих коленях, спина вертикальная."],
    [/пистолет/, "Присед на одной ноге, вторая вытянута вперёд, держите равновесие, спина прямая."],
    [/носки/, "Поднимайтесь на носки максимально высоко, на секунду фиксируйте верхнюю точку."],
    [/мост.*одной/, "Лёжа, одна нога на полу, вторая прямая. Поднимайте таз, выжимая ягодицу опорной ноги."],
    [/мост|ягодич/, "Лёжа на спине, стопы у таза. Поднимайте таз, сжимая ягодицы в верхней точке."],
    [/гидрант/, "Стоя на четвереньках, отводите согнутую ногу в сторону, не разворачивая корпус."],
    [/мах.*ног.*назад|махи ногой/, "На четвереньках, толкайте пятку в потолок, не прогибая поясницу."],
    [/отжим.*колен/, "Колени на полу, корпус прямой от головы до колен, локти под 45°."],
    [/алмазн/, "Ладони вместе под грудью (большие пальцы образуют ромб), локти вдоль корпуса."],
    [/щука/, "Таз высоко, тело перевёрнутая буква V. Опускайте макушку к полу между руками."],
    [/отжим.*брус/, "На брусьях, корпус слегка наклонён вперёд, локти назад, опускайтесь до 90° в локте."],
    [/обратн.*отжим|стула/, "Сядьте спиной к опоре, руки на краю, опускайте таз сгибая локти до 90°."],
    [/отжим/, "Корпус прямой, ладони чуть шире плеч, локти под 45°, опускайтесь грудью к полу."],
    [/жим.*штанг.*угл/, "Скамья под 30°, штангу опускаем к верху груди, локти под 45°."],
    [/жим.*штанг/, "Лопатки сведены, опускайте штангу к нижней части груди, локти под 45°."],
    [/жим гантел.*лёж|жим гантел.*пол/, "Гантели над грудью, опускайте до уровня груди, локти под 45°."],
    [/разводк/, "Слегка согнутые локти, опускайте гантели по дуге до уровня груди, сводите грудью."],
    [/жим гантел.*сид|жим гантел.*сто|армейск/, "Гантели/штанга у плеч, выжимаете вверх, не разгибая локти до конца."],
    [/жим резинк.*груд/, "Резинка за спиной, выжимаете руки вперёд, удерживая натяжение."],
    [/жим резинк.*голов/, "Резинка под стопами, выжимаете руки над головой строго вверх."],
    [/мах.*сторон/, "Слегка согнутые локти, поднимайте гантели до уровня плеч, мизинцы выше больших пальцев."],
    [/мах.*наклон/, "Наклон корпуса 45°, разводите гантели в стороны до уровня плеч."],
    [/тяга.*пояс|горизонтальн.*тяга/, "Лопатки сводим, тянем рукоятку к низу живота, локти вдоль корпуса."],
    [/тяга.*верхн.*блок/, "Лопатки опустили, тянем гриф к верху груди, локти идут вниз и к бокам."],
    [/тяга.*лиц/, "Тяните рукоять к лицу, локти высоко, разводя руки в стороны."],
    [/раскрытие/, "Резинка натянута перед грудью, разводите руки в стороны, сводя лопатки."],
    [/тяга.*наклон|тяга гантел/, "Корпус параллельно полу, спина прямая, тяните локоть назад вдоль корпуса."],
    [/становая/, "Гриф над серединой стопы, спина прямая, толкайте пол ногами, тяните штангу вдоль ног."],
    [/румынск/, "Ноги почти прямые, таз отводим назад, опускаем снаряд вдоль ног до лёгкого растяжения бицепса бедра."],
    [/подтягиван.*обратн/, "Хват на ширине плеч ладонями к себе, тянитесь подбородком выше перекладины."],
    [/подтягиван/, "Хват чуть шире плеч, лопатки сведены, тянитесь грудью к перекладине."],
    [/австралийск/, "Тело прямое под низкой перекладиной, тяните грудь к грифу, лопатки сводим."],
    [/бицепс|молотк|подъём.*бицепс|подъём гантел/, "Локти прижаты к корпусу, поднимайте снаряд силой бицепса, без раскачки."],
    [/трицепс|француз|узким хват/, "Локти зафиксированы возле головы (или у корпуса), движение только в локтевом суставе."],
    [/шраг/, "Поднимайте плечи строго вверх, без вращения, в верхней точке короткая пауза."],
    [/планка.*касан|планка.*плеч/, "В планке поочерёдно касайтесь рукой противоположного плеча, таз не вращайте."],
    [/боков.*планк/, "Тело прямой линией на одной руке/предплечье, таз не провисает."],
    [/планк/, "Тело прямой линией от пяток до затылка, пресс и ягодицы напряжены, не прогибайте поясницу."],
    [/мёртв.*жук/, "Лёжа, поочерёдно опускайте противоположные руку и ногу, поясница прижата к полу."],
    [/велосипед/, "Лёжа, поочерёдно тянитесь локтем к противоположному колену."],
    [/русск.*скруч/, "Сидя, корпус назад под 45°, скручивайте корпус с касанием руками пола сбоку."],
    [/v-up|складк/, "Лёжа, одновременно поднимайте корпус и прямые ноги, тянитесь руками к стопам."],
    [/обратн.*скруч/, "Лёжа, подкручивайте таз к рёбрам, поднимая ноги от пола."],
    [/скручиван/, "Лёжа, отрывайте лопатки от пола за счёт пресса, поясница прижата."],
    [/подъём.*ног.*вис|подъём.*колен.*вис/, "Вис на турнике, поднимайте ноги/колени к груди, без раскачки."],
    [/подъём.*ног.*лёж/, "Лёжа, поднимайте прямые ноги до 90°, поясница прижата к полу."],
    [/уголок/, "Удерживайте прямые ноги под 90° к корпусу в упоре, носки тяните на себя."],
    [/суперм|лодочк/, "Лёжа на животе, одновременно отрывайте руки и ноги от пола, удерживайте 1–2 сек."],
    [/гиперэкстенз/, "Лёжа на животе, поднимайте ноги вверх, сжимая ягодицы."],
    [/мах.*гир|свинг/, "Снаряд между ног, толчком таза выводите его до уровня плеч, руки расслаблены."],
    [/турецк/, "Сложное движение из положения лёжа в стойку с гантелью над головой — изучайте по видео."],
    [/беговая|бег.*месте/, "Спина прямая, лёгкий наклон вперёд, активно работайте руками."],
    [/гребн/, "Толчок ногами → наклон корпуса → тяга руками к низу живота. Возврат в обратном порядке."],
    [/эллипс|велотрен/, "Сохраняйте равномерный темп и осанку, не наваливайтесь на руки."],
    [/боков.*шаг|краб/, "Резинка над коленями, полуприсед, шагайте в сторону, удерживая натяжение."],
    [/отвед.*бедр|отвед.*резинк|подъём.*прям.*ног/, "Отводите ногу в сторону / вверх, не прогибая поясницу."],
    [/жим ног/, "Стопы на платформе, опускайте до прямого угла в колене, не отрывайте таз."],
    [/разгибан.*ног/, "Сидя в тренажёре, разгибайте ноги до прямой линии, в верхней точке пауза."],
    [/сгибан.*ног/, "Лёжа/сидя в тренажёре, тяните пятки к ягодицам, контролируйте обратное движение."],
    [/сведен.*кроссов/, "Слегка согнутые локти, сводите рукоятки перед грудью, чувствуя грудные."],
    [/трицепс.*блок/, "Локти прижаты к корпусу, разгибайте только в локтевом суставе."],
  ];

  for (const [pattern, cue] of rules) {
    if (pattern.test(n)) return cue;
  }
  return "Контролируйте технику и дыхание: выдох на усилии, вдох на возврате.";
}

function videoUrlFor(name: string): string {
  const q = encodeURIComponent(`${name} техника выполнения`);
  return `https://www.youtube.com/results?search_query=${q}`;
}

// Возрастная корректировка объёма тренировки
function adjustVolumeForAge(base: string, age: number): string {
  if (age >= 65) {
    // Снижаем подходы и удлиняем отдых
    return base
      .replace(/^5 подходов/, "3 подхода")
      .replace(/^4 подхода/, "3 подхода")
      .replace(/12–15 повторений/, "8–10 повторений")
      .replace(/10–12 повторений/, "8–10 повторений")
      .replace(/отдых.*30 сек/, "отдых между подходами 90 сек")
      .replace(/отдых.*45 сек/, "отдых между подходами 90 сек")
      .replace(/отдых.*60 сек/, "отдых между подходами 90 сек");
  }
  if (age >= 55) {
    return base
      .replace(/^5 подходов/, "4 подхода")
      .replace(/12–15 повторений/, "10–12 повторений")
      .replace(/отдых.*30 сек/, "отдых между подходами 60 сек");
  }
  if (age < 16) {
    // Подростки — без больших весов, акцент на технику
    return base
      .replace(/^5 подходов/, "3 подхода")
      .replace(/^4 подхода/, "3 подхода")
      .replace(/12–15 повторений/, "10–12 повторений");
  }
  return base;
}

function setsFor(ex: Exercise, level: Level, age: number): string {
  let base: string;
  if (ex.cardio) base = cardioByLevel[level];
  else if (ex.muscle === "core" && (ex.name === "Планка" || ex.name === "Боковая планка"))
    base = isometricByLevel[level];
  else base = setsByLevel[level];
  return adjustVolumeForAge(base, age);
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
    strength: ["legs", "chest", "back", "shoulders", "biceps", "triceps", "core", "glutes"],
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
  restBetween: string;
  focusLabel?: string;
  focusNote?: string;
}

// =====================================================================
//                    ИСТОРИЯ ТРЕНИРОВОК (для не-повторения)
// =====================================================================

const HISTORY_KEY_BASE = "wg_history_v1";
const PROFILES_KEY = "wg_profiles_v1";
const ACTIVE_PROFILE_KEY = "wg_active_profile_v1";
const REGEN_WINDOW_MS = 30 * 60 * 1000; // 30 минут — окно «регенерации», не считаем

interface HistoryEntry {
  ts: number;
  muscles: Muscle[];
  focus?: string;
}

// ---- Локальные профили пользователей (на устройстве) ----
//
// Идея: в приложении может быть несколько «пользователей» (например, муж/жена).
// Каждый профиль — это имя + свой ключ хранилища истории.
// Никакого облака, никакой регистрации. Всё лежит в localStorage.

export interface Profile {
  id: string;
  name: string;
  createdAt: number;
}

const historyListeners = new Set<() => void>();
const profileListeners = new Set<() => void>();

export function subscribeHistory(cb: () => void): () => void {
  historyListeners.add(cb);
  return () => {
    historyListeners.delete(cb);
  };
}

export function subscribeProfiles(cb: () => void): () => void {
  profileListeners.add(cb);
  return () => {
    profileListeners.delete(cb);
  };
}

function notifyHistory() {
  historyListeners.forEach((l) => l());
}

function notifyProfiles() {
  profileListeners.forEach((l) => l());
  // Смена профиля = смена видимой истории
  notifyHistory();
}

export function listProfiles(): Profile[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PROFILES_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as Profile[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeProfiles(arr: Profile[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PROFILES_KEY, JSON.stringify(arr));
  } catch {}
}

export function getActiveProfileId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACTIVE_PROFILE_KEY);
}

export function getActiveProfile(): Profile | null {
  const id = getActiveProfileId();
  if (!id) return null;
  return listProfiles().find((p) => p.id === id) ?? null;
}

export function setActiveProfile(id: string | null) {
  if (typeof window === "undefined") return;
  if (id === null) {
    window.localStorage.removeItem(ACTIVE_PROFILE_KEY);
  } else {
    window.localStorage.setItem(ACTIVE_PROFILE_KEY, id);
  }
  notifyProfiles();
}

export function createProfile(rawName: string): Profile {
  const name = rawName.trim();
  if (!name) throw new Error("Введите имя");
  if (name.length > 40) throw new Error("Слишком длинное имя (макс. 40 символов)");
  const list = listProfiles();
  if (list.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
    throw new Error("Профиль с таким именем уже есть");
  }
  const profile: Profile = {
    id: `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    name,
    createdAt: Date.now(),
  };

  // Однократная миграция: если это первый профиль и есть «общая» история
  // от старой версии приложения — переносим её в этот профиль.
  if (list.length === 0 && typeof window !== "undefined") {
    try {
      const legacy = window.localStorage.getItem(HISTORY_KEY_BASE);
      if (legacy) {
        window.localStorage.setItem(`${HISTORY_KEY_BASE}:${profile.id}`, legacy);
        window.localStorage.removeItem(HISTORY_KEY_BASE);
      }
    } catch {}
  }

  writeProfiles([...list, profile]);
  setActiveProfile(profile.id);
  return profile;
}

export function renameProfile(id: string, rawName: string) {
  const name = rawName.trim();
  if (!name) throw new Error("Введите имя");
  if (name.length > 40) throw new Error("Слишком длинное имя (макс. 40 символов)");
  const list = listProfiles();
  if (list.some((p) => p.id !== id && p.name.toLowerCase() === name.toLowerCase())) {
    throw new Error("Профиль с таким именем уже есть");
  }
  writeProfiles(list.map((p) => (p.id === id ? { ...p, name } : p)));
  notifyProfiles();
}

export function deleteProfile(id: string) {
  if (typeof window === "undefined") return;
  const list = listProfiles().filter((p) => p.id !== id);
  writeProfiles(list);
  // Удаляем историю этого профиля
  try {
    window.localStorage.removeItem(`${HISTORY_KEY_BASE}:${id}`);
  } catch {}
  // Если удалили активный — переключаем на первый из оставшихся (или сбрасываем)
  if (getActiveProfileId() === id) {
    setActiveProfile(list[0]?.id ?? null);
  } else {
    notifyProfiles();
  }
}

// ---- Чтение / запись истории по активному профилю ----

function historyKey(): string | null {
  const id = getActiveProfileId();
  return id ? `${HISTORY_KEY_BASE}:${id}` : null;
}

function readLocal(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  const key = historyKey();
  if (!key) return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const arr = JSON.parse(raw) as HistoryEntry[];
    const cutoff = Date.now() - 14 * 24 * 3600 * 1000;
    return arr.filter((e) => e.ts > cutoff).slice(-20);
  } catch {
    return [];
  }
}

function writeLocal(arr: HistoryEntry[]) {
  if (typeof window === "undefined") return;
  const key = historyKey();
  if (!key) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(arr.slice(-20)));
  } catch {}
}

function loadHistory(): HistoryEntry[] {
  return readLocal();
}

function saveHistoryEntry(muscles: Muscle[], focus?: string) {
  if (typeof window === "undefined") return;
  if (!historyKey()) return; // нет активного профиля — не пишем
  try {
    const arr = readLocal();
    arr.push({ ts: Date.now(), muscles, focus });
    writeLocal(arr);
    notifyHistory();
  } catch {}
}

export function clearWorkoutHistory() {
  if (typeof window === "undefined") return;
  const key = historyKey();
  if (!key) return;
  try {
    window.localStorage.removeItem(key);
    notifyHistory();
  } catch {}
}

export interface FullHistoryEntry {
  ts: number;
  date: string; // ISO YYYY-MM-DD
  dayLabel: string;
  focus: string;
  muscles: string[];
}

const ruWeekdays = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
const ruMonths = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];

export function getFullHistory(): FullHistoryEntry[] {
  const entries = loadHistory();
  // Группируем по дню, оставляя последнюю запись дня (после окна регенерации)
  const byDay = new Map<string, HistoryEntry>();
  for (const e of entries) {
    const d = new Date(e.ts);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    byDay.set(key, e);
  }
  return Array.from(byDay.entries())
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([date, e]) => {
      const d = new Date(e.ts);
      return {
        ts: e.ts,
        date,
        dayLabel: `${ruWeekdays[d.getDay()]}, ${d.getDate()} ${ruMonths[d.getMonth()]}`,
        focus: e.focus ?? "Тренировка",
        muscles: e.muscles,
      };
    });
}

// Сколько отдельных дней с тренировками за последние N дней
export function trainingDaysInLast(days: number): number {
  const cutoff = Date.now() - days * 24 * 3600 * 1000;
  const entries = loadHistory().filter((e) => e.ts > cutoff);
  const set = new Set<string>();
  for (const e of entries) {
    const d = new Date(e.ts);
    set.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
  }
  return set.size;
}

export function getHistorySummary(): { lastFocus?: string; lastWhen?: string } {
  const arr = loadHistory();
  // Берём последнюю запись СТАРШЕ окна регенерации
  const cutoff = Date.now() - REGEN_WINDOW_MS;
  for (let i = arr.length - 1; i >= 0; i--) {
    if (arr[i].ts <= cutoff) {
      const ageH = (Date.now() - arr[i].ts) / 3600 / 1000;
      const lastWhen =
        ageH < 24
          ? `${Math.round(ageH)} ч назад`
          : `${Math.floor(ageH / 24)} дн назад`;
      return { lastFocus: arr[i].focus, lastWhen };
    }
  }
  return {};
}

// Классический сплит Push / Pull / Ноги.
// Бицепс и трицепс строго разделены, чтобы не было трицепса на тягу
// и бицепса на жим (это нарушает принцип сплита).
const FOCUS_TEMPLATES: Array<{
  label: string;
  primary: Muscle[];
  filler: Muscle[];
}> = [
  { label: "Push — грудь, плечи, трицепс", primary: ["chest", "shoulders", "triceps"], filler: ["core"] },
  { label: "Pull — спина, бицепс", primary: ["back", "biceps"], filler: ["core"] },
  { label: "Ноги — квадрицепс, ягодицы", primary: ["legs", "glutes"], filler: ["core"] },
];

// Сворачиваем подряд идущие записи в окне регенерации в одну (последнюю)
function effectiveHistory(): HistoryEntry[] {
  const all = loadHistory();
  const collapsed: HistoryEntry[] = [];
  for (const e of all) {
    const last = collapsed[collapsed.length - 1];
    if (last && e.ts - last.ts < REGEN_WINDOW_MS) {
      collapsed[collapsed.length - 1] = e;
    } else {
      collapsed.push(e);
    }
  }
  return collapsed;
}

function recentMuscleSet(): Set<Muscle> {
  // Последние 2 «реальные» сессии (с учётом сворачивания регенераций)
  const recent = effectiveHistory().slice(-2);
  const set = new Set<Muscle>();
  recent.forEach((e) => e.muscles.forEach((m) => set.add(m)));
  return set;
}

export function generateWorkout(f: FormData): WorkoutResult {
  // Прыжковые исключаем для 50+, при весе >100 кг или их сочетании
  const excludeJumps = f.age >= 50 || f.weight >= 100;
  // Очень пожилым (70+) и очень тяжёлым (>130) убираем все ударные движения
  const seniorMode = f.age >= 65;

  const pool = EXERCISES.filter((e) => {
    if (!isAllowed(e, f, excludeJumps)) return false;
    if (seniorMode && (e.cardio || e.muscle === "fullbody")) {
      // оставляем только мягкие кардио (велотренажёр, эллипсоид, ходьба)
      const soft = /эллипс|велотрен|беговая|бег.*месте/i.test(e.name);
      if (e.cardio && !soft) return false;
    }
    return true;
  });

  // Целевое количество упражнений: 5–6, для 65+ снижаем до 4–5
  const target = seniorMode
    ? Math.random() < 0.5 ? 4 : 5
    : Math.random() < 0.5 ? 5 : 6;

  // ---- ВЫБОР ФОКУСА С УЧЁТОМ ИСТОРИИ ----
  // Каждая тренировка — конкретный сплит (жим / тяга / ноги).
  // Это даёт правильное чередование: сегодня ноги — завтра жим или тяга.
  const recent = recentMuscleSet();
  let focusLabel: string | undefined;
  let focusNote: string | undefined;
  let picked: Exercise[];

  // Фокус считаем валидным только если в пуле есть хотя бы по одному
  // упражнению на КАЖДУЮ основную мышцу (иначе заголовок врёт).
  const scored = FOCUS_TEMPLATES.map((t) => {
    const perMuscleCount = t.primary.map((m) =>
      pool.filter((e) => e.muscle === m).length,
    );
    return {
      t,
      overlap: t.primary.filter((m) => recent.has(m)).length,
      poolMatch: pool.filter((e) => t.primary.includes(e.muscle)).length,
      hasAllPrimary: perMuscleCount.every((c) => c >= 1),
    };
  }).filter((s) => s.hasAllPrimary && s.poolMatch >= 3);

  if (scored.length === 0) {
    // Пул маленький (например, дома без инвентаря) — берём общую балансированную
    picked = pickBalanced(pool, f.goal, Math.min(target, pool.length));
    focusLabel = "Всё тело";
    focusNote = "Доступных упражнений мало — собрали общую тренировку.";
  } else {
    scored.sort((a, b) => a.overlap - b.overlap || b.poolMatch - a.poolMatch);
    // Среди вариантов с минимальным пересечением — случайный выбор
    const minOverlap = scored[0].overlap;
    const candidates = scored.filter((s) => s.overlap === minOverlap);
    const choice = candidates[Math.floor(Math.random() * candidates.length)];

    picked = pickForSession(
      pool,
      choice.t.primary,
      Math.min(target, pool.length),
      choice.t.filler,
    );

    // Заголовок строим из фактически отобранных основных мышц, а не из шаблона.
    const usedPrimary = choice.t.primary.filter((m) =>
      picked.some((e) => e.muscle === m),
    );
    const prefix = choice.t.label.split(" — ")[0];
    focusLabel =
      usedPrimary.length > 0
        ? `${prefix} — ${usedPrimary.map((m) => muscleLabel[m]).join(", ").toLowerCase()}`
        : choice.t.label;

    if (recent.size === 0) {
      focusNote = "Первая тренировка — выбран случайный фокус. Завтра предложим другие группы мышц.";
    } else if (minOverlap === 0) {
      focusNote = "Эти мышцы давно не работали — они отдохнули и готовы к нагрузке.";
    } else {
      focusNote = "Все группы тренировались недавно — взяли с минимальным пересечением.";
    }

    // Для жиросжигания/выносливости гарантируем 1 кардио в конце
    if (f.goal === "fatburn" || f.goal === "endurance") {
      const hasCardio = picked.some((e) => e.cardio);
      if (!hasCardio && picked.length > 0) {
        const cardio = shuffle(pool).find(
          (e) => e.cardio && !picked.some((p) => p.name === e.name),
        );
        if (cardio) picked[picked.length - 1] = cardio;
      }
    }
  }

  const exercises: ExerciseOut[] = picked.map((ex) => ({
    name: ex.name,
    sets: setsFor(ex, f.level, f.age),
    muscle: muscleLabel[ex.muscle],
    weight: recommendWeight(ex, f),
    cue: cueFor(ex.name),
    videoUrl: videoUrlFor(ex.name),
  }));

  // Калории: расчёт по MET-методу (компендиум Ainsworth)
  // ккал = MET × 3.5 × вес / 200 × минуты
  // MET для силовой ~4.5, кардио ~7, жиросжигания (HIIT-формат) ~6
  const baseMET =
    f.goal === "endurance" ? 7.0 : f.goal === "fatburn" ? 6.0 : 4.5;
  const levelMul = { beginner: 0.9, intermediate: 1.0, advanced: 1.15 }[f.level];
  const ageMul = ageMetabolismFactor(f.age);
  const calories = Math.round(
    (baseMET * 3.5 * f.weight) / 200 * f.duration * levelMul * ageMul,
  );

  // Сводка по задействованным группам
  const muscles = Array.from(new Set(picked.map((e) => muscleLabel[e.muscle])));
  const summary = muscles.join(" · ");

  // Предупреждения по возрасту и весу
  const warnings: string[] = [];

  if (f.age >= 70) {
    warnings.push(
      "Возраст 70+: тренируйтесь только после консультации с врачом. Контролируйте давление и пульс, делайте паузы при головокружении.",
    );
  } else if (f.age >= 60) {
    warnings.push(
      "Возраст 60+: разминка 10–15 минут обязательна. Избегайте задержки дыхания (приём Вальсальвы) при работе с весами.",
    );
  } else if (f.age >= 50) {
    warnings.push(
      "Возраст 50+: уделяйте внимание суставной разминке и мобильности. Прибавляйте веса медленно (~5% в месяц).",
    );
  }

  if (f.age < 16) {
    warnings.push(
      "До 16 лет: работа с предельными весами не рекомендуется. Фокус на технике, бодивейте и подвижности.",
    );
  } else if (f.age < 18) {
    warnings.push(
      "До 18 лет: избегайте максимальных весов (90%+ от 1ПМ). Работайте в диапазоне 8–12 повторений с запасом.",
    );
  }

  if (excludeJumps) {
    const reason =
      f.age >= 50 && f.weight >= 100
        ? "возраст 50+ и вес 100+ кг"
        : f.age >= 50
          ? "возраст 50+"
          : "вес 100+ кг";
    warnings.push(
      `Прыжковые и ударные упражнения исключены (${reason}) — берегите суставы.`,
    );
  }

  if (f.weight >= 120) {
    warnings.push(
      "Большой вес: используйте мягкое покрытие, выбирайте упражнения сидя/лёжа/у опоры. Избегайте бега и прыжков.",
    );
  } else if (f.weight >= 100) {
    warnings.push(
      "Вес 100+ кг: следите за техникой приседов и выпадов, не «заваливайте» колени внутрь.",
    );
  }

  if (f.age >= 50 && f.goal === "strength") {
    warnings.push(
      "После 50 веса снижены автоматически (~–15–25%) — это норма. Восстановление между тренировками 48–72 часа.",
    );
  }

  if (f.place === "home" && !f.homeDumbbells && !f.homeBands && f.goal === "strength") {
    warnings.push(
      "Силовая тренировка дома без инвентаря ограничена. Подключите гантели или резинки для большего эффекта.",
    );
  }

  // Советы
  const tips: string[] = [];
  const warmup =
    f.age >= 60 ? "10–15 минут" : f.age >= 45 ? "8–10 минут" : "5–10 минут";
  tips.push(`Перед тренировкой — разминка ${warmup} (суставная гимнастика).`);

  if (f.goal === "strength") {
    tips.push(
      f.age >= 50
        ? "Между тренировками одной группы мышц — 72 часа отдыха."
        : "Между тренировками одной группы мышц — 48 часов отдыха.",
    );
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
  if (f.age >= 50) {
    tips.push("Добавьте 1–2 раза в неделю упражнения на баланс и мобильность.");
  }
  if (f.level === "advanced") {
    tips.push("Раз в 6–8 недель устраивайте разгрузочную неделю.");
  } else {
    tips.push(
      f.age >= 60
        ? "Не тренируйтесь чаще 2–3 раз в неделю, давайте телу восстановиться."
        : "Не тренируйтесь чаще 3–4 раз в неделю на старте.",
    );
  }
  tips.push("После тренировки — заминка и растяжка 5 минут.");

  // Отдых между упражнениями (с учётом возраста)
  const restBetweenByLevel: Record<Level, string> = {
    beginner: "1.5–2 минуты",
    intermediate: "60–90 секунд",
    advanced: "45–60 секунд",
  };
  let restBetween = restBetweenByLevel[f.level];
  if (f.age >= 60) restBetween = "2–3 минуты (полное восстановление пульса)";
  else if (f.age >= 50) restBetween = "1.5–2.5 минуты";
  if (f.goal === "strength" && f.age < 50)
    restBetween += " (можно до 2–3 мин на тяжёлых базовых)";
  if (f.goal === "fatburn" && f.age < 55)
    restBetween = "30–60 секунд (держим пульс)";

  // Сохраняем сессию в историю (для следующего раза)
  const sessionMuscles = Array.from(new Set(picked.map((e) => e.muscle)));
  saveHistoryEntry(sessionMuscles, focusLabel);

  return {
    exercises,
    calories,
    warnings,
    tips,
    summary,
    restBetween,
    focusLabel,
    focusNote,
  };
}

// =====================================================================
//                          КУРС ТРЕНИРОВОК
// =====================================================================

export type CourseDays = 2 | 3 | 4 | 5;
export type CourseWeeks = 2 | 4 | 8 | 12;

export interface SessionPlan {
  day: number;
  weekday: string;
  type: string;
  exercises: ExerciseOut[];
}

export interface WeekPlan {
  week: number;
  phase: string;
  intensityPct: number;
  description: string;
  days: SessionPlan[];
}

export interface Course {
  weeks: WeekPlan[];
  totalSessions: number;
  daysPerWeek: number;
  weeksCount: number;
  splitName: string;
  generalTips: string[];
}

interface SplitSession {
  type: string;
  primary: Muscle[];
  filler: Muscle[];
}

const SPLITS: Record<CourseDays, { name: string; sessions: SplitSession[] }> = {
  2: {
    name: "Верх / Низ",
    sessions: [
      { type: "Верх (грудь, спина, плечи, бицепс, трицепс)", primary: ["chest", "back", "shoulders", "biceps", "triceps"], filler: ["core"] },
      { type: "Низ (ноги, ягодицы)", primary: ["legs", "glutes"], filler: ["core"] },
    ],
  },
  3: {
    name: "Push / Pull / Ноги",
    sessions: [
      { type: "Push — грудь, плечи, трицепс", primary: ["chest", "shoulders", "triceps"], filler: ["core"] },
      { type: "Pull — спина, бицепс", primary: ["back", "biceps"], filler: ["core"] },
      { type: "Ноги — квадрицепс, ягодицы", primary: ["legs", "glutes"], filler: ["core"] },
    ],
  },
  4: {
    name: "Верх / Низ × 2",
    sessions: [
      { type: "Верх 1 — push (грудь, плечи, трицепс)", primary: ["chest", "shoulders", "triceps"], filler: ["core"] },
      { type: "Низ 1 — квадрицепс-доминантный", primary: ["legs"], filler: ["glutes", "core"] },
      { type: "Верх 2 — pull (спина, бицепс)", primary: ["back", "biceps"], filler: ["core"] },
      { type: "Низ 2 — ягодицы-доминантный", primary: ["glutes"], filler: ["legs", "core"] },
    ],
  },
  5: {
    name: "Push / Pull / Ноги + Верх / Низ",
    sessions: [
      { type: "Push — грудь, плечи, трицепс", primary: ["chest", "shoulders", "triceps"], filler: ["core"] },
      { type: "Pull — спина, бицепс", primary: ["back", "biceps"], filler: ["core"] },
      { type: "Ноги — квадрицепс, ягодицы", primary: ["legs", "glutes"], filler: ["core"] },
      { type: "Верх (силовой акцент: грудь, спина, плечи)", primary: ["chest", "back", "shoulders"], filler: ["biceps", "triceps", "core"] },
      { type: "Низ (объёмный: ноги, ягодицы)", primary: ["legs", "glutes"], filler: ["core"] },
    ],
  },
};

const WEEKDAYS_BY_COUNT: Record<CourseDays, string[]> = {
  2: ["Понедельник", "Четверг"],
  3: ["Понедельник", "Среда", "Пятница"],
  4: ["Понедельник", "Вторник", "Четверг", "Пятница"],
  5: ["Понедельник", "Вторник", "Среда", "Пятница", "Суббота"],
};

interface PhaseModifier {
  phase: string;
  intensityPct: number;
  loadScale: number;
  description: string;
}

function phaseFor(weekIndex0: number): PhaseModifier {
  const inCycle = weekIndex0 % 4;
  switch (inCycle) {
    case 0:
      return {
        phase: "Втягивающая",
        intensityPct: 60,
        loadScale: 0.65,
        description: "Лёгкая неделя: разучиваем технику, веса 60% от рабочих.",
      };
    case 1:
      return {
        phase: "Рабочая",
        intensityPct: 80,
        loadScale: 0.85,
        description: "Базовая нагрузка, 80% от целевых рабочих весов.",
      };
    case 2:
      return {
        phase: "Пиковая",
        intensityPct: 100,
        loadScale: 1.0,
        description: "Максимальная неделя цикла: рабочие веса 100%, последний подход «до отказа».",
      };
    default:
      return {
        phase: "Разгрузочная",
        intensityPct: 50,
        loadScale: 0.5,
        description: "Восстановление: 2 подхода вместо 3–4, веса 50%, без отказа.",
      };
  }
}

// Подбор упражнений строго по группам мышц дня (для сплитовой тренировки).
// primary — основные мышцы дня, filler — допустимая добивка (например, кор).
// КЛЮЧЕВОЙ ПРИНЦИП: ни при каких условиях не берём упражнение, чья мышца
// не входит ни в primary, ни в filler. Лучше отдать тренировку короче,
// чем нарушить логику сплита (никаких ног на тяговый день).
function pickForSession(
  pool: Exercise[],
  primary: Muscle[],
  target: number,
  filler: Muscle[] = [],
): Exercise[] {
  const shuffled = shuffle(pool);
  const picked: Exercise[] = [];
  const usedNames = new Set<string>();
  const primarySet = new Set(primary);
  const fillerSet = new Set(filler);

  // 1) По одному упражнению на каждую основную группу — для покрытия всех мышц дня.
  for (const m of primary) {
    if (picked.length >= target) break;
    const found = shuffled.find((e) => e.muscle === m && !usedNames.has(e.name));
    if (found) {
      picked.push(found);
      usedNames.add(found.name);
    }
  }

  // 2) Добиваем основными группами (кроме последних 1–2 слотов под filler).
  const reserveForFiller = filler.length > 0 ? Math.min(2, target) : 0;
  while (picked.length < target - reserveForFiller) {
    const ex = shuffled.find(
      (e) => primarySet.has(e.muscle) && !usedNames.has(e.name),
    );
    if (!ex) break;
    picked.push(ex);
    usedNames.add(ex.name);
  }

  // 3) Добивка строго из разрешённых filler-групп.
  for (const m of filler) {
    if (picked.length >= target) break;
    const found = shuffled.find((e) => e.muscle === m && !usedNames.has(e.name));
    if (found) {
      picked.push(found);
      usedNames.add(found.name);
    }
  }

  // 4) Последний шанс заполнить пустые слоты — ТОЛЬКО из primary или filler,
  //    никаких посторонних мышц. Если упражнений в пуле не хватает —
  //    тренировка просто будет короче, и это правильно.
  for (const ex of shuffled) {
    if (picked.length >= target) break;
    if (usedNames.has(ex.name)) continue;
    if (primarySet.has(ex.muscle) || fillerSet.has(ex.muscle)) {
      picked.push(ex);
      usedNames.add(ex.name);
    }
  }

  // Кор — всегда в конец (как добивка), остальные — в начале.
  picked.sort((a, b) => {
    const aCore = a.muscle === "core" ? 1 : 0;
    const bCore = b.muscle === "core" ? 1 : 0;
    return aCore - bCore;
  });

  return picked;
}

export function generateCourse(
  f: FormData,
  weeksCount: CourseWeeks,
  daysPerWeek: CourseDays,
): Course {
  const excludeJumps = f.age >= 50 || f.weight >= 100;
  const seniorMode = f.age >= 65;

  const pool = EXERCISES.filter((e) => {
    if (!isAllowed(e, f, excludeJumps)) return false;
    if (seniorMode && e.cardio) {
      const soft = /эллипс|велотрен|беговая|бег.*месте/i.test(e.name);
      if (!soft) return false;
    }
    return true;
  });

  const split = SPLITS[daysPerWeek];
  const weekdays = WEEKDAYS_BY_COUNT[daysPerWeek];
  const targetExercises = seniorMode ? 4 : daysPerWeek >= 4 ? 5 : 6;

  const weeks: WeekPlan[] = [];
  for (let w = 0; w < weeksCount; w++) {
    const mod = phaseFor(w);
    const days: SessionPlan[] = split.sessions.map((s, i) => {
      const picked = pickForSession(
        pool,
        s.primary,
        Math.min(targetExercises, pool.length),
        s.filler,
      );
      const exercises: ExerciseOut[] = picked.map((ex) => ({
        name: ex.name,
        sets: setsFor(ex, f.level, f.age),
        muscle: muscleLabel[ex.muscle],
        weight: recommendWeight(ex, f, mod.loadScale),
        cue: cueFor(ex.name),
        videoUrl: videoUrlFor(ex.name),
      }));
      return {
        day: i + 1,
        weekday: weekdays[i] ?? `День ${i + 1}`,
        type: s.type,
        exercises,
      };
    });

    weeks.push({
      week: w + 1,
      phase: mod.phase,
      intensityPct: mod.intensityPct,
      description: mod.description,
      days,
    });
  }

  const generalTips: string[] = [
    `Курс рассчитан на ${weeksCount} ${weeksCount < 5 ? "недели" : "недель"} по ${daysPerWeek} тренировки в неделю — всего ${weeksCount * daysPerWeek} занятий.`,
    "Каждые 4 недели повторяется мезоцикл: втягивающая → рабочая → пиковая → разгрузочная. Это база периодизации (Матвеев, Bompa).",
    "Между тренировками одной группы мышц — минимум 48 часов (72 часа после 50 лет).",
    "Каждые 2 недели прибавляйте 2.5–5% к рабочему весу, если последний подход даётся легко.",
    "Если не получается выполнить запланированные повторения — оставайтесь на тех же весах ещё неделю.",
    "Веса в карточках указаны для пиковой недели (100%). На других неделях они автоматически пересчитаны по фазе.",
    "Раз в 8–12 недель давайте полную неделю отдыха или активного восстановления.",
  ];
  if (f.goal === "fatburn") {
    generalTips.push(
      "Для жиросжигания добавьте 2–3 кардио-сессии в неделю (низкая интенсивность 30–45 мин) в дни без силовой.",
    );
  }
  if (f.age >= 50) {
    generalTips.push(
      "После 50 лет особенно важна неделя восстановления — не пропускайте её, даже если чувствуете себя хорошо.",
    );
  }

  return {
    weeks,
    totalSessions: weeksCount * daysPerWeek,
    daysPerWeek,
    weeksCount,
    splitName: split.name,
    generalTips,
  };
}
