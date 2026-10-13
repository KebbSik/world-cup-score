const HEAD_JUDGE_INDEX = 0;
const HEAD_JUDGE_NAME = "Gero R.R";

export type ResultRow = {
  rank: number;
  name: string;
  country: string;
  advances: boolean;
  confirmedAt: number;
  majority: number;
  placements: number[];
};

type Scored = {
  index: number;
  count: number;
  sum: number;
  head: number;
};

export function ordinal(value: number): string {
  const mod100 = value % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${value}th`;
  switch (value % 10) {
    case 1:
      return `${value}st`;
    case 2:
      return `${value}nd`;
    case 3:
      return `${value}rd`;
    default:
      return `${value}th`;
  }
}

function countAtMost(placements: number[], top: number): number {
  return placements.filter((place) => place <= top).length;
}

function formatSumList(sums: number[]): string {
  if (sums.length === 1) return String(sums[0]);
  if (sums.length === 2) return `${sums[0]} and ${sums[1]}`;
  return `${sums.slice(0, -1).join(", ")}, and ${sums[sums.length - 1]}`;
}

function majorityNeeded(judgeCount: number): number {
  return Math.floor(judgeCount / 2) + 1;
}

function placeTaken(place: number, top: number, count: number, judgeCount: number): string {
  return `${ordinal(place)} place taken at Top ${top}: ${count}/${judgeCount} judges placed them at ${ordinal(top)} or better, counting only the dancers still unplaced at that point.`;
}

function sumTie(place: number, top: number, count: number, winnerSum: number, otherSums: number[]): string {
  return `Tied for ${ordinal(place)} place at Top ${top} (${count} judges each). Separated by the sum of judges' rankings, lower wins: ${winnerSum} beat ${formatSumList(otherSums)}.`;
}

function headJudgeDecision(
  place: number,
  top: number,
  count: number,
  judgeCount: number,
  sum: number,
  headRank: number,
  headJudgeName: string,
): string[] {
  return [
    placeTaken(place, top, count, judgeCount),
    `Tie-breaker 1 · Ordinal sum ${sum}.`,
    `Tie-breaker 2 · Head judge decision (${headJudgeName}) — best head-judge rank ${ordinal(headRank)}.`,
  ];
}

export type ScoredRow<T extends ResultRow> = T & { steps: string[] };

