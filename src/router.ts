import { XMLParser } from "fast-xml-parser";
import { db, schema } from "../db";
import { calculateAggregateResults } from "./aggregate";
import { importResults, parserJSON} from "./import";

const parserXML = new XMLParser({
  ignoreAttributes: false,
  parseAttributeValue: true,
});

export async function fetch(request: Request) {
  const path = new URL(request.url).pathname;

  if (path === "/") return new Response("ok");

  if (path === "/delete") {
    await db.delete(schema.students);
    await db.delete(schema.results);

    return new Response("ok");
  }

  if (path === "/results") {
    const x = await db.select().from(schema.results);
    console.log(x);
    return Response.json(x);
  }

  if (path === "/import") {
    if (request.method !== "POST") {
      return new Response(null, { status: 405, headers: { allow: "POST" } });
    }
    const contentType = request.headers.get("Content-Type");
    if (contentType !== "text/xml+markr") {
      return new Response("Only 'text/xml+markr' content types supported.", {
        status: 406,
      });
    }

    try {
      const parsedXML: unknown = parserXML.parse(await request.text()); // parse XML to unknown JSON
      const results = parserJSON(parsedXML); // parse and validate unknown JSON to known type
      await importResults(results);
    } catch (err) {
      // we won't need this if we had the time to extend the error classes
      if (typeof err === "string") {
        return new Response(err, { status: 400 });
      }
      throw err;
    }

    return new Response(null, { status: 201 });
  }

  const matchResultPath = path.match(/\/results\/(\d+)\/(aggregate$)/);
  if (matchResultPath) {
    const testId = Number(matchResultPath[1]);
    const response = await calculateAggregateResults(testId);

    return Response.json(response);
  }

  return new Response("Page not found", { status: 404 });
}
