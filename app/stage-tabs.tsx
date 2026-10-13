"use client";

import { useState, useTransition } from "react";
import type { StageData } from "@/data/results/catalog";
import { ResultsSkeleton } from "./results-skeleton";
import { ResultsTable } from "./results-table";

type StageTabsProps = {
  label: string;
  stages: StageData[];
};

export function StageTabs({ label, stages }: StageTabsProps) {
  const firstId = stages[0]?.id ?? "";
  const [activeId, setActiveId] = useState(firstId);
  const [mountedIds, setMountedIds] = useState<ReadonlySet<string>>(() => new Set([firstId]));
  const [, startTransition] = useTransition();

  function selectStage(id: string) {
    setActiveId(id);
    if (mountedIds.has(id)) return;
    startTransition(() => {
      setMountedIds((current) => {
        if (current.has(id)) return current;
        const next = new Set(current);
        next.add(id);
        return next;
      });
    });
  }

  return (
    <section className="flex flex-col gap-4">
      <div role="tablist" aria-label={label} className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
        {stages.map((stage) => {
          const selected = stage.id === activeId;
          return (
            <button
              key={stage.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => selectStage(stage.id)}
              className={`shrink-0 cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                selected
                  ? "bg-zinc-700 text-white"
                  : "bg-zinc-800 text-zinc-100 ring-1 ring-zinc-700 hover:bg-zinc-700"
              }`}
            >
              {stage.label}
            </button>
          );
        })}
      </div>

      {stages.map((stage) =>
        mountedIds.has(stage.id) ? (
          <div
            key={stage.id}
            hidden={stage.id !== activeId}
            className={stage.id === activeId ? "panel-in" : undefined}
          >
            <ResultsTable judges={stage.judges} source={stage.rows} />
          </div>
        ) : null,
      )}
      {mountedIds.has(activeId) ? null : <ResultsSkeleton />}
    </section>
  );
}
