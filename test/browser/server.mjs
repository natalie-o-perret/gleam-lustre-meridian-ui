import { createServer } from "node:http";
import { readFile, realpath } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const defaultRoot = fileURLToPath(new URL("../../", import.meta.url));
const types = {
  ".html": "text/html",
  ".mjs": "text/javascript",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".json": "application/json",
  ".gleam": "text/plain",
  ".txt": "text/plain",
};

export async function serve(directory = defaultRoot, prefix = "/") {
  const root = await realpath(directory);
  const server = createServer(async (request, response) => {
    try {
      let pathname = decodeURIComponent(
        new URL(request.url, "http://localhost").pathname,
      );
      if (
        request.method === "POST" &&
        ["/test/upload", "/test/upload-slow"].includes(pathname)
      ) {
        const chunks = [];
        let size = 0;
        for await (const chunk of request) {
          size += chunk.length;
          if (size > 1024 * 1024) {
            response.writeHead(413).end();
            return;
          }
          chunks.push(chunk);
        }
        const finish = () =>
          response
            .writeHead(200, { "Content-Type": "text/plain" })
            .end(Buffer.concat(chunks));
        if (pathname.endsWith("-slow")) {
          const timer = setTimeout(finish, 500);
          response.once("close", () => clearTimeout(timer));
        } else finish();
        return;
      }
      if (!pathname.startsWith(prefix)) {
        response.writeHead(404).end();
        return;
      }
      pathname = "/" + pathname.slice(prefix.length);
      if (pathname.endsWith("/")) pathname += "index.html";
      const path = await realpath(resolve(root, "." + pathname));
      if (
        !path.startsWith(root.endsWith(sep) ? root : root + sep) ||
        !types[extname(path)]
      ) {
        response.writeHead(403).end();
        return;
      }
      response.writeHead(200, {
        "Content-Type": types[extname(path)],
        "Cache-Control": "no-store",
      });
      response.end(await readFile(path));
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return {
    url: `http://127.0.0.1:${server.address().port}`,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}
