// =====================================================================
// Простой механизм локализации (Russian / English).
//
// Используется в двух местах:
//  1) UI-строки через `useT()` / `t(key)`.
//  2) Голосовые подсказки в режиме тренировки — через `voicePhrase(...)`.
//
// Язык хранится в localStorage под ключом `wg_lang_v1`.
// Дефолт — русский (исторически приложение русскоязычное).
// =====================================================================

export type Lang = "ru" | "en";

const STORAGE_KEY = "wg_lang_v1";
const DEFAULT_LANG: Lang = "ru";

let currentLang: Lang = loadLang();
const listeners = new Set<() => void>();

function loadLang(): Lang {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === "ru" || raw === "en") return raw;
  } catch {}
  return DEFAULT_LANG;
}

export function getLang(): Lang {
  return currentLang;
}

export function setLang(lang: Lang): void {
  if (lang === currentLang) return;
  currentLang = lang;
  try {
    window.localStorage.setItem(STORAGE_KEY, lang);
  } catch {}
  // Обновим html-атрибут lang для доступности
  try {
    document.documentElement.lang = lang;
  } catch {}
  for (const fn of listeners) fn();
}

export function subscribeLang(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Проставляем атрибут на документе при первой загрузке
try {
  document.documentElement.lang = currentLang;
} catch {}

// =====================================================================
//                         Словарь UI-строк
// =====================================================================

// Структура: для каждого ключа — { ru, en }. Возвращаем строку для
// текущего языка; если ключ отсутствует — отдаём сам ключ (видно сразу,
// что что-то не переведено).
type Dict = Record<string, { ru: string; en: string }>;

const DICT: Dict = {
  // ----- App: header / form / common -----
  appTitle: {
    ru: "Генератор тренировок",
    en: "Workout Generator",
  },
  appSubtitle: {
    ru: "Подберём {range} упражнений под вашу цель, уровень и место занятий.",
    en: "We'll pick {range} exercises tailored to your goal, level, and venue.",
  },
  toggleTheme: { ru: "Переключить тему", en: "Toggle theme" },
  themeLight: { ru: "Светлая", en: "Light" },
  themeDark: { ru: "Тёмная", en: "Dark" },
  tabWorkout: { ru: "Тренировка", en: "Workout" },
  tabAnalytics: { ru: "Аналитика", en: "Analytics" },

  fieldType: { ru: "Тип", en: "Type" },
  modeSingle: { ru: "Одна тренировка", en: "Single workout" },
  modeCourse: { ru: "Курс", en: "Course" },
  fieldAge: { ru: "Возраст", en: "Age" },
  ageHint: {
    ru: "Для младше 16 лет рекомендуем заниматься под присмотром тренера.",
    en: "For under 16 years old, please train under a coach's supervision.",
  },
  fieldWeightKg: { ru: "Вес, кг", en: "Weight, kg" },
  fieldGender: { ru: "Пол", en: "Gender" },
  genderMale: { ru: "Мужской", en: "Male" },
  genderFemale: { ru: "Женский", en: "Female" },
  fieldLevel: { ru: "Уровень подготовки", en: "Fitness level" },
  levelBeginner: { ru: "Начинающий", en: "Beginner" },
  levelIntermediate: { ru: "Средний", en: "Intermediate" },
  levelAdvanced: { ru: "Продвинутый", en: "Advanced" },
  fieldGoal: { ru: "Цель", en: "Goal" },
  goalStrength: { ru: "Сила", en: "Strength" },
  goalEndurance: { ru: "Выносливость", en: "Endurance" },
  goalFatburn: { ru: "Жиросжигание", en: "Fat loss" },
  fieldPlace: { ru: "Место занятий", en: "Where you train" },
  placeHome: { ru: "Дом", en: "Home" },
  placeGym: { ru: "Зал", en: "Gym" },
  placeOutdoor: { ru: "Улица", en: "Outdoor" },
  fieldHomeEquip: {
    ru: "Инвентарь дома (необязательно)",
    en: "Home equipment (optional)",
  },
  equipDumbbells: { ru: "Гантели", en: "Dumbbells" },
  equipBands: { ru: "Резинки", en: "Resistance bands" },
  fieldDuration: { ru: "Длительность: {min} мин", en: "Duration: {min} min" },
  fieldCourseLength: { ru: "Длительность курса", en: "Course length" },
  weeksShort: { ru: "{n} нед", en: "{n} wk" },
  fieldDaysPerWeek: { ru: "Тренировок в неделю", en: "Sessions per week" },
  courseHint: {
    ru: "Рекомендуем: новичкам — 3 раза/нед, средним — 3–4, продвинутым — 4–5. Оптимальный курс — 4–8 недель.",
    en: "We recommend: beginners — 3×/wk, intermediate — 3–4, advanced — 4–5. Optimal course — 4–8 weeks.",
  },
  lastWorkout: { ru: "Прошлая тренировка:", en: "Last workout:" },
  reset: { ru: "сбросить", en: "reset" },
  courseSuggestion: {
    ru: "Вы тренируетесь {n} дней за последнюю неделю. Если занимаетесь регулярно — лучше переключиться на режим «Курс»: там сплит по дням и периодизация (втягивающая → пиковая → разгрузочная), а не случайные тренировки.",
    en: "You've trained {n} days this past week. If you train regularly, switch to Course mode: it has a day-by-day split with periodization (ramp-up → peak → deload) instead of random sessions.",
  },
  switchToCourse: { ru: "Перейти на курс →", en: "Switch to course →" },
  generateWorkoutBtn: { ru: "Сгенерировать тренировку", en: "Generate workout" },
  buildCourseBtn: { ru: "Построить курс", en: "Build course" },
  trainNowBtn: { ru: "▶ Тренируюсь сейчас", en: "▶ Train now" },
  fillFormHint: {
    ru: "Заполните форму слева и нажмите кнопку.",
    en: "Fill out the form on the left and press the button.",
  },
  footerHealth: {
    ru: "Это базовые рекомендации. При проблемах со здоровьем проконсультируйтесь с врачом.",
    en: "These are general recommendations. For any health concerns, please consult a doctor.",
  },

  // ----- Welcome -----
  welcomeTitle: { ru: "Добро пожаловать", en: "Welcome" },
  welcomeIntro: {
    ru: "Как к вам обращаться? Имя сохранится на устройстве — все тренировки будут привязаны к нему. Можно создать несколько профилей (например, для семьи).",
    en: "What should we call you? The name is stored on this device — all your workouts will be linked to it. You can create multiple profiles (for example, for family members).",
  },
  namePlaceholder: { ru: "Например, Анна", en: "For example, Anna" },
  continueBtn: { ru: "Продолжить", en: "Continue" },
  orExistingUser: {
    ru: "Или войдите как существующий пользователь:",
    en: "Or sign in as an existing user:",
  },
  enterArrow: { ru: "войти →", en: "sign in →" },
  privacyNote: {
    ru: "Все данные хранятся только на этом устройстве. Ничего не передаётся в интернет.",
    en: "All data is stored on this device only. Nothing is sent over the internet.",
  },
  errorCreateProfile: {
    ru: "Не удалось создать профиль",
    en: "Failed to create profile",
  },

  // ----- Profile menu -----
  currentUser: { ru: "Текущий пользователь", en: "Current user" },
  switchUser: { ru: "Сменить пользователя", en: "Switch user" },
  remindersMenu: { ru: "Напоминания о тренировке", en: "Workout reminders" },
  addUser: { ru: "+ Добавить пользователя", en: "+ Add user" },
  renameUser: { ru: "Переименовать «{name}»", en: "Rename \"{name}\"" },
  deleteUser: { ru: "Удалить «{name}»", en: "Delete \"{name}\"" },
  backupSection: { ru: "Резервная копия", en: "Backup" },
  exportHistory: { ru: "Экспортировать историю", en: "Export history" },
  exportTitle: { ru: "Скачать всю историю в JSON-файл", en: "Download all history as JSON" },
  importFile: { ru: "Импортировать из файла…", en: "Import from file…" },
  importTitle: { ru: "Загрузить историю из JSON-файла", en: "Load history from JSON file" },
  languageSection: { ru: "Язык", en: "Language" },
  langRu: { ru: "Русский", en: "Russian" },
  langEn: { ru: "Английский", en: "English" },

  importFailed: { ru: "Не получилось импортировать", en: "Import failed" },
  importDone: { ru: "Импорт завершён", en: "Import done" },
  importAdded: { ru: "Добавлено новых:", en: "Added:" },
  importUpdated: { ru: "Обновлено существующих:", en: "Updated:" },
  importSkipped: { ru: "Пропущено повреждённых:", en: "Skipped (corrupt):" },
  importTotal: { ru: "Всего тренировок в профиле:", en: "Total workouts in profile:" },
  doneBtn: { ru: "Готово", en: "Done" },

  newUserName: { ru: "Имя нового пользователя", en: "New user name" },
  cancelBtn: { ru: "Отмена", en: "Cancel" },
  createBtn: { ru: "Создать", en: "Create" },
  newName: { ru: "Новое имя", en: "New name" },
  saveBtn: { ru: "Сохранить", en: "Save" },
  confirmDeleteText: {
    ru: "Удалить профиль «{name}» вместе со всей его историей тренировок? Это действие нельзя отменить.",
    en: "Delete profile \"{name}\" along with all its workout history? This cannot be undone.",
  },
  deleteBtn: { ru: "Удалить", en: "Delete" },
  errorGeneric: { ru: "Ошибка", en: "Error" },
  errorReadFile: { ru: "Не удалось прочитать файл", en: "Failed to read file" },
  errorSaveFile: { ru: "Не удалось сохранить файл", en: "Failed to save file" },
  exportShareTitle: { ru: "Резервная копия тренировок", en: "Workout backup" },
  exportSaveDialog: { ru: "Сохранить резервную копию", en: "Save backup" },

  // ----- Notifications view -----
  reminders: { ru: "Напоминания", en: "Reminders" },
  remindersNativeOnly: {
    ru: "Напоминания работают только в мобильном приложении.",
    en: "Reminders only work in the mobile app.",
  },
  dailyReminder: { ru: "Ежедневное напоминание", en: "Daily reminder" },
  reminderTime: { ru: "Время:", en: "Time:" },
  back: { ru: "Назад", en: "Back" },
  saved: { ru: "Сохранено", en: "Saved" },

  // ----- Result view -----
  yourWorkout: { ru: "Ваша тренировка", en: "Your workout" },
  resultLine: {
    ru: "Цель {planned} мин · реально ~{actual} мин · сожжёте ≈ {kcal} ккал",
    en: "Target {planned} min · actually ~{actual} min · burns ≈ {kcal} kcal",
  },
  warnTooLong: {
    ru: "Тренировка займёт больше выбранного окна. Сократите количество подходов или увеличьте длительность в форме.",
    en: "The workout will run longer than your time window. Reduce sets or increase duration in the form.",
  },
  warnTooShort: {
    ru: "Можно добавить ещё одно упражнение или увеличить количество подходов — окно позволяет.",
    en: "You can add one more exercise or more sets — your time window allows it.",
  },
  warnings: { ru: "Предупреждения", en: "Warnings" },
  focusToday: { ru: "Фокус сегодня:", en: "Today's focus:" },
  involves: { ru: "Задействуем: {list}", en: "Targets: {list}" },
  restBetween: { ru: "Отдых между упражнениями:", en: "Rest between exercises:" },
  weight: { ru: "Вес:", en: "Weight:" },
  howTo: { ru: "Как делать:", en: "How to:" },
  videoTechnique: { ru: "Видео техники:", en: "Technique video:" },
  restTips: { ru: "Советы по отдыху", en: "Rest & recovery tips" },
  dataSourceTitle: { ru: "Откуда эти данные", en: "About this data" },
  dataSource: {
    ru: "Программа подбирается по общепринятым рекомендациям спортивной науки: протоколы NSCA и ACSM (подходы/повторения/отдых), компендиум физической активности Ainsworth (расчёт калорий), типичные тренерские нормы для расчёта рабочих весов от массы тела с поправкой на пол, уровень и цель.",
    en: "The program is built on widely accepted sports-science recommendations: NSCA and ACSM protocols (sets/reps/rest), the Ainsworth Compendium of Physical Activities (calorie estimation), and standard coaching norms for calculating working weights from body mass adjusted for sex, level, and goal.",
  },
  important: { ru: "Важно:", en: "Important:" },
  importantNote: {
    ru: "это ориентир для здоровых людей, а не индивидуальный план. При проблемах со здоровьем, травмах, беременности или серьёзных спортивных целях проконсультируйтесь с врачом и тренером. Слушайте своё тело и останавливайтесь при боли.",
    en: "this is general guidance for healthy people, not a personalized plan. If you have any health concerns, injuries, are pregnant, or have serious athletic goals, please consult a doctor and a coach. Listen to your body and stop if anything hurts.",
  },

  // ----- History calendar -----
  historyTitle: { ru: "Календарь тренировок", en: "Workout calendar" },
  history14Days: {
    ru: "Последние 14 дней. Сегодня — слева.",
    en: "Last 14 days. Today is on the left.",
  },
  clearHistory: { ru: "очистить историю", en: "clear history" },
  restDayShort: { ru: "отдых", en: "rest" },
  restDay: { ru: "День отдыха", en: "Rest day" },
  legendPush: { ru: "Push", en: "Push" },
  legendPull: { ru: "Pull", en: "Pull" },
  legendLegs: { ru: "Ноги", en: "Legs" },
  legendUpper: { ru: "Верх", en: "Upper" },
  legendFullbody: {
    ru: "Всё тело (мало инвентаря)",
    en: "Full body (minimal equipment)",
  },

  // ----- Course view -----
  courseHeading: { ru: "Курс на {n} нед", en: "{n}-week course" },
  splitLabel: { ru: "Сплит:", en: "Split:" },
  sessionsPerWeek: {
    ru: "{n} тренировок в неделю",
    en: "{n} sessions per week",
  },
  totalSessionsLabel: {
    ru: "всего {n} занятий",
    en: "{n} sessions total",
  },
  weekN: { ru: "Неделя {n}", en: "Week {n}" },
  dayN: { ru: "День {n} · {weekday}", en: "Day {n} · {weekday}" },
  setsLabel: { ru: "Подходы:", en: "Sets:" },
  weightDash: { ru: "Вес:", en: "Weight:" },

  // ----- Course progress (photos) -----
  beforeAfter: { ru: "Фото «До и После»", en: "Before & After photos" },
  beforeAfterHint: {
    ru: "Добавьте фото в начале и конце курса, чтобы увидеть прогресс.",
    en: "Add photos at the start and end of the course to see your progress.",
  },
  photoBefore: { ru: "ДО", en: "BEFORE" },
  photoAfter: { ru: "ПОСЛЕ", en: "AFTER" },
  addPhoto: { ru: "Добавить фото", en: "Add photo" },
  removePhoto: { ru: "Удалить фото", en: "Remove photo" },

  // ----- Training mode -----
  exerciseOf: {
    ru: "Упражнение {i} из {n}",
    en: "Exercise {i} of {n}",
  },
  setsCounter: {
    ru: "{done}/{total} подх. · {pct}%",
    en: "{done}/{total} sets · {pct}%",
  },
  voiceOn: { ru: "Голос вкл", en: "Voice on" },
  voiceOff: { ru: "Голос выкл", en: "Voice off" },
  voiceOnLabel: { ru: "Включить голос", en: "Enable voice" },
  voiceOffLabel: { ru: "Выключить голос", en: "Disable voice" },
  closeBtn: { ru: "Закрыть", en: "Close" },
  doExercise: { ru: "Делайте упражнение", en: "Do the exercise" },
  restBeforeNext: {
    ru: "Отдых перед следующим упражнением",
    en: "Rest before next exercise",
  },
  restBetweenSets: {
    ru: "Отдых между подходами",
    en: "Rest between sets",
  },
  stopTimer: { ru: "Остановить таймер", en: "Stop timer" },
  toNextExercise: {
    ru: "К следующему упражнению",
    en: "To next exercise",
  },
  continueEarly: { ru: "Продолжить раньше", en: "Continue early" },
  weightInline: { ru: "Вес: {w}", en: "Weight: {w}" },
  setsBlock: { ru: "Подходы", en: "Sets" },
  startSetSec: {
    ru: "Начать подход ({s} сек)",
    en: "Start set ({s} sec)",
  },
  setDone: { ru: "Подход выполнен", en: "Set done" },
  finishWorkout: { ru: "Завершить тренировку", en: "Finish workout" },
  skip: { ru: "Пропустить", en: "Skip" },
  prevExercise: { ru: "← Предыдущее", en: "← Previous" },
  finishEarly: {
    ru: "Закончить тренировку раньше",
    en: "End workout early",
  },
  workoutDone: { ru: "Тренировка завершена", en: "Workout finished" },
  setsDone: { ru: "Подходов сделано", en: "Sets done" },
  setsXofY: { ru: "{done} из {total}", en: "{done} of {total}" },
  actualTime: { ru: "Время по факту", en: "Actual time" },
  minPlanned: { ru: "{min} мин", en: "{min} min" },
  vsPlan: { ru: "· план {min} мин", en: "· planned {min} min" },
  exercisesSummary: { ru: "Упражнений", en: "Exercises" },
  fullPartialSkipped: {
    ru: "{full} полностью · {partial} частично · {skip} пропущено",
    en: "{full} full · {partial} partial · {skip} skipped",
  },
  rpeQuestion: {
    ru: "Как было тяжело? (RPE)",
    en: "How hard was it? (RPE)",
  },
  rpeMin: { ru: "1 — очень легко", en: "1 — very easy" },
  rpeMid: { ru: "5 — средне", en: "5 — moderate" },
  rpeMax: { ru: "10 — на пределе", en: "10 — max effort" },
  dontSave: { ru: "Не сохранять", en: "Don't save" },
  trainingModeAria: { ru: "Режим тренировки", en: "Training mode" },

  // ----- Analytics -----
  analyticsEmpty: { ru: "Аналитика пока пуста", en: "No analytics yet" },
  analyticsEmptyHint: {
    ru: "Запустите тренировку с экрана «Тренировка» и нажмите «Тренируюсь сейчас» — после первой завершённой сессии здесь появятся графики и рекомендации.",
    en: "Start a workout from the Workout tab and tap \"Train now\" — after your first completed session, charts and recommendations will appear here.",
  },
  proOn: { ru: "Pro включён", en: "Pro is on" },
  proOff: { ru: "Pro отключён", en: "Pro is off" },
  proOnDesc: {
    ru: "Доступны баланс мышц, тренд RPE, план vs факт и автоанализ.",
    en: "Muscle balance, RPE trend, plan vs actual, and auto-analysis are available.",
  },
  proOffDesc: {
    ru: "На запуске Pro бесплатный — нажмите чтобы открыть аналитику полностью.",
    en: "Pro is free at launch — tap to unlock full analytics.",
  },
  proTurnOff: { ru: "Выключить", en: "Turn off" },
  proTurnOn: { ru: "Включить Pro", en: "Enable Pro" },
  cardWeeklyVolume: { ru: "Объём по неделям", en: "Weekly volume" },
  cardWeeklyVolumeSub: {
    ru: "Сделанные подходы за последние 8 недель",
    en: "Sets completed over the last 8 weeks",
  },
  setsTooltip: { ru: "Подходы", en: "Sets" },
  cardActivity: { ru: "Активность", en: "Activity" },
  activityFull: {
    ru: "Вся история — {n} тренировок с {date}",
    en: "Full history — {n} workouts since {date}",
  },
  activityShort: {
    ru: "Последние 7 недель — интенсивность по объёму подходов",
    en: "Last 7 weeks — intensity by set volume",
  },
  collapseTo7w: { ru: "Свернуть до 7 недель", en: "Collapse to 7 weeks" },
  showFullHistory: { ru: "Показать всю историю", en: "Show full history" },
  cardTonnage: {
    ru: "Тоннаж: общий поднятый вес по неделям",
    en: "Tonnage: total weight lifted per week",
  },
  cardTonnageSub: {
    ru: "Сумма (вес × повторения × подходы) — главный показатель объёма силовой работы",
    en: "Sum of (weight × reps × sets) — the key measure of strength workload",
  },
  thisWeek: { ru: "За эту неделю", en: "This week" },
  vsPrevWeek: { ru: "vs пред. неделя", en: "vs prev week" },
  tonnageEmpty: {
    ru: "Нужен указанный вес и повторения в упражнениях. Откройте тренировку и впишите рабочий вес — после первой завершённой сессии тоннаж появится здесь.",
    en: "Working weights and reps are needed. Open a workout and enter your working weight — after the first completed session, tonnage will appear here.",
  },
  tonnageTooltip: { ru: "Тоннаж", en: "Tonnage" },
  card1RM: {
    ru: "Прогноз 1ПМ (одноповторный максимум)",
    en: "1RM forecast (one-rep max)",
  },
  card1RMSub: {
    ru: "Оценка по формуле Эпли для базовых упражнений с 1–10 повторениями",
    en: "Epley formula estimate for compound lifts with 1–10 reps",
  },
  exerciseCol: { ru: "Упражнение", en: "Exercise" },
  oneRMCol: { ru: "1ПМ", en: "1RM" },
  changeCol: { ru: "Изменение", en: "Change" },
  dateCol: { ru: "Дата", en: "Date" },
  oneRMEmpty: {
    ru: "Нужны базовые упражнения (жимы, приседы, тяги) с указанным весом и 1–10 повторениями. После таких тренировок здесь появится оценка одноповторного максимума.",
    en: "You need compound lifts (presses, squats, rows/deadlifts) with a working weight and 1–10 reps. After such workouts, the 1RM estimate will appear here.",
  },
  cardBalance: { ru: "Баланс мышц за 30 дней", en: "Muscle balance — last 30 days" },
  noDataPeriod: { ru: "За 30 дней нет данных", en: "No data for 30 days" },
  cardRpe: {
    ru: "Субъективная нагрузка (RPE)",
    en: "Perceived exertion (RPE)",
  },
  cardRpeSub: {
    ru: "Шкала 1–10. Помогает увидеть, не перегружаетесь ли вы",
    en: "Scale 1–10. Helps spot overtraining",
  },
  rpeNeedTwo: {
    ru: "Нужно минимум 2 завершённые тренировки с оценкой RPE",
    en: "At least 2 completed workouts with an RPE rating are needed",
  },
  cardTime: { ru: "Время: план и факт", en: "Time: planned vs actual" },
  cardTimeSub: {
    ru: "Сколько вы планировали и сколько в действительности занимались",
    en: "How long you planned vs actually trained",
  },
  needTwoSessions: {
    ru: "Нужно минимум 2 завершённые тренировки",
    en: "At least 2 completed workouts are needed",
  },
  legendPlanned: { ru: "План", en: "Planned" },
  legendActual: { ru: "Факт", en: "Actual" },
  cardCoachRecs: { ru: "Рекомендации тренера", en: "Coach recommendations" },
  cardCoachRecsSub: {
    ru: "Конкретные советы по последним 6 тренировкам — что сделать на следующей неделе",
    en: "Specific advice from your last 6 workouts — what to do next week",
  },
  heatmapLess: { ru: "меньше", en: "less" },
  heatmapMore: { ru: "больше", en: "more" },
  setsCountTooltip: { ru: "{n} подх.", en: "{n} sets" },
};

// =====================================================================
//                          API доступа
// =====================================================================

export type Translatable = keyof typeof DICT;

export function t(key: string, params?: Record<string, string | number>): string {
  const entry = DICT[key];
  if (!entry) return key;
  let str = entry[currentLang] ?? entry.ru;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      str = str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }
  return str;
}

