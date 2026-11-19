import { describe, expect, it } from "vitest";
import { meetingDetails, meetingPath, splitCalls } from "@/lib/meetings";
describe("invitation navigation", () => {
  it.each([
    "javascript:alert(1)",
    "https://evil.test/meeting/test",
    "//evil.test/meeting/test",
    "/meeting/abc/extra",
    "/meeting/",
    "https://user:pass@meet.test/meeting/abc",
    "/meeting/%2fabc",
    "",
    "/meeting/abc#fragment",
  ])("rejects unsafe or invalid invitation: %s", (input) => {
    expect(() => meetingPath(input, "https://meet.test")).toThrow();
  });
  it.each(["/meeting/abc-123", "https://meet.test/meeting/abc-123"])(
    "accepts an internal invitation: %s",
    (input) => {
      expect(meetingPath(input, "https://meet.test")).toBe("/meeting/abc-123");
    },
  );
  it("preserves the personal-room flag and drops unrelated query parameters", () => {
    expect(
      meetingPath(
        "/meeting/user_123?personal=true&redirect=https://evil.test",
        "https://meet.test",
      ),
    ).toBe("/meeting/user_123?personal=true");
  });
});
describe("scheduling", () => {
  const now = new Date("2026-11-19T09:00:00Z");
  it.each([null, new Date("invalid"), new Date("2026-11-18"), now])(
    "rejects an invalid or non-future time: %s",
    (time) => {
      expect(() => meetingDetails("scheduled", time, "", now)).toThrow(
        "future",
      );
    },
  );
  it("schedules an empty description without turning it into an instant call", () => {
    expect(
      meetingDetails("scheduled", new Date("2026-11-20"), "", now),
    ).toEqual({
      starts_at: "2026-11-20T00:00:00.000Z",
      custom: { description: "Scheduled meeting" },
    });
  });
  it("starts instant meetings now, ignoring stale scheduling state", () => {
    expect(
      meetingDetails("instant", new Date("2030-01-01"), "Old meeting", now),
    ).toEqual({
      starts_at: now.toISOString(),
      custom: { description: "Instant meeting" },
    });
  });
});
it("orders upcoming meetings nearest first and excludes ended future calls", () => {
  const now = new Date("2026-11-19");
  const call = (id: string, start: string, ended = false) => ({
    id,
    state: { startsAt: new Date(start), endedAt: ended ? now : undefined },
  });
  const result = splitCalls(
    [
      call("far", "2026-12-01"),
      call("ended-future", "2026-12-02", true),
      call("near", "2026-11-20"),
      call("past", "2026-11-18"),
    ],
    now,
  );
  expect(result.upcomingCalls.map((c) => c.id)).toEqual(["near", "far"]);
  expect(result.endedCalls.map((c) => c.id)).toEqual(["ended-future", "past"]);
});
