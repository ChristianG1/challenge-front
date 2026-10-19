"use client";

import { TRANSFER_SCENARIOS } from "@/domain/contracts";
import type { ScenarioChoice } from "../use-transfer-flow";

const SCENARIO_LABELS: Record<ScenarioChoice, string> = {
  random: "Aleatorio",
  success: "Éxito",
  network_error: "Error de red",
  insufficient_funds: "Fondos insuficientes",
  timeout: "Timeout",
  unknown_error: "Error desconocido",
};

interface DemoScenarioPickerProps {
  value: ScenarioChoice;
  onChange: (value: ScenarioChoice) => void;
}

export function DemoScenarioPicker({ value, onChange }: DemoScenarioPickerProps) {
  return (
    <label className="flex flex-col gap-1.5 rounded-xl border border-dashed border-ink-200 p-3 text-xs text-ink-600">
      <span>
        <strong>Modo demo:</strong> resultado simulado del servidor
      </span>
      <select
        name="scenario"
        aria-label="Escenario simulado"
        value={value}
        onChange={(e) => onChange(e.target.value as ScenarioChoice)}
        className="h-9 rounded-lg bg-white px-2 text-sm ring-1 ring-ink-200"
      >
        {(["random", ...TRANSFER_SCENARIOS] as const).map((s) => (
          <option key={s} value={s}>
            {SCENARIO_LABELS[s]}
          </option>
        ))}
      </select>
    </label>
  );
}