// React-хук: подписывается на смену языка и тригерит ререндер.
import { useEffect, useState } from "react";

export function useLang(): Lang {
  const [lang, setLangState] = useState<Lang>(() => getLang());
  useEffect(() => subscribeLang(() => setLangState(getLang())), []);
  return lang;
}

export function useT(): (key: string, params?: Record<string, string | number>) => string {
  // useLang() гарантирует ререндер при смене языка — t() сама читает currentLang.
  useLang();
  return t;
}

// =====================================================================
//                     Голосовые подсказки (TTS)
// =====================================================================

// Возвращаем фразу для текущего языка по «семантическому» ключу.
// digit передаём для обратного отсчёта.
export type VoiceCue = "rest" | "work" | "next" | "digit";

export function voicePhrase(cue: VoiceCue, value?: number): string {
  const lang = currentLang;
  switch (cue) {
    case "rest":
      return lang === "ru" ? "Отдых" : "Rest";
    case "work":
      return lang === "ru" ? "Работаем" : "Work";
    case "next":
      return lang === "ru" ? "Следующее упражнение" : "Next exercise";
    case "digit":
      return String(value ?? 0);
  }
}

// BCP-47 коды для SpeechSynthesis — нужны, чтобы выбрать правильный голос.
export function voiceLangCode(): string {
  return currentLang === "ru" ? "ru-RU" : "en-US";
}
