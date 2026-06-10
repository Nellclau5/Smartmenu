import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formate un prix en FCFA (Afrique de l'Ouest) */
export function formatPrice(price: number): string {
  return `${price.toLocaleString("fr-FR")} FCFA`;
}
