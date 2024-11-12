import { expect, test, describe, afterAll, beforeAll } from "bun:test";
import { fetch } from "./router";
import { db, schema } from "../db";

beforeAll(async () => {
  await db.delete(schema.results);
  await db.delete(schema.students);
});
afterAll(async () => {
  await db.delete(schema.results);
  await db.delete(schema.students);
});

describe("/", () => {
  test("it works", async () => {
    const req = new Request("http://localhost");
    const expected = new Response("ok");

    const res = await fetch(req);
    expect(res.ok).toBe(expected.ok);
    expect(res.status).toBe(expected.status);
    Promise.all([res.text(), expected.text()]).then(([t1, t2]) => {
      expect(t1).toBe(t2);
    });
  });
});

// code coverage marks these tests as covering import.ts
describe("/import", () => {
  test("single result", async () => {
    const req = new Request("http://localhost/import", {
      method: "POST",
      headers: { "content-type": "text/xml+markr" },
      body: `
<mcq-test-results>
    <mcq-test-result scanned-on="2017-12-04T12:12:10+11:00">
        <first-name>Jane</first-name>
        <last-name>Austen</last-name>
        <student-number>521585128</student-number>
        <test-id>1234</test-id>
        <summary-marks available="20" obtained="13" />
    </mcq-test-result>
</mcq-test-results>
`,
    });
    const expected = new Response(null, { status: 201 });

    const res = await fetch(req);
    expect(res.ok).toBe(expected.ok);
    expect(res.status).toBe(expected.status);
    Promise.all([res.text(), expected.text()]).then(([t1, t2]) => {
      expect(t1).toBe(t2);
    });
  });

  test("empty body", async () => {
    const req = new Request("http://localhost/import", {
      method: "POST",
      headers: { "content-type": "text/xml+markr" },
      body: `
`,
    });
    const expected = new Response(
      '"mcq-test-results" not found on the root node',
      { status: 400 }
    );

    const res = await fetch(req);
    expect(res.ok).toBe(expected.ok);
    expect(res.status).toBe(expected.status);
    Promise.all([res.text(), expected.text()]).then(([t1, t2]) => {
      expect(t1).toBe(t2);
    });
  });

  test("Only allows POST method", async () => {
    const req = new Request("http://localhost/import");
    const expected = new Response(null, {
      status: 405,
      headers: { allow: "POST" },
    });

    const res = await fetch(req);
    expect(res.ok).toBe(expected.ok);
    expect(res.status).toBe(expected.status);
    expect(res.headers).toStrictEqual(expected.headers);
    Promise.all([res.text(), expected.text()]).then(([t1, t2]) => {
      expect(t1).toBe(t2);
    });
  });

  test("Only allows text/xml+markr content type", async () => {
    const req = new Request("http://localhost/import", { method: "POST" });
    const expected = new Response(
      "Only 'text/xml+markr' content types supported.",
      {
        status: 406,
      }
    );

    const res = await fetch(req);
    expect(res.ok).toBe(expected.ok);
    expect(res.status).toBe(expected.status);
    Promise.all([res.text(), expected.text()]).then(([t1, t2]) => {
      expect(t1).toStrictEqual(t2);
    });
  });
});

describe("/results/:test-id/aggregate", () => {
  test("it works", async () => {
    await db.insert(schema.results).values({
      id: "123-5678",
      testId: 123,
      studentId: 5678,
      marksAvalilable: 20,
      marksObtained: 10,
      scannedAt: new Date(),
    });
    const req = new Request("http://localhost/results/123/aggregate");
    const expected = Response.json({
      mean: 50,
      stddev: 0,
      min: 50,
      max: 50,
      p25: 50,
      p50: 50,
      p75: 50,
      count: 1,
    });

    const res = await fetch(req);
    expect(res.ok).toBe(expected.ok);
    expect(res.status).toBe(expected.status);
    Promise.all([res.json(), expected.json()]).then(([t1, t2]) => {
      expect(t1).toStrictEqual(t2);
    });
  });
});

describe("other pages", () => {
  test("it works", async () => {
    const req = new Request("http://localhost/404");
    const expected = new Response("Page not found", { status: 404 });

    const res = await fetch(req);
    expect(res.ok).toBe(expected.ok);
    expect(res.status).toBe(expected.status);
    Promise.all([res.text(), expected.text()]).then(([t1, t2]) => {
      expect(t1).toBe(t2);
    });
  });
});
