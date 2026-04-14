import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Returns today's date string (YYYY-MM-DD) in Brasília timezone (America/Sao_Paulo) */
export function getTodayBrasilia(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
}

/** Returns a Date object adjusted to Brasília timezone "now" */
export function getNowBrasilia(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
}
