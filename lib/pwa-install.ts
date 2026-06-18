export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function isIosDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function isStandaloneMode(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function isPwaInstallSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "serviceWorker" in navigator;
}

export function getInstallInstructions(): {
  title: string;
  steps: string[];
} {
  if (isIosDevice()) {
    return {
      title: "Installer sur iPhone / iPad",
      steps: [
        "Appuyez sur le bouton Partager (icône carré avec flèche)",
        "Faites défiler et choisissez « Sur l'écran d'accueil »",
        "Confirmez avec « Ajouter »",
      ],
    };
  }

  const ua = navigator.userAgent;
  if (/Edg\//.test(ua)) {
    return {
      title: "Installer sur ordinateur (Edge)",
      steps: [
        "Cliquez sur l'icône « Installer » dans la barre d'adresse",
        "Ou menu ⋯ → Applications → Installer Smart Menu",
      ],
    };
  }

  if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) {
    return {
      title: "Installer sur ordinateur (Chrome)",
      steps: [
        "Cliquez sur l'icône « Installer » dans la barre d'adresse",
        "Ou menu ⋮ → Transmettre, enregistrer et partager → Installer la page en tant qu'application",
      ],
    };
  }

  return {
    title: "Installer Smart Menu",
    steps: [
      "Utilisez Chrome ou Edge pour une installation en un clic",
      "Sinon, ajoutez cette page à vos favoris ou à l'écran d'accueil",
    ],
  };
}
