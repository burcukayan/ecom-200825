import type { OrderStatus } from "@/lib/orders";
import {
  STATUS_LABEL,
  STATUS_VARIANT,
  formatOrderDate,
  shortOrderId,
} from "@/lib/order-status";

const ALL_STATUSES: OrderStatus[] = [
  "PENDING",
  "PAID",
  "SHIPPING",
  "COMPLETED",
  "CANCELLED",
];

describe("STATUS_LABEL and STATUS_VARIANT", () => {
  it.each(ALL_STATUSES)(
    "define a label and a badge variant for %s",
    (status) => {
      expect(STATUS_LABEL[status]).toEqual(expect.any(String));
      expect(STATUS_LABEL[status]).not.toHaveLength(0);
      expect(STATUS_VARIANT[status]).toEqual(expect.any(String));
    },
  );

  it("highlights cancelled orders with the destructive variant", () => {
    expect(STATUS_VARIANT.CANCELLED).toBe("destructive");
  });
});

describe("formatOrderDate", () => {
  it("shows the time in Istanbul time (UTC+3)", () => {
    expect(formatOrderDate("2026-10-07T07:30:00.000Z")).toBe(
      "7 Oct 2026, 10:30",
    );
  });

  it("moves to the next day when Istanbul has already passed midnight", () => {
    expect(formatOrderDate("2026-10-06T22:15:00.000Z")).toBe(
      "7 Oct 2026, 01:15",
    );
  });

  it("returns a dash instead of throwing for an invalid date", () => {
    expect(() => formatOrderDate("not-a-date")).not.toThrow();
    expect(formatOrderDate("not-a-date")).toBe("-");
    expect(formatOrderDate("")).toBe("-");
  });
});

describe("shortOrderId", () => {
  it("returns the last 8 characters in upper case", () => {
    expect(shortOrderId("665f1c2ab4e5d6f7a8b9c0d1")).toBe("A8B9C0D1");
  });

  it("returns the whole id when it is shorter than 8 characters", () => {
    expect(shortOrderId("abc12")).toBe("ABC12");
  });
});
