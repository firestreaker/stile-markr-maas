import { eq } from "drizzle-orm";
import { db, schema } from "../db";

export interface ITestResult {
  "first-name": string;
  "last-name": string;
  "student-number": number;
  "test-id": number;
  "summary-marks": {
    "@_available": number;
    "@_obtained": number;
  };
  "@_scanned-on": string;
}

// helper function to allow access to confirmed existing properties
function hasOwnProperty<X extends {}, Y extends PropertyKey>(
  obj: X,
  prop: Y
): obj is X & Record<Y, unknown> {
  return Object.hasOwn(obj, prop);
}

export const parserJSON = (body: unknown): ITestResult[] => {
  // parse root node for "mcq-test-results"
  if (
    !body ||
    typeof body !== "object" ||
    !hasOwnProperty(body, "mcq-test-results")
  ) {
    throw '"mcq-test-results" not found on the root node';
  }

  let results: unknown[] = [];

  // parse next node for "mcq-test-result"
  if (
    body["mcq-test-results"] &&
    hasOwnProperty(body["mcq-test-results"], "mcq-test-result") &&
    body["mcq-test-results"]["mcq-test-result"]
  ) {
    if (Array.isArray(body["mcq-test-results"]["mcq-test-result"])) {
      results = body["mcq-test-results"]["mcq-test-result"];
    } else if (
      typeof body["mcq-test-results"]["mcq-test-result"] === "object"
    ) {
      // single entry does not instantiate to array
      results = [body["mcq-test-results"]["mcq-test-result"]];
    } else {
      return [];
    }
  }

  // validate structure of results
  return results.map((result) => {
    if (
      !(
        result &&
        typeof result === "object" &&
        hasOwnProperty(result, "first-name") &&
        typeof result["first-name"] === "string" &&
        hasOwnProperty(result, "last-name") &&
        typeof result["last-name"] === "string" &&
        hasOwnProperty(result, "student-number") &&
        typeof result["student-number"] === "number" &&
        hasOwnProperty(result, "test-id") &&
        typeof result["test-id"] === "number" &&
        hasOwnProperty(result, "summary-marks") &&
        typeof result["summary-marks"] === "object" &&
        result["summary-marks"] &&
        hasOwnProperty(result["summary-marks"], "@_available") &&
        typeof result["summary-marks"]["@_available"] === "number" &&
        hasOwnProperty(result["summary-marks"], "@_obtained") &&
        typeof result["summary-marks"]["@_obtained"] === "number" &&
        hasOwnProperty(result, "@_scanned-on") &&
        typeof result["@_scanned-on"] === "string"
      )
    ) {
      throw "Invalid result provided, please validate if attributes are missing";
    }

    return { ...result } as ITestResult;
  });
};

export const importResults = async (results: ITestResult[]) => {
  results.map(async (result) => {
    await db.transaction(async (tx) => {
      // insert students
      await tx
        .insert(schema.students)
        .values({
          id: result["student-number"],
          firstName: result["first-name"],
          lastName: result["last-name"],
        })
        .onConflictDoUpdate({
          target: schema.students.id,
          set: {
            firstName: result["first-name"],
            lastName: result["last-name"],
          },
        });

      // attempt insert results
      const insertAttempt = await tx
        .insert(schema.results)
        .values({
          id: `${result["test-id"]}-${result["student-number"]}`,
          testId: result["test-id"],
          studentId: result["student-number"],
          marksAvalilable: result["summary-marks"]["@_available"],
          marksObtained: result["summary-marks"]["@_obtained"],
          scannedAt: new Date(result["@_scanned-on"]),
        })
        .onConflictDoNothing()
        .returning();

      //if conflict/existing results found
      if (!insertAttempt.length) {
        const [existingResult] = await tx
          .select()
          .from(schema.results)
          .where(
            eq(
              schema.results.id,
              `${result["test-id"]}-${result["student-number"]}`
            )
          );

        let updatedValues: {
          marksAvalilable?: number;
          marksObtained?: number;
        } = {};
        if (
          result["summary-marks"]["@_available"] >
          existingResult.marksAvalilable
        ) {
          updatedValues.marksAvalilable =
            result["summary-marks"]["@_available"];
        }
        if (
          result["summary-marks"]["@_obtained"] > existingResult.marksObtained
        ) {
          updatedValues.marksObtained = result["summary-marks"]["@_obtained"];
        }

        // update if newer marks are higher
        if (updatedValues.marksAvalilable || updatedValues.marksObtained) {
          await tx
            .update(schema.results)
            .set(updatedValues)
            .where(
              eq(
                schema.results.id,
                `${result["test-id"]}-${result["student-number"]}`
              )
            );
        }
      }
    });
  });
};
