import type { ResultRow } from "@/lib/placement";
import followersFinal from "./followers/final.json";
import followersPre from "./followers/pre.json";
import followersQuaters from "./followers/quaters.json";
import followersSemi from "./followers/semi.json";
import leadersFinal from "./leaders/final.json";
import leadersPre from "./leaders/pre.json";
import leadersQuaters from "./leaders/quaters.json";
import leadersSemi from "./leaders/semi.json";

export type StageData = {
  id: string;
  label: string;
  judges: string[];
  rows: ResultRow[];
};

const labels: Record<string, string> = {
  pre: "Pre",
  quaters: "Quarterfinals",
  semi: "Semifinals",
  final: "Final",
};

function asStage(file: { id: string; judges: string[]; rows: ResultRow[] }): StageData {
  return {
    id: file.id,
    label: labels[file.id] ?? file.id,
    judges: file.judges,
    rows: file.rows,
  };
}

export const leaderStages: StageData[] = [
  asStage(leadersPre),
  asStage(leadersQuaters),
  asStage(leadersSemi),
  asStage(leadersFinal),
];

export const followerStages: StageData[] = [
  asStage(followersPre),
  asStage(followersQuaters),
  asStage(followersSemi),
  asStage(followersFinal),
];
