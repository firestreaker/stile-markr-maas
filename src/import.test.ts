import { expect, test, describe, beforeAll, afterAll } from "bun:test";
import { XMLParser } from "fast-xml-parser";
import { importResults, parserJSON } from "./import";
import { db, schema } from "../db";

const parserXML = new XMLParser({
  ignoreAttributes: false,
  parseAttributeValue: true,
});

describe("parserJSON", () => {
  test("single result", () => {
    const parsedXML: unknown = parserXML.parse(`
<mcq-test-results>
    <mcq-test-result scanned-on="2017-12-04T12:12:10+11:00">
        <first-name>Jane</first-name>
        <last-name>Austen</last-name>
        <student-number>521585128</student-number>
        <test-id>1234</test-id>
        <summary-marks available="20" obtained="13" />
    </mcq-test-result>
</mcq-test-results>
`);

    expect(parserJSON(parsedXML)).toStrictEqual([
      {
        "first-name": "Jane",
        "last-name": "Austen",
        "student-number": 521585128,
        "test-id": 1234,
        "summary-marks": { "@_available": 20, "@_obtained": 13 },
        "@_scanned-on": "2017-12-04T12:12:10+11:00",
      },
    ]);
  });

  test("two results", () => {
    const parsedXML: unknown = parserXML.parse(`
<mcq-test-results>
    <mcq-test-result scanned-on="2017-12-04T12:12:10+11:00">
        <first-name>Jane</first-name>
        <last-name>Austen</last-name>
        <student-number>521585128</student-number>
        <test-id>1234</test-id>
        <summary-marks available="20" obtained="13" />
    </mcq-test-result>
	<mcq-test-result scanned-on="2017-11-03T11:11:09+11:00">
		<first-name>KJ</first-name>
		<last-name>Alysander</last-name>
		<student-number>002299</student-number>
		<test-id>9863</test-id>
		<summary-marks available="20" obtained="7" />
	</mcq-test-result>
</mcq-test-results>
`);

    expect(parserJSON(parsedXML)).toStrictEqual([
      {
        "first-name": "Jane",
        "last-name": "Austen",
        "student-number": 521585128,
        "test-id": 1234,
        "summary-marks": { "@_available": 20, "@_obtained": 13 },
        "@_scanned-on": "2017-12-04T12:12:10+11:00",
      },
      {
        "first-name": "KJ",
        "last-name": "Alysander",
        "student-number": 2299,
        "test-id": 9863,
        "summary-marks": { "@_available": 20, "@_obtained": 7 },
        "@_scanned-on": "2017-11-03T11:11:09+11:00",
      },
    ]);
  });

  test("no result", () => {
    const parsedXML: unknown = parserXML.parse(`
<mcq-test-results>
</mcq-test-results>
`);

    expect(parserJSON(parsedXML)).toStrictEqual([]);
  });

  test("no body", () => {
    const parsedXML: unknown = parserXML.parse("");

    expect(() => {
      parserJSON(parsedXML);
    }).toThrowError(new Error('"mcq-test-results" not found on the root node'));
  });

  test("missing attribute", () => {
    const parsedXML: unknown = parserXML.parse(`
        <mcq-test-results>
            <mcq-test-result scanned-on="2017-12-04T12:12:10+11:00">
                <first-name>Jane</first-name>
                <last-name>Austen</last-name>
                <student-number>521585128</student-number>
                <test-id>1234</test-id>
            </mcq-test-result>
        </mcq-test-results>
        `);

    expect(() => {
      parserJSON(parsedXML);
    }).toThrowError(
      new Error(
        "Invalid result provided, please validate if attributes are missing"
      )
    );
  });

  test("wrong attribute type", () => {
    const parsedXML: unknown = parserXML.parse(`
        <mcq-test-results>
            <mcq-test-result scanned-on="2017-12-04T12:12:10+11:00">
                <first-name>1234</first-name>
                <last-name>567890</last-name>
                <student-number>test</student-number>
                <test-id>1234</test-id>
                <summary-marks available="20" obtained="13" />
            </mcq-test-result>
        </mcq-test-results>
        `);

    expect(() => {
      parserJSON(parsedXML);
    }).toThrowError(
      new Error(
        "Invalid result provided, please validate if attributes are missing"
      )
    );
  });
});

