/** Notifications navigateur (PWA / mobile) */

export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (!isNotificationSupported()) return "unsupported";
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

export function showBrowserNotification(
  title: string,
  options?: NotificationOptions & { vibrate?: number[] }
): void {
  if (!isNotificationSupported() || Notification.permission !== "granted") return;

  try {
    const notification = new Notification(title, {
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      ...options,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  } catch {
    // Ignoré si notifications bloquées
  }

  if ("vibrate" in navigator && options?.vibrate) {
    navigator.vibrate(options.vibrate);
  }
}
