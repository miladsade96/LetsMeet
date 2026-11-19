import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  client: { queryCalls: vi.fn() },
  user: { id: "user-1" } as { id: string } | null,
}));
vi.mock("@stream-io/video-react-sdk", () => ({
  useStreamVideoClient: () => mocks.client,
}));
vi.mock("@clerk/nextjs", () => ({ useUser: () => ({ user: mocks.user }) }));
import { useGetCallById } from "@/hooks/useGetCallById";
import { useGetCalls } from "@/hooks/useGetCalls";
beforeEach(() => {
  mocks.user = { id: "user-1" };
  mocks.client.queryCalls.mockReset();
});
it("finishes loading and exposes an error after lookup failure, then retries", async () => {
  mocks.client.queryCalls
    .mockRejectedValueOnce(new Error("Offline"))
    .mockResolvedValueOnce({ calls: [{ id: "abc" }] });
  const { result } = renderHook(() => useGetCallById("abc"));
  await waitFor(() => expect(result.current.error).toMatch(/Could not load/));
  expect(result.current.isCallLoading).toBe(false);
  act(() => result.current.retry());
  await waitFor(() => expect(result.current.call?.id).toBe("abc"));
});
it("represents a missing meeting without passing an undefined call into the room", async () => {
  mocks.client.queryCalls.mockResolvedValueOnce({ calls: [] });
  const { result } = renderHook(() => useGetCallById("missing"));
  await waitFor(() => expect(result.current.isCallLoading).toBe(false));
  expect(result.current.call).toBeUndefined();
});
it.each([undefined, ["array"], "bad/id"])(
  "rejects malformed ID %s without a request",
  (id) => {
    const { result } = renderHook(() => useGetCallById(id));
    expect(result.current.error).toMatch(/Invalid/);
    expect(mocks.client.queryCalls).not.toHaveBeenCalled();
  },
);
it("ignores a late response after switching meetings", async () => {
  let resolveOld!: (value: unknown) => void;
  mocks.client.queryCalls
    .mockReturnValueOnce(
      new Promise((resolve) => {
        resolveOld = resolve;
      }),
    )
    .mockResolvedValueOnce({ calls: [{ id: "new" }] });
  const { result, rerender } = renderHook(({ id }) => useGetCallById(id), {
    initialProps: { id: "old" },
  });
  rerender({ id: "new" });
  await waitFor(() => expect(result.current.call?.id).toBe("new"));
  await act(async () => resolveOld({ calls: [{ id: "old" }] }));
  expect(result.current.call?.id).toBe("new");
});
it("fetches every page of meetings and removes duplicate calls", async () => {
  const one = {
    id: "one",
    cid: "default:one",
    state: { startsAt: new Date("2030-01-01") },
  };
  const two = {
    id: "two",
    cid: "default:two",
    state: { startsAt: new Date("2030-01-02") },
  };
  mocks.client.queryCalls
    .mockResolvedValueOnce({ calls: [one], next: "page-2" })
    .mockResolvedValueOnce({ calls: [one, two] });
  const { result } = renderHook(useGetCalls);
  await waitFor(() => expect(result.current.callRecordings).toHaveLength(2));
  expect(mocks.client.queryCalls.mock.calls[1][0].next).toBe("page-2");
  expect(result.current.upcomingCalls.map((c) => c.id)).toEqual(["one", "two"]);
});
it("clears meetings immediately after sign-out", async () => {
  mocks.client.queryCalls.mockResolvedValueOnce({
    calls: [{ id: "one", cid: "one", state: {} }],
  });
  const { result, rerender } = renderHook(useGetCalls);
  await waitFor(() => expect(result.current.callRecordings).toHaveLength(1));
  mocks.user = null;
  rerender();
  expect(result.current.callRecordings).toEqual([]);
});
it("handles list failures without an unhandled rejection", async () => {
  mocks.client.queryCalls.mockRejectedValueOnce(new Error("Offline"));
  const { result } = renderHook(useGetCalls);
  await waitFor(() =>
    expect(result.current.error).toBe("Could not load your meetings."),
  );
  expect(result.current.isLoading).toBe(false);
});
