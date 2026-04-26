import { useState, useEffect, useCallback } from "react";

// Data Models
export type Turno = {
  id: string;
  nombre: string;
  hora: string;
  servicio: string;
  barberoId: string;
  estado: "EN CURSO" | "CONFIRMADO" | "ESPERANDO";
  fecha: string; // YYYY-MM-DD
};

export type Barbero = {
  id: string;
  nombre: string;
};

export type Servicio = {
  id: string;
  nombre: string;
  precio: number;
};

export type Transaccion = {
  id: string;
  servicioNombre: string;
  precio: number;
  barberoId: string;
  fecha: string; // ISO datetime
};

export type Settings = {
  nombreBarberia: string;
  whatsappNumero: string;
};

// Keys
const KEYS = {
  TURNOS: "barbercontrol_turnos",
  BARBEROS: "barbercontrol_barberos",
  SERVICIOS: "barbercontrol_servicios",
  TRANSACCIONES: "barbercontrol_transacciones",
  SETTINGS: "barbercontrol_settings",
};

// Default Seeds
const DEFAULT_BARBEROS: Barbero[] = [
  { id: "1", nombre: "Fede" },
  { id: "2", nombre: "Maxi" },
];

const DEFAULT_SERVICIOS: Servicio[] = [
  { id: "1", nombre: "Corte", precio: 4000 },
  { id: "2", nombre: "Barba", precio: 3000 },
  { id: "3", nombre: "Corte + Barba", precio: 6500 },
  { id: "4", nombre: "Color", precio: 8000 },
  { id: "5", nombre: "Diseño", precio: 5000 },
];

const DEFAULT_SETTINGS: Settings = {
  nombreBarberia: "BarberControl",
  whatsappNumero: "",
};

// Helper: Get item
function getItem<T>(key: string, defaultValue: T): T {
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading localStorage key "${key}":`, error);
    return defaultValue;
  }
}

// Helper: Set item
function setItem<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event("local-storage-update"));
  } catch (error) {
    console.error(`Error setting localStorage key "${key}":`, error);
  }
}

// Initialize defaults if empty
export function initStorage() {
  if (!window.localStorage.getItem(KEYS.BARBEROS)) {
    setItem(KEYS.BARBEROS, DEFAULT_BARBEROS);
  }
  if (!window.localStorage.getItem(KEYS.SERVICIOS)) {
    setItem(KEYS.SERVICIOS, DEFAULT_SERVICIOS);
  }
  if (!window.localStorage.getItem(KEYS.SETTINGS)) {
    setItem(KEYS.SETTINGS, DEFAULT_SETTINGS);
  }
  if (!window.localStorage.getItem(KEYS.TURNOS)) {
    setItem(KEYS.TURNOS, []);
  }
  if (!window.localStorage.getItem(KEYS.TRANSACCIONES)) {
    setItem(KEYS.TRANSACCIONES, []);
  }
}

// Hook
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => getItem(key, initialValue));

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      setItem(key, valueToStore);
    } catch (error) {
      console.error(error);
    }
  }, [key, storedValue]);

  useEffect(() => {
    const handleStorageChange = () => {
      setStoredValue(getItem(key, initialValue));
    };

    window.addEventListener("local-storage-update", handleStorageChange);
    // Listen to changes from other tabs
    window.addEventListener("storage", (e) => {
      if (e.key === key) handleStorageChange();
    });

    return () => {
      window.removeEventListener("local-storage-update", handleStorageChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [key, initialValue]);

  return [storedValue, setValue] as const;
}

export const useTurnos = () => useLocalStorage<Turno[]>(KEYS.TURNOS, []);
export const useBarberos = () => useLocalStorage<Barbero[]>(KEYS.BARBEROS, DEFAULT_BARBEROS);
export const useServicios = () => useLocalStorage<Servicio[]>(KEYS.SERVICIOS, DEFAULT_SERVICIOS);
export const useTransacciones = () => useLocalStorage<Transaccion[]>(KEYS.TRANSACCIONES, []);
export const useSettings = () => useLocalStorage<Settings>(KEYS.SETTINGS, DEFAULT_SETTINGS);

export function descargarRespaldo() {
  const data = {
    turnos: getItem(KEYS.TURNOS, []),
    barberos: getItem(KEYS.BARBEROS, DEFAULT_BARBEROS),
    servicios: getItem(KEYS.SERVICIOS, DEFAULT_SERVICIOS),
    transacciones: getItem(KEYS.TRANSACCIONES, []),
    settings: getItem(KEYS.SETTINGS, DEFAULT_SETTINGS),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const date = new Date().toISOString().split("T")[0];
  a.href = url;
  a.download = `barbercontrol-backup-${date}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function restaurarRespaldo(jsonString: string) {
  try {
    const data = JSON.parse(jsonString);
    if (data.turnos) setItem(KEYS.TURNOS, data.turnos);
    if (data.barberos) setItem(KEYS.BARBEROS, data.barberos);
    if (data.servicios) setItem(KEYS.SERVICIOS, data.servicios);
    if (data.transacciones) setItem(KEYS.TRANSACCIONES, data.transacciones);
    if (data.settings) setItem(KEYS.SETTINGS, data.settings);
    return true;
  } catch (error) {
    console.error("Failed to parse backup JSON", error);
    return false;
  }
}
