import { cn } from "@/lib/utils";

describe("cn", () => {
  it("joins class names and skips falsy values", () => {
    expect(cn("px-2", false && "hidden", undefined, "text-sm")).toBe(
      "px-2 text-sm",
    );
  });

  it("lets the later Tailwind class win on conflicts", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });
});