"use client";

import { useState, useTransition } from "react";
import type { StageData } from "@/data/results/catalog";
import { ResultsSkeleton } from "./results-skeleton";
import { StageTabs } from "./stage-tabs";

type RoleTabsProps = {
  leaders: StageData[];
  followers: StageData[];
};

const roles = [
  { id: "leaders", label: "Leaders" },
  { id: "followers", label: "Followers" },
] as const;

type RoleId = (typeof roles)[number]["id"];

export function RoleTabs({ leaders, followers }: RoleTabsProps) {
  const [active, setActive] = useState<RoleId>("leaders");
  const [mountedIds, setMountedIds] = useState<ReadonlySet<RoleId>>(() => new Set(["leaders"]));
  const [, startTransition] = useTransition();
  const stages = { leaders, followers };

  function selectRole(id: RoleId) {
    setActive(id);
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
    <div className="flex flex-col gap-6">
      <div role="tablist" aria-label="Division" className="flex flex-wrap justify-center gap-3">
        {roles.map((role) => {
          const selected = role.id === active;
          return (
            <button
              key={role.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => selectRole(role.id)}
              className={`cursor-pointer rounded-full px-5 py-2.5 text-base font-semibold transition-colors duration-200 sm:px-10 sm:py-3.5 sm:text-lg ${
                selected
                  ? "bg-zinc-700 text-white"
                  : "bg-zinc-800 text-zinc-100 ring-1 ring-zinc-700 hover:bg-zinc-700"
              }`}
            >
              {role.label}
            </button>
          );
        })}
      </div>

      {roles.map((role) =>
        mountedIds.has(role.id) ? (
          <div key={role.id} hidden={role.id !== active}>
            <StageTabs label={role.label} stages={stages[role.id]} />
          </div>
        ) : null,
      )}
      {mountedIds.has(active) ? null : <ResultsSkeleton />}
    </div>
  );
}
