// =====================================================================
// Тонкий слой над Capacitor.
//
// Назначение: в браузере все функции — no-op (или мягкий fallback через
// Web API), в нативном приложении — реальные нативные вызовы.
// Это позволяет один и тот же код запускать и как сайт, и как мобильное
// приложение для Google Play / App Store.
//
// Импорты Capacitor статические, но безопасные: на вебе плагины подгружают
// web-реализации, которые корректно отвечают «не поддерживается» — мы
// глотаем такие ошибки.
// =====================================================================

import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";
import { LocalNotifications } from "@capacitor/local-notifications";
import { KeepAwake } from "@capacitor-community/keep-awake";

export function isNative(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

// ---- Виброотклик ----
//
// На вебе: используем navigator.vibrate как fallback (Android Chrome его
// поддерживает, iOS Safari игнорирует). На нативе — Capacitor Haptics.

export async function hapticTick(): Promise<void> {
  if (isNative()) {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch {}
    return;
  }
  try {
    navigator.vibrate?.(30);
  } catch {}
}

export async function hapticSuccess(): Promise<void> {
  if (isNative()) {
    try {
      await Haptics.notification({ type: NotificationType.Success });
    } catch {}
    return;
  }
  try {
    navigator.vibrate?.([60, 40, 60]);
  } catch {}
}

// ---- Удержание экрана включённым ----
//
// Во время тренировки экран не должен гаснуть, иначе пользователь между
// подходами увидит чёрный экран и потеряет таймер. На нативе — KeepAwake,
// на вебе — Wake Lock API (поддерживается в современных браузерах).

let webWakeLock: WakeLockSentinel | null = null;

export async function keepScreenAwake(on: boolean): Promise<void> {
  if (isNative()) {
    try {
      if (on) await KeepAwake.keepAwake();
      else await KeepAwake.allowSleep();
    } catch {}
    return;
  }
  try {
    if (on) {
      if (!webWakeLock && "wakeLock" in navigator) {
        webWakeLock = await (navigator as Navigator & {
          wakeLock: { request: (t: "screen") => Promise<WakeLockSentinel> };
        }).wakeLock.request("screen");
      }
    } else if (webWakeLock) {
      await webWakeLock.release();
      webWakeLock = null;
    }
  } catch {}
}

// Минимальное определение Wake Lock Sentinel (TS lib не всегда содержит).
interface WakeLockSentinel {
  release(): Promise<void>;
}

// ---- Локальные уведомления ----
//
// Используются, когда таймер отдыха закончился, а пользователь в это время
// свернул приложение или выключил экран. Без уведомления он не узнает,
// что пора делать следующий подход.
// На вебе уведомления тут не реализуем (Web Notifications требуют HTTPS и
// явного разрешения — для нашего сценария это лишнее).

let notificationsReady: boolean | null = null;

async function ensureNotificationPermission(): Promise<boolean> {
  if (!isNative()) return false;
  if (notificationsReady !== null) return notificationsReady;
  try {
    const status = await LocalNotifications.checkPermissions();
    if (status.display === "granted") {
      notificationsReady = true;
      return true;
    }
    const req = await LocalNotifications.requestPermissions();
    notificationsReady = req.display === "granted";
    return notificationsReady;
  } catch {
    notificationsReady = false;
    return false;
  }
}

// Назначаем уведомление через secs секунд («отдых закончится»).
// Если пользователь отдыхает прямо в приложении — уведомление не страшно,
// оно просто покажется одновременно с биппером.
export async function scheduleRestDoneNotification(secs: number): Promise<number | null> {
  if (!(await ensureNotificationPermission())) return null;
  const id = Math.floor(Math.random() * 2_000_000_000);
  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          id,
          title: "Отдых закончен",
          body: "Время следующего подхода",
          schedule: { at: new Date(Date.now() + secs * 1000) },
          smallIcon: "ic_stat_icon_config_sample",
          ongoing: false,
          autoCancel: true,
        },
      ],
    });
    return id;
  } catch {
    return null;
  }
}

export async function cancelRestNotification(id: number | null): Promise<void> {
  if (id === null || !isNative()) return;
  try {
    await LocalNotifications.cancel({ notifications: [{ id }] });
  } catch {}
}
