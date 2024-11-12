import { eq, getTableColumns } from "drizzle-orm";
import { db, schema } from "../db";

export const calculateMean = (marks: number[]) => {
  const total = marks.reduce(
    (accumulator, currentValue) => accumulator + currentValue
  );
  return total / marks.length;
};

export const calculateStandardDeviation = (marks: number[]) => {
  const count = marks.length;
  const mean =
    marks.reduce((accumulator, currentValue) => accumulator + currentValue) /
    count;
  return Math.sqrt(
    marks.map((m) => Math.pow(m - mean, 2)).reduce((a, b) => a + b) /
      count
  );
};

export const calculateMin = (marks: number[]) => {
  const min = marks.reduce((accumulator, currentValue) =>
    currentValue < accumulator ? currentValue : accumulator
  );
  return min;
};

export const calculateMax = (marks: number[]) => {
  const max = marks.reduce((accumulator, currentValue) =>
    currentValue > accumulator ? currentValue : accumulator
  );
  return max;
};

export const calculatePercentile = (marks: number[], quantile: number) => {
  const sorted = marks.sort((a, b) => a - b);
  const position = ((sorted.length - 1) * quantile) / 100;
  const base = Math.floor(position);
  const rest = position - base;
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  } else {
    return sorted[base];
  }
};

export const calculateAggregateResults = async (testId: number) => {
  const { marksObtained, marksAvalilable } = getTableColumns(schema.results);
  const query = await db
    .select({ marksObtained, marksAvalilable })
    .from(schema.results)
    .where(eq(schema.results.testId, testId));

  const marks = query.map((m) => (m.marksObtained / m.marksAvalilable) * 100);

  // technically empty set should return null/undefined instead of 0
  if (marks.length === 0) return {};

  return {
    mean: calculateMean(marks),
    stddev: calculateStandardDeviation(marks), // SD of the percentages, not marks obtained
    min: calculateMin(marks),
    max: calculateMax(marks),
    p25: calculatePercentile(marks, 25),
    p50: calculatePercentile(marks, 50),
    p75: calculatePercentile(marks, 75),
    count: marks.length,
  };
};
