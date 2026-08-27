import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({ plugins: [react()], root: "client", server: { allowedHosts: true }, build: { outDir: "../dist/client", emptyOutDir: true } });
