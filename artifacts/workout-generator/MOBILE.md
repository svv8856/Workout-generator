# Сборка мобильного приложения (Android / iOS)

Этот документ описывает, как из веб-версии «Генератора тренировок» собрать
нативное Android- и iOS-приложение через Capacitor и подготовить их к
публикации в Google Play и App Store.

> Сборку нативных APK/AAB и IPA **нельзя** выполнить на Replit — нужен
> ваш компьютер. На Replit мы держим только исходники и конфиг.
>
> **Android** собирается на любой ОС (Windows / Mac / Linux).
> **iOS** собирается **только на Mac** — это требование Apple,
> обойти его нельзя ни через Capacitor, ни через Flutter, ни через что-то ещё.
> Если своего Mac нет — можно арендовать в облаке (MacInCloud, MacStadium)
> примерно за $20–30/месяц на нужный период.

## Что уже сделано в проекте

- Установлены `@capacitor/core`, `@capacitor/cli`, `@capacitor/android`,
  `@capacitor/ios` и плагины: `haptics`, `local-notifications`, `app`,
  `preferences`, `status-bar`, `@capacitor-community/keep-awake`.
- Есть `capacitor.config.ts` (рядом с `package.json`) — там `appId`,
  `appName`, и папка с собранным фронтендом (`webDir: "dist"`), а также
  отдельные секции `android` и `ios`.
- Слой `src/lib/native.ts` оборачивает нативные API. На вебе функции
  делают мягкий fallback (Web Vibration, Wake Lock), на нативе вызывают
  Capacitor-плагины. Один и тот же код работает и в браузере, и на телефоне.
- Режим тренировки уже использует:
  - **виброотклик** в момент окончания таймера отдыха;
  - **удержание экрана** включённым на время тренировки;
  - **локальное уведомление**, если телефон уйдёт в сон во время отдыха.

## Что нужно установить локально (одноразово)

### Для Android (любая ОС)

1. **Node.js 20+** и `pnpm` (как в основном проекте).
2. **Java JDK 21** (Capacitor 8 требует именно её).
3. **Android Studio** (бесплатно, ~1 ГБ): <https://developer.android.com/studio>.
   При первом запуске установит Android SDK 35+, эмулятор и build-tools.
4. После установки Android Studio добавить переменные окружения:
   - `ANDROID_HOME` (обычно `~/Android/Sdk` или `~/Library/Android/sdk` на Mac)
   - в `PATH` добавить `$ANDROID_HOME/platform-tools` и `$ANDROID_HOME/emulator`.

### Для iOS (только Mac)

1. **macOS 14+** (на Windows и Linux iOS-сборка невозможна).
2. **Xcode 15+** — бесплатно из Mac App Store, ~10 ГБ.
3. **CocoaPods** — менеджер зависимостей iOS:
   ```bash
   sudo gem install cocoapods
   ```
4. **Apple ID** — для запуска на собственном iPhone достаточно бесплатного
   аккаунта; для публикации в App Store нужен **Apple Developer Program**
   ($99/год).

## Шаги сборки Android (первый раз)

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
pnpm --filter @workspace/workout-generator run cap:sync:android

# 5. Открыть в Android Studio
pnpm --filter @workspace/workout-generator run cap:open:android
```

Дальше в Android Studio:

- Выбрать эмулятор или подключить телефон по USB (с включённой отладкой).
- Кнопка **Run** → приложение запустится на устройстве.

## Шаги сборки iOS (первый раз, только на Mac)

```bash
# 1. Скачать проект, установить зависимости
git clone <ваш-репо>
cd workspace
pnpm install

# 2. Собрать фронтенд
pnpm --filter @workspace/workout-generator run build:mobile

# 3. Создать iOS-проект (один раз; создаёт папку ios/)
pnpm --filter @workspace/workout-generator run cap:add:ios

# 4. Скопировать фронтенд внутрь iOS-проекта (запустит pod install)
pnpm --filter @workspace/workout-generator run cap:sync:ios