describe("importResults", () => {
  beforeAll(async () => {
    await db.delete(schema.results);
    await db.delete(schema.students);
  });
  afterAll(async () => {
    await db.delete(schema.results);
    await db.delete(schema.students);
  });
  test("single result", async () => {
    await importResults([
      {
        "first-name": "Jane",
        "last-name": "Austen",
        "student-number": 5678,
        "test-id": 1234,
        "summary-marks": { "@_available": 20, "@_obtained": 13 },
        "@_scanned-on": "2017-12-04T12:12:10+11:00",
      },
    ]);
    await Bun.sleep(0); // db query seems to ignore the await
    const query = await db.select().from(schema.results);

    expect(query[0]).toMatchObject({
      id: "1234-5678",
      marksAvalilable: 20,
      marksObtained: 13,
      scannedAt: new Date("2017-12-04T01:12:10.000Z"),
      studentId: 5678,
      testId: 1234,
    });
  });

  test("does not replace lower marks for the same result", async () => {
    await importResults([
      {
        "first-name": "Jane",
        "last-name": "Austen",
        "student-number": 5678,
        "test-id": 1234,
        "summary-marks": { "@_available": 20, "@_obtained": 13 },
        "@_scanned-on": "2017-12-04T12:12:10+11:00",
      },
    ]);
    await importResults([
      {
        "first-name": "Jane",
        "last-name": "Austen",
        "student-number": 5678,
        "test-id": 1234,
        "summary-marks": { "@_available": 19, "@_obtained": 12 },
        "@_scanned-on": "2017-12-04T12:12:10+11:00",
      },
    ]);
    await Bun.sleep(0); // db query seems to ignore the await
    const query = await db.select().from(schema.results);

    expect(query[0]).toMatchObject({
      id: "1234-5678",
      marksAvalilable: 20,
      marksObtained: 13,
      scannedAt: new Date("2017-12-04T01:12:10.000Z"),
      studentId: 5678,
      testId: 1234,
    });
  });

  test("does not replace lower marks for the same result in the same request", async () => {
    await importResults([
      {
        "first-name": "Jane",
        "last-name": "Austen",
        "student-number": 5678,
        "test-id": 1234,
        "summary-marks": { "@_available": 20, "@_obtained": 13 },
        "@_scanned-on": "2017-12-04T12:12:10+11:00",
      },
      {
        "first-name": "Jane",
        "last-name": "Austen",
        "student-number": 5678,
        "test-id": 1234,
        "summary-marks": { "@_available": 19, "@_obtained": 12 },
        "@_scanned-on": "2017-12-04T12:12:10+11:00",
      },
    ]);
    await Bun.sleep(0); // db query seems to ignore the await
    const query = await db.select().from(schema.results);

    expect(query[0]).toMatchObject({
      id: "1234-5678",
      marksAvalilable: 20,
      marksObtained: 13,
      scannedAt: new Date("2017-12-04T01:12:10.000Z"),
      studentId: 5678,
      testId: 1234,
    });
  });

  test("replaces higher marks for the same result", async () => {
    await importResults([
      {
        "first-name": "Jane",
        "last-name": "Austen",
        "student-number": 5678,
        "test-id": 1234,
        "summary-marks": { "@_available": 20, "@_obtained": 13 },
        "@_scanned-on": "2017-12-04T12:12:10+11:00",
      },
    ]);
    await importResults([
      {
        "first-name": "Jane",
        "last-name": "Austen",
        "student-number": 5678,
        "test-id": 1234,
        "summary-marks": { "@_available": 21, "@_obtained": 14 },
        "@_scanned-on": "2017-12-04T12:12:10+11:00",
      },
    ]);
    await Bun.sleep(0); // db query seems to ignore the await
    const query = await db.select().from(schema.results);

    expect(query[0]).toMatchObject({
      id: "1234-5678",
      marksAvalilable: 21,
      marksObtained: 14,
      scannedAt: new Date("2017-12-04T01:12:10.000Z"),
      studentId: 5678,
      testId: 1234,
    });
  });

  test("replaces higher marks for the same result in the same request", async () => {
    await importResults([
      {
        "first-name": "Jane",
        "last-name": "Austen",
        "student-number": 5678,
        "test-id": 1234,
        "summary-marks": { "@_available": 20, "@_obtained": 13 },
        "@_scanned-on": "2017-12-04T12:12:10+11:00",
      },
      {
        "first-name": "Jane",
        "last-name": "Austen",
        "student-number": 5678,
        "test-id": 1234,
        "summary-marks": { "@_available": 21, "@_obtained": 14 },
        "@_scanned-on": "2017-12-04T12:12:10+11:00",
      },
    ]);
    await Bun.sleep(0); // db query seems to ignore the await
    const query = await db.select().from(schema.results);

    expect(query[0]).toMatchObject({
      id: "1234-5678",
      marksAvalilable: 21,
      marksObtained: 14,
      scannedAt: new Date("2017-12-04T01:12:10.000Z"),
      studentId: 5678,
      testId: 1234,
    });
  });
});
