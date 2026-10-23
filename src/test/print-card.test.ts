import { describe, expect, it } from "vitest";
import { printableProfileUrl } from "@/lib/print-card";

const ID = "3f2a6c1e-0b4d-4c8e-9a71-5d2e8f9b1a20";

describe("printableProfileUrl", () => {
  it("uses the real profile link on a published address", () => {
    expect(printableProfileUrl("https://master.lovable.app", ID)).toBe(
      `https://master.lovable.app/m/${ID}`,
    );
  });
  it("never prints a preview address", () => {
    expect(
      printableProfileUrl("https://id-preview--d5280fe3-782a-43e4-9e1d-170d941a0c51.lovable.app", ID),
    ).toBeNull();
  });
  it("never prints a local address", () => {
    expect(printableProfileUrl("http://localhost:8080", ID)).toBeNull();
  });
  it("shows no QR without a master profile", () => {
    expect(printableProfileUrl("https://master.lovable.app", null)).toBeNull();
  });
});
