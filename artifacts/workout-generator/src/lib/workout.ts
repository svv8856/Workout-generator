export type Gender = "male" | "female";
export type Level = "beginner" | "intermediate" | "advanced";
export type Goal = "strength" | "endurance" | "fatburn";
export type Place = "home" | "gym" | "outdoor";

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

export interface Exercise {
  name: string;
  sets: string;
  jumping?: boolean;
  needsBar?: boolean;
  needsWeights?: boolean;
  outdoor?: boolean;
  needsDumbbells?: boolean;
  needsBands?: boolean;
}

const setsByLevel: Record<Level, string> = {
  beginner: "3 подхода × 8–10 повторений, отдых 60 сек",
  intermediate: "4 подхода × 10–12 повторений, отдых 45 сек",
  advanced: "5 подходов × 12–15 повторений, отдых 30 сек",
};

const cardioByLevel: Record<Level, string> = {
  beginner: "3 подхода × 30 сек, отдых 60 сек",
  intermediate: "4 подхода × 45 сек, отдых 45 сек",
  advanced: "5 подходов × 60 сек, отдых 30 сек",
};

function pool(goal: Goal, place: Place): Exercise[] {
  const list: Exercise[] = [];

  if (goal === "strength") {
    if (place === "home") {
      list.push(
        { name: "Приседания", sets: setsByLevel.beginner },
        { name: "Отжимания от пола", sets: setsByLevel.beginner },
        { name: "Выпады на месте", sets: setsByLevel.beginner },
        { name: "Обратные отжимания от стула", sets: setsByLevel.beginner },
        { name: "Ягодичный мост", sets: setsByLevel.beginner },
        { name: "Планка", sets: "3 подхода × 30–60 сек" },
      );
    } else if (place === "gym") {
      list.push(
        { name: "Приседания со штангой", sets: setsByLevel.beginner, needsBar: true },
        { name: "Жим штанги лёжа", sets: setsByLevel.beginner, needsBar: true },
        { name: "Тяга гантели в наклоне", sets: setsByLevel.beginner, needsWeights: true },
        { name: "Выпады с гантелями", sets: setsByLevel.beginner, needsWeights: true },
        { name: "Жим гантелей сидя", sets: setsByLevel.beginner, needsWeights: true },
        { name: "Становая тяга", sets: setsByLevel.beginner, needsBar: true },
      );
    } else {
      list.push(
        { name: "Подтягивания", sets: setsByLevel.beginner, outdoor: true },
        { name: "Отжимания на брусьях", sets: setsByLevel.beginner, outdoor: true },
        { name: "Приседания", sets: setsByLevel.beginner },
        { name: "Выпады в ходьбе", sets: setsByLevel.beginner },
        { name: "Отжимания от земли", sets: setsByLevel.beginner },
        { name: "Подъёмы коленей в висе", sets: setsByLevel.beginner, outdoor: true },
      );
    }
  }

  if (goal === "endurance") {
    list.push(
      { name: "Планка", sets: "3 подхода × 30–60 сек" },
      { name: "Бег на месте", sets: cardioByLevel.beginner, jumping: true },
      { name: "Скручивания", sets: setsByLevel.beginner },
      { name: "Боковая планка", sets: "по 30 сек на сторону, 3 подхода" },
    );
    if (place === "outdoor") {
      list.push(
        { name: "Лёгкий бег", sets: "15–25 минут в умеренном темпе", outdoor: true },
        { name: "Подтягивания", sets: setsByLevel.beginner, outdoor: true },
      );
    } else if (place === "gym") {
      list.push(
        { name: "Беговая дорожка", sets: "20 минут, пульс 60–70%" },
        { name: "Гребной тренажёр", sets: "10 минут" },
      );
    } else {
      list.push(
        { name: "Велосипед лёжа (упражнение)", sets: setsByLevel.beginner },
        { name: "Прыжки со скакалкой", sets: cardioByLevel.beginner, jumping: true },
      );
    }
  }

  if (goal === "fatburn") {
    list.push(
      { name: "Прыжки на месте", sets: cardioByLevel.beginner, jumping: true },
      { name: "Берпи", sets: cardioByLevel.beginner, jumping: true },
      { name: "Скалолаз (альпинист)", sets: cardioByLevel.beginner },
      { name: "Высокие колени", sets: cardioByLevel.beginner, jumping: true },
    );
    if (place === "outdoor") {
      list.push(
        { name: "Интервальный бег", sets: "5 × 1 мин быстро / 1 мин медленно", outdoor: true },
        { name: "Подтягивания", sets: setsByLevel.beginner, outdoor: true },
      );
    } else if (place === "gym") {
      list.push(
        { name: "Приседания с гантелями", sets: setsByLevel.beginner, needsWeights: true },
        { name: "Махи гирей", sets: setsByLevel.beginner, needsWeights: true },
      );
    } else {
      list.push(
        { name: "Приседания", sets: setsByLevel.beginner },
        { name: "Отжимания", sets: setsByLevel.beginner },
      );
    }
  }

  return list;
}

