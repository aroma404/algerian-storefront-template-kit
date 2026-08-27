import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer as createViteServer } from "vite";
import react from "@vitejs/plugin-react";
import { createStorefrontApp } from "./index";

const serverDirectory = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.resolve(serverDirectory, "../client");
const app = createStorefrontApp({ serveClient: false, development: true });
const vite = await createViteServer({ root: clientRoot, configFile: false, plugins: [react()], server: { middlewareMode: true, allowedHosts: true }, appType: "spa" });
app.use(vite.middlewares);
app.use("*", async (req, res, next) => {
  try {
    const html = await readFile(path.join(clientRoot, "index.html"), "utf8");
    res.status(200).set({ "Content-Type": "text/html" }).end(await vite.transformIndexHtml(req.originalUrl, html));
  } catch (error) { next(error); }
});
app.listen(process.env.PORT || 3000, () => console.log("Storefront development server ready"));
