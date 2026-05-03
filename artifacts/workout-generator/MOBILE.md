# Сборка мобильного приложения (Android / iOS)

Этот документ описывает, как из веб-версии «Генератора тренировок» собрать
нативное Android-приложение через Capacitor и подготовить его к публикации
в Google Play.

> Сборку нативного APK/AAB **нельзя** выполнить на Replit — нужен ваш
> компьютер с установленной Android Studio. На Replit мы держим только
> исходники и конфиг.

## Что уже сделано в проекте

- Установлены `@capacitor/core`, `@capacitor/cli`, `@capacitor/android`
  и плагины: `haptics`, `local-notifications`, `app`, `preferences`,
  `status-bar`, `@capacitor-community/keep-awake`.
- Есть `capacitor.config.ts` (рядом с `package.json`) — там `appId`,
  `appName`, и папка с собранным фронтендом (`webDir: "dist"`).
- Слой `src/lib/native.ts` оборачивает нативные API. На вебе функции
  делают мягкий fallback (Web Vibration, Wake Lock), на нативе вызывают
  Capacitor-плагины. Один и тот же код работает и в браузере, и на телефоне.
- Режим тренировки уже использует:
  - **виброотклик** в момент окончания таймера отдыха;
  - **удержание экрана** включённым на время тренировки;
  - **локальное уведомление**, если телефон уйдёт в сон во время отдыха.

## Что нужно установить локально (одноразово)

1. **Node.js 20+** и `pnpm` (как в основном проекте).
2. **Java JDK 21** (Capacitor 8 требует именно её).
3. **Android Studio** (бесплатно, ~1 ГБ): <https://developer.android.com/studio>.
   При первом запуске установит Android SDK 35+, эмулятор и build-tools.
4. После установки Android Studio добавить переменные окружения:
   - `ANDROID_HOME` (обычно `~/Android/Sdk` или `~/Library/Android/sdk` на Mac)
   - в `PATH` добавить `$ANDROID_HOME/platform-tools` и `$ANDROID_HOME/emulator`.

## Шаги сборки (первый раз)

```bash
# 1. Скачать проект с Replit (Git pull или ZIP)
git clone <ваш-репо>
cd workspace
pnpm install

# 2. Собрать фронтенд в папку dist/
pnpm --filter @workspace/workout-generator run build:mobile

# 3. Создать Android-проект (один раз; создаёт папку android/)
pnpm --filter @workspace/workout-generator run cap:add:android

# 4. Скопировать собранный фронтенд внутрь Android-проекта
pnpm --filter @workspace/workout-generator exec cap sync android

# 5. Открыть в Android Studio
pnpm --filter @workspace/workout-generator run cap:open:android
```

Дальше в Android Studio:

- Выбрать эмулятор или подключить телефон по USB (с включённой отладкой).
- Кнопка **Run** → приложение запустится на устройстве.

## Шаги после изменений в коде

После любых правок в `src/`:

```bash
pnpm --filter @workspace/workout-generator run cap:sync
```

Эта команда соберёт фронтенд и обновит копию внутри `android/`. После
этого в Android Studio просто нажмите Run снова.

## Иконка и заставка

В корне Android-проекта (`android/app/src/main/res/`) лежат иконки.
Заменить их можно вручную или через инструмент:

```bash
# Положите icon.png 1024×1024 и splash.png 2732×2732 в проект
npx @capacitor/assets generate --android
```

## Сборка релизного AAB для Google Play

1. В Android Studio: **Build → Generate Signed Bundle / APK → Android App Bundle**.
2. Создать новый keystore (сохраните файл и пароли — без них вы не сможете
   обновлять приложение в магазине).
3. Выбрать `release`, нажать Finish.
4. Готовый `.aab` лежит в `android/app/release/`.

## Загрузка в Google Play

1. Регистрация: <https://play.google.com/console> ($25 единоразово).
2. Создать новое приложение, заполнить:
   - название, краткое и полное описание (на русском),
   - иконка 512×512, feature graphic 1024×500,
   - 2–8 скриншотов с телефона,
   - категория **Здоровье и фитнес**,
   - возрастной рейтинг (анкета),
   - политика конфиденциальности (обязательная публичная страница),
   - форма Data Safety (заполнить «всё локально, ничего не передаётся»).
3. Загрузить `.aab` в раздел **Internal testing** или сразу **Production**.
4. Для личных аккаунтов: пройти 14-дневный закрытый тест с 12 тестировщиками
   перед публичным релизом (требование Google с 2023).

## Полезные команды

| Команда | Что делает |
| --- | --- |
| `pnpm --filter @workspace/workout-generator run build:mobile` | Собрать фронт для мобилки (без `BASE_PATH`) |
| `cap sync android` | Перенести собранный фронт в Android-проект |
| `cap open android` | Открыть Android Studio |
| `cap run android` | Собрать и запустить на подключенном устройстве |

## Если что-то сломалось

- **Gradle ругается на Java**: убедитесь, что установлена JDK 21
  (`java -version`), а не более старая.
- **`cap add android` не запускается**: проверьте, что выполнили
  `pnpm install` в корне проекта и пакеты Capacitor установились.
- **Приложение белый экран на старте**: проверьте, что в
  `capacitor.config.ts` `webDir: "dist"`, и после правок выполнили
  `cap sync android`.
- **Уведомления не приходят**: на Android 13+ нужно явное разрешение —
  при первом запуске приложение попросит. На старых Android разрешение
  не требуется.