export interface WorkoutResult {
  exercises: Exercise[];
  calories: number;
  warnings: string[];
  tips: string[];
}

export function generateWorkout(f: FormData): WorkoutResult {
  let list = pool(f.goal, f.place);

  // Дополнительный инвентарь для дома
  if (f.place === "home") {
    if (f.homeDumbbells) {
      list.push(
        { name: "Жим гантелей стоя", sets: setsByLevel.beginner, needsDumbbells: true },
        { name: "Тяга гантели в наклоне", sets: setsByLevel.beginner, needsDumbbells: true },
        { name: "Приседания с гантелями", sets: setsByLevel.beginner, needsDumbbells: true },
        { name: "Подъём гантелей на бицепс", sets: setsByLevel.beginner, needsDumbbells: true },
      );
    }
    if (f.homeBands) {
      list.push(
        { name: "Тяга резинки к поясу", sets: setsByLevel.beginner, needsBands: true },
        { name: "Отведение бедра с резинкой", sets: setsByLevel.beginner, needsBands: true },
        { name: "Жим резинки от груди", sets: setsByLevel.beginner, needsBands: true },
        { name: "Боковые шаги с резинкой", sets: setsByLevel.beginner, needsBands: true },
      );
    }
  }

  // Возрастно-весовое исключение прыжков
  const excludeJumps = f.age > 45 && f.weight > 100;
  if (excludeJumps) {
    list = list.filter((e) => !e.jumping);
  }

  // Исключение по месту
  if (f.place === "home") {
    list = list.filter((e) => {
      if (e.outdoor) return false;
      if (e.needsBar) return false;
      if (e.needsWeights) return false;
      if (e.needsDumbbells && !f.homeDumbbells) return false;
      if (e.needsBands && !f.homeBands) return false;
      return true;
    });
  } else if (f.place === "gym") {
    list = list.filter((e) => !e.outdoor);
  }

  // Подстройка под уровень
  const setsTemplate = setsByLevel[f.level];
  const cardioTemplate = cardioByLevel[f.level];
  list = list.map((e) => {
    if (e.sets === setsByLevel.beginner) return { ...e, sets: setsTemplate };
    if (e.sets === cardioByLevel.beginner) return { ...e, sets: cardioTemplate };
    return e;
  });

  // Уникализируем по названию и берём 5–6
  const seen = new Set<string>();
  const unique: Exercise[] = [];
  for (const ex of list) {
    if (!seen.has(ex.name)) {
      seen.add(ex.name);
      unique.push(ex);
    }
  }
  const target = unique.length >= 6 ? 6 : Math.max(5, Math.min(unique.length, 6));
  const exercises = unique.slice(0, target);

  // Калории: вес × 0.075 × минуты, поправки на уровень и цель
  const levelMul = { beginner: 0.9, intermediate: 1, advanced: 1.15 }[f.level];
  const goalMul = { strength: 1, endurance: 1.1, fatburn: 1.25 }[f.goal];
  const calories = Math.round(f.weight * 0.075 * f.duration * levelMul * goalMul);

  // Предупреждения
  const warnings: string[] = [];
  if (f.age > 60) {
    warnings.push(
      "Возраст более 60 лет — начните с разминки 10 минут и контролируйте пульс.",
    );
  }
  if (f.age > 45 && f.weight > 100) {
    warnings.push(
      "Из тренировки убраны прыжковые упражнения — они дают повышенную нагрузку на суставы.",
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

  // Советы по отдыху
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

  return { exercises, calories, warnings, tips };
}
