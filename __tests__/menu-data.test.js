import { MENU_GROUPS, SITE } from "../app/site.config.js";

describe("menu data integrity", () => {
  test("has at least one group with items", () => {
    expect(Array.isArray(MENU_GROUPS)).toBe(true);
    expect(MENU_GROUPS.length).toBeGreaterThan(0);
    expect(MENU_GROUPS.every((g) => Array.isArray(g.items))).toBe(true);
  });

  test("every menu item has id, name and price", () => {
    for (const group of MENU_GROUPS) {
      for (const item of group.items) {
        expect(item.id).toBeTruthy();
        expect(item.name).toBeTruthy();
        expect(item.price).toBeTruthy();
      }
    }
  });

  test("menu item ids are unique", () => {
    const ids = MENU_GROUPS.flatMap((g) => g.items.map((i) => i.id));
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("site config", () => {
  test("canonical website is an https URL", () => {
    expect(SITE.website).toMatch(/^https:\/\//);
  });
});
