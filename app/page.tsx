import { followerStages, leaderStages } from "@/data/results/catalog";
import { RoleTabs } from "./role-tabs";

export default function Home() {
  return (
    <div className="min-h-full overflow-x-hidden text-zinc-50">
      <main className="mx-auto flex w-full max-w-360 flex-col gap-6 px-3 py-6 sm:gap-10 sm:px-6 sm:py-8 lg:px-8">
        <header className="text-center">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-300">
            Relative placement
          </p>
          <h1 className="mx-auto mt-1 max-w-4xl text-2xl font-semibold tracking-tight text-balance sm:text-3xl lg:text-4xl">
            Bachata Social World Cup 2026 Results Calculator
          </h1>
        </header>
        <RoleTabs leaders={leaderStages} followers={followerStages} />
      </main>
    </div>
  );
}
