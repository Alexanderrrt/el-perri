const { MENU, SITE, localizedPath } = require("../app/content");

describe("El Gran Tamal Colombiano content", () => {
  test("has the published 31/15/20 menu structure", () => {
    expect(MENU.map((section) => section.items.length)).toEqual([31, 15, 20]);
  });

  test("every menu item has a unique id, price, and both languages", () => {
    const items = MENU.flatMap((section) => section.items);
    expect(new Set(items.map((entry) => entry.id)).size).toBe(items.length);
    for (const entry of items) {
      expect(entry.id).toBeTruthy();
      expect(entry.name).toBeTruthy();
      expect(entry.price).toMatch(/^\$\d+(?:\.\d{2})?$/);
      expect(entry.description.es).toBeTruthy();
      expect(entry.description.en).toBeTruthy();
    }
  });

  test("business links and locale routes are production-safe", () => {
    expect(SITE.website).toBe("https://elgrantamalcolombianoca.com");
    expect(SITE.phoneHref).toBe("tel:+15599436954");
    expect(SITE.whatsapp).toBe("https://wa.me/15599436954");
    expect(localizedPath("es", "wholesale")).toBe("/mayoreo");
    expect(localizedPath("en", "wholesale")).toBe("/en/wholesale");
  });
});
