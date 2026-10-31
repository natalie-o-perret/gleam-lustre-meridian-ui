import { serve } from "../test/browser/server.mjs";

const server = await serve("dist", "/gleam-lustre-meridian-ui/");
console.log(`Catalogue: ${server.url}/gleam-lustre-meridian-ui/`);
for (const signal of ["SIGINT", "SIGTERM"])
  process.once(signal, async () => {
    await server.close();
    process.exit(0);
  });
