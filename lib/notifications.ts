/** Notifications — Service Worker (PWA) + navigateur + alertes in-app */

export interface NotifyPayload {
  title: string;
  body?: string;
  tag?: string;
  url?: string;
  vibrate?: number[];
}

export type NotificationPermissionState = NotificationPermission | "unsupported";

export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getNotificationPermission(): NotificationPermissionState {
  if (!isNotificationSupported()) return "unsupported";
  return Notification.permission;
}

/** À appeler uniquement depuis un clic utilisateur */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;

  try {
    const result = await Notification.requestPermission();
    return result === "granted";
  } catch {
    return false;
  }
}

/** Alerte visible dans l'app (fonctionne sans permission système) */
export function showInAppNotification(payload: NotifyPayload): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("smartmenu:notify", {
      detail: payload,
    })
  );
}

function playAlertSound(): void {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const playTone = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.15, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + duration);
    };
    const t = ctx.currentTime;
    playTone(880, t, 0.12);
    playTone(1100, t + 0.14, 0.18);
    void ctx.close();
  } catch {
    // Audio non disponible
  }
}

/** Notification système + alerte in-app + son */
export async function notifyUser(
  payload: NotifyPayload,
  options?: { sound?: boolean; inApp?: boolean }
): Promise<boolean> {
  const { sound = true, inApp = true } = options ?? {};

  if (inApp) {
    showInAppNotification(payload);
  }

  if (sound) {
    playAlertSound();
  }

  if (payload.vibrate && "vibrate" in navigator) {
    navigator.vibrate(payload.vibrate);
  }

  if (!isNotificationSupported() || Notification.permission !== "granted") {
    return false;
  }

  const notificationOptions: NotificationOptions = {
    body: payload.body,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: payload.tag,
    data: { url: payload.url },
  };

  try {
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.ready;
      if (registration?.showNotification) {
        await registration.showNotification(payload.title, notificationOptions);
        return true;
      }
    }

    const notification = new Notification(payload.title, notificationOptions);
    notification.onclick = () => {
      window.focus();
      if (payload.url) window.location.href = payload.url;
      notification.close();
    };
    return true;
  } catch {
    return false;
  }
}

/** @deprecated Utiliser notifyUser */
export function showBrowserNotification(
  title: string,
  options?: NotificationOptions & { vibrate?: number[]; url?: string }
): void {
  void notifyUser({
    title,
    body: options?.body,
    tag: options?.tag,
    url: options?.url,
    vibrate: options?.vibrate,
  });
}