# 5. Открыть в Xcode
pnpm --filter @workspace/workout-generator run cap:open:ios
```

Дальше в Xcode:

- В разделе **Signing & Capabilities** выбрать вашу команду (Team) —
  можно подписать своим Apple ID для запуска на личном iPhone бесплатно.
- Выбрать симулятор iPhone или подключённое устройство.
- Кнопка **▶ Run** (Cmd+R) → приложение запустится.
- При первом запуске на реальном iPhone: открыть на телефоне
  **Настройки → Основные → VPN и управление устройством → доверять
  разработчику**.

## Шаги после изменений в коде

После любых правок в `src/`:

```bash
# Синхронизировать обе платформы сразу
pnpm --filter @workspace/workout-generator run cap:sync

# Или только одну
pnpm --filter @workspace/workout-generator run cap:sync:android
pnpm --filter @workspace/workout-generator run cap:sync:ios
```

Команда соберёт фронтенд и обновит копии внутри `android/` и `ios/`.
После этого в Android Studio / Xcode нажмите Run снова.

## Иконка и заставка

В корне Android-проекта (`android/app/src/main/res/`) и iOS-проекта
(`ios/App/App/Assets.xcassets/`) лежат иконки. Заменить их разом
можно через инструмент Capacitor:

```bash
# Положите icon.png 1024×1024 и splash.png 2732×2732 в папку assets/
npx @capacitor/assets generate --iconBackgroundColor '#ffffff' \
                              --splashBackgroundColor '#ffffff'
```

Команда сама нарежет все нужные размеры и положит куда надо.

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

## Сборка релизного IPA для App Store

1. В Xcode: **Product → Archive** (предварительно выбрать Generic iOS Device).
2. Когда архив готов — окно **Organizer → Distribute App → App Store Connect**.
3. Xcode сам подпишет билд вашим сертификатом (создаётся автоматически
   через Apple Developer Program) и загрузит в App Store Connect.

## Загрузка в App Store

1. Регистрация: <https://developer.apple.com/programs/> ($99/год).
2. В **App Store Connect** (<https://appstoreconnect.apple.com>) создать
   новое приложение, заполнить:
   - название (до 30 символов), подзаголовок (до 30),
   - описание (до 4000 символов) на нужных языках,
   - ключевые слова (через запятую, до 100 символов),
   - иконка 1024×1024 без альфа-канала и закруглений,
   - 3–10 скриншотов для каждого размера экрана (iPhone 6.7" и 6.5"
     минимум обязательны),
   - категория **Health & Fitness**,
   - возрастной рейтинг (анкета),
   - политика конфиденциальности (та же страница, что и для Google),
   - **App Privacy** — заполнить «не собираем никаких данных».
3. Загрузить билд из Xcode (см. выше).
4. Выбрать загруженный билд в **Build** → **Submit for Review**.
5. **Срок ревью Apple**: обычно 24–48 часов, иногда до 7 дней. Apple
   придирчивее Google — не редко возвращают на доработку с просьбой
   убрать «лишние» элементы или уточнить, что приложение делает.

## Полезные команды

| Команда | Что делает |
| --- | --- |
| `pnpm --filter @workspace/workout-generator run build:mobile` | Собрать фронт для мобилки (без `BASE_PATH`) |
| `cap:sync` | Синхронизировать обе платформы (Android + iOS) |
| `cap:sync:android` / `cap:sync:ios` | Только одну платформу |
| `cap:open:android` / `cap:open:ios` | Открыть Android Studio / Xcode |
| `cap run android` / `cap run ios` | Собрать и запустить на устройстве |

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
  не требуется. На iOS разрешение тоже спрашивается при первом запуске.
- **`pod install` падает на Mac**: убедитесь, что CocoaPods установлен
  (`pod --version`). Если на Apple Silicon Mac — может потребоваться
  `arch -x86_64 pod install` или установка через Homebrew (`brew install cocoapods`).
- **Xcode требует Team для подписи**: войдите в Xcode → Settings →
  Accounts со своим Apple ID; затем в проекте Signing & Capabilities
  выберите его в выпадашке Team.
- **Apple отклонил приложение «Guideline 4.2 — Minimum Functionality»**:
  частая претензия к Capacitor-приложениям. Подчеркните в описании
  при подаче, что приложение работает оффлайн, использует нативные
  уведомления, виброотклик и удержание экрана — это часто помогает.
