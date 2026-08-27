import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { coreRegistry } from "../client/src/core/registry";

describe("core registry facade", () => {
  it("exposes store, navigation, plugins, commerce and template loading from one core entry point", () => {
    expect(coreRegistry.store.templateId).toBe(coreRegistry.template.id);
    expect(coreRegistry.navigation.routes).toContain("/checkout");
    expect(coreRegistry.plugins.has("announcement-bar")).toBe(true);
    expect(coreRegistry.templates.ids).toContain(coreRegistry.template.id);
    expect(typeof coreRegistry.commerce.api.order).toBe("function");
  });

  it("contains no external database dependency or migration command", async () => {
    const packageJson = await readFile(path.resolve(process.cwd(), "package.json"), "utf8");
    const environmentTemplate = await readFile(path.resolve(process.cwd(), ".env.example"), "utf8");
    expect(packageJson).not.toContain("mysql2");
    expect(packageJson).not.toContain("db:migrate");
    expect(environmentTemplate).not.toContain("DATABASE_URL");
  });
});
