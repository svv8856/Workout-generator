import type { CapacitorConfig } from "@capacitor/cli";

// Конфиг для сборки в нативное мобильное приложение через Capacitor.
// Меняется только при подготовке релиза в Google Play / App Store.
const config: CapacitorConfig = {
  // Уникальный идентификатор приложения. После публикации менять нельзя:
  // именно по этой строке Google Play / App Store отличает обновление от
  // нового приложения. Формат: обратное доменное имя.
  appId: "ru.workoutgenerator.app",
  appName: "Генератор тренировок",
  // Папка, куда vite кладёт собранный фронтенд.
  webDir: "dist",
  // Светлая/тёмная адаптация системного бара.
  android: {
    backgroundColor: "#ffffff",
  },
  ios: {
    // Цвет фона при загрузке. Совпадает со светлой темой приложения.
    backgroundColor: "#ffffff",
    // Запретить тянуть страницу как «упругую» — для приложения, а не сайта,
    // это выглядит более нативно.
    scrollEnabled: true,
    contentInset: "automatic",
  },
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#22c55e",
    },
  },
};

export default config;
