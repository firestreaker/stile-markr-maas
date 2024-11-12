import { fetch } from "./src/router";

export const server = Bun.serve({
  port: 4567,
  fetch,
  error({ name, message }) {
    return Response.json({ name, message }, { status: 500 });
  },
});

console.log(`Listening on http://localhost:${server.port} ...`);