export function scoreResults<T extends ResultRow>(
  rows: T[],
  advanceLimit: number,
  headJudgeName: string = HEAD_JUDGE_NAME,
): ScoredRow<T>[] {
  const judgeCount = rows[0]?.placements.length ?? 0;
  const majority = majorityNeeded(judgeCount);
  const stepsByIndex = new Map<number, string[]>();
  const metaByIndex = new Map<number, { rank: number; confirmedAt: number; majority: number }>();
  const pending = new Map<number, string[]>();
  const unplaced = rows.map((_, index) => index);
  let place = 1;

  const remember = (index: number, lines: string[]) => {
    pending.set(index, [...(pending.get(index) ?? []), ...lines]);
  };

  const award = (index: number, top: number, count: number, lines: string[], rivals: number[]) => {
    stepsByIndex.set(index, [...(pending.get(index) ?? []), ...lines]);
    metaByIndex.set(index, { rank: place, confirmedAt: top, majority: count });
    pending.delete(index);
    for (const rival of rivals) remember(rival, lines);
    unplaced.splice(unplaced.indexOf(index), 1);
    place += 1;
  };

  while (unplaced.length > 0) {
    let pool = [...unplaced];
    let top = 0;
    let awarded = false;

    while (top < rows.length && !awarded) {
      top += 1;
      const scored: Scored[] = pool.map((index) => ({
        index,
        count: countAtMost(rows[index].placements, top),
        sum: rows[index].placements.reduce((total, value) => total + value, 0),
        head: rows[index].placements[HEAD_JUDGE_INDEX],
      })).filter((dancer) => dancer.count >= majority);

      if (scored.length === 0) continue;

      const bestCount = Math.max(...scored.map((dancer) => dancer.count));
      const tied = scored.filter((dancer) => dancer.count === bestCount);

      if (tied.length === 1) {
        award(tied[0].index, top, tied[0].count, [placeTaken(place, top, tied[0].count, judgeCount)], []);
        awarded = true;
        break;
      }

      const bestSum = Math.min(...tied.map((dancer) => dancer.sum));
      const sumTied = tied.filter((dancer) => dancer.sum === bestSum);

      if (sumTied.length === 1) {
        const winner = sumTied[0];
        const otherSums = tied
          .filter((dancer) => dancer.index !== winner.index)
          .map((dancer) => dancer.sum)
          .sort((left, right) => left - right);
        award(
          winner.index,
          top,
          winner.count,
          [sumTie(place, top, winner.count, winner.sum, otherSums)],
          tied.filter((dancer) => dancer.index !== winner.index).map((dancer) => dancer.index),
        );
        awarded = true;
        break;
      }

      const bestHead = Math.min(...sumTied.map((dancer) => dancer.head));
      const headTied = sumTied.filter((dancer) => dancer.head === bestHead);

      if (headTied.length === 1) {
        const winner = headTied[0];
        award(
          winner.index,
          top,
          winner.count,
          headJudgeDecision(place, top, winner.count, judgeCount, winner.sum, winner.head, headJudgeName),
          sumTied.filter((dancer) => dancer.index !== winner.index).map((dancer) => dancer.index),
        );
        awarded = true;
        break;
      }

      pool = headTied.map((dancer) => dancer.index);
    }

    if (!awarded) {
      const sharedPlace = place;
      const lines = [
        `Shared ${ordinal(sharedPlace)} place: these dancers stayed tied after majority, ordinal sum, and the head judge.`,
      ];
      for (const index of pool) {
        stepsByIndex.set(index, [...(pending.get(index) ?? []), ...lines]);
        metaByIndex.set(index, { rank: sharedPlace, confirmedAt: rows.length, majority });
        unplaced.splice(unplaced.indexOf(index), 1);
      }
      place += pool.length;
    }
  }

  return rows
    .map((row, index) => {
      const meta = metaByIndex.get(index);
      if (!meta) throw new Error(`Missing placement for ${row.name}.`);
      return {
        ...row,
        rank: meta.rank,
        confirmedAt: meta.confirmedAt,
        majority: meta.majority,
        advances: meta.rank <= advanceLimit,
        steps: stepsByIndex.get(index) ?? [],
        placements: [...row.placements],
      };
    })
    .sort((left, right) => left.rank - right.rank || left.name.localeCompare(right.name));
}

export function moveJudgePlacement<T extends ResultRow>(
  rows: T[],
  dancerIndex: number,
  judgeIndex: number,
  targetRank: number,
): T[] {
  const next = rows.map((row) => ({ ...row, placements: [...row.placements] }));
  const column = next.map((row) => row.placements[judgeIndex]);
  const others = next
    .map((_, index) => index)
    .filter((index) => index !== dancerIndex)
    .sort((left, right) => column[left] - column[right] || left - right);

  const groups: number[][] = [];
  for (const index of others) {
    const last = groups[groups.length - 1];
    if (last && column[last[0]] === column[index]) last.push(index);
    else groups.push([index]);
  }

  let countBefore = 0;
  let insertAt = groups.length;
  for (let groupIndex = 0; groupIndex < groups.length; groupIndex += 1) {
    if (countBefore + 1 >= targetRank) {
      insertAt = groupIndex;
      break;
    }
    countBefore += groups[groupIndex].length;
  }
  groups.splice(insertAt, 0, [dancerIndex]);

  let seen = 0;
  for (const group of groups) {
    const rank = seen + 1;
    for (const index of group) next[index].placements[judgeIndex] = rank;
    seen += group.length;
  }

  return next;
}
