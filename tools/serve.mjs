import { createReadStream } from "node:fs";
import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const port = Number(process.env.PORT || 8080);

const contentTypes = {
    ".css": "text/css; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".md": "text/markdown; charset=utf-8",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".webp": "image/webp"
};

function resolvePath(urlPathname) {
    const safePath = decodeURIComponent(urlPathname.split("?")[0]);
    const requested = safePath === "/" ? "/index.html" : safePath;
    const absolutePath = path.normalize(path.join(root, requested));
    return absolutePath.startsWith(root) ? absolutePath : null;
}

const server = http.createServer(async (request, response) => {
    const absolutePath = resolvePath(request.url || "/");
    if (!absolutePath) {
        response.writeHead(403);
        response.end("Forbidden");
        return;
    }

    try {
        const stats = await fs.stat(absolutePath);
        const filePath = stats.isDirectory() ? path.join(absolutePath, "index.html") : absolutePath;
        const ext = path.extname(filePath).toLowerCase();
        response.writeHead(200, {
            "Content-Type": contentTypes[ext] || "application/octet-stream",
            "Cache-Control": ext === ".webp" ? "public, max-age=31536000, immutable" : "no-cache"
        });
        createReadStream(filePath).pipe(response);
    } catch {
        response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        response.end("Not found");
    }
});

server.listen(port, () => {
    console.log(`Hill Cruze available at http://localhost:${port}`);
});
