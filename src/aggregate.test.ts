import { expect, test, describe, afterAll, beforeEach } from "bun:test";
import {
  calculateAggregateResults,
  calculateMax,
  calculateMean,
  calculateMin,
  calculatePercentile,
  calculateStandardDeviation,
} from "./aggregate";
import { db, schema } from "../db";

describe("calculateMean", () => {
  test("mean of [1, 5]", () => {
    expect(calculateMean([1, 5])).toBe(3);
  });
});

describe("calculateStandardDeviation", () => {
  test("SD of [1, 5]", () => {
    expect(calculateStandardDeviation([1, 5])).toBe(2);
  });
});

describe("calculateMin", () => {
  test("min of [1, 5]", () => {
    expect(calculateMin([1, 5])).toBe(1);
  });
});

describe("calculateMax", () => {
  test("max of [1, 5]", () => {
    expect(calculateMax([1, 5])).toBe(5);
  });
});

describe("calculatePercentile", () => {
  test("P25 of [1, 5]", () => {
    expect(calculatePercentile([1, 5], 25)).toBe(2);
  });

  test("P50 of [1, 5]", () => {
    expect(calculatePercentile([1, 5], 50)).toBe(3);
  });

  test("P75 of [1, 5]", () => {
    expect(calculatePercentile([1, 5], 75)).toBe(4);
  });
});

describe("calculateAggregateResults", () => {
  beforeEach(async () => {
    await db.delete(schema.results);
    await db.delete(schema.students);
  });
  afterAll(async () => {
    await db.delete(schema.results);
    await db.delete(schema.students);
  });

  test("Aggregate of [{10, 20}]", async () => {
    await db.insert(schema.results).values({
      id: "123-5678",
      testId: 123,
      studentId: 5678,
      marksAvalilable: 20,
      marksObtained: 10,
      scannedAt: new Date(),
    });

    const res = await calculateAggregateResults(123);
    expect(res).toStrictEqual({
      mean: 50,
      stddev: 0,
      min: 50,
      max: 50,
      p25: 50,
      p50: 50,
      p75: 50,
      count: 1,
    });
  });

  test("Aggregate of 7/20 marks and 13/20 marks", async () => {
    await db.insert(schema.results).values([
      {
        id: "456-5678",
        testId: 456,
        studentId: 5678,
        marksAvalilable: 20,
        marksObtained: 7,
        scannedAt: new Date(),
      },
      {
        id: "456-9012",
        testId: 456,
        studentId: 9012,
        marksAvalilable: 20,
        marksObtained: 13,
        scannedAt: new Date(),
      },
    ]);

    const res = await calculateAggregateResults(456);
    expect(res).toStrictEqual({
      mean: 50,
      stddev: 15,
      min: 35,
      max: 65,
      p25: 42.5,
      p50: 50,
      p75: 57.5,
      count: 2,
    });
  });

  test("Aggregate of no marks for the test", async () => {
    const res = await calculateAggregateResults(4321);
    expect(res).toStrictEqual({});
  });
});
