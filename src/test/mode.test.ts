import { describe, expect, it } from "vitest";
import { modeFromSwipe } from "@/lib/mode";

describe("modeFromSwipe", () => {
  it("swiping right opens tea", () => {
    expect(modeFromSwipe(120)).toBe("tea");
  });
  it("swiping left opens coffee", () => {
    expect(modeFromSwipe(-120)).toBe("coffee");
  });
  it("a small drag does not switch", () => {
    expect(modeFromSwipe(20)).toBeNull();
  });
});
