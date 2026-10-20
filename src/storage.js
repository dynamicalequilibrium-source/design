import { useEffect, useState } from "react";
export function readSaved(key, fallback, validate = () => true) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value !== null && validate(value) ? value : fallback;
  } catch {
    return fallback;
  }
}
export function useSaved(key, fallback, validate = () => true) {
  const [value, setValue] = useState(() => readSaved(key, fallback, validate));
  const [saved, setSaved] = useState(true);
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      setSaved(true);
    } catch {
      setSaved(false);
    }
  }, [key, value]);
  return [value, setValue, saved];
}
export const isArray = Array.isArray;
export const isObject = (v) => v && typeof v === "object" && !Array.isArray(v);
