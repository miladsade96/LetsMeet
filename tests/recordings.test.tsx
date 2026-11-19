import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  calls: [] as { queryRecordings: ReturnType<typeof vi.fn> }[],
  error: undefined as string | undefined,
  retry: vi.fn(),
}));
vi.mock("@/hooks/useGetCalls", () => ({
  useGetCalls: () => ({
    endedCalls: [],
    upcomingCalls: [],
    callRecordings: mocks.calls,
    isLoading: false,
    error: mocks.error,
    retry: mocks.retry,
  }),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/components/Loader", () => ({
  default: () => <p>Loading recordings</p>,
}));
vi.mock("@/components/MeetingCard", () => ({
  default: ({ title, date }: { title: string; date: string }) => (
    <article>
      {title}
      <span>{date}</span>
    </article>
  ),
}));
import CallList from "@/components/CallList";
const recording = {
  url: "https://example.test/recording.mp4",
  filename: "Design review",
  start_time: "2026-11-19T09:00:00Z",
};
beforeEach(() => {
  mocks.calls = [];
  mocks.error = undefined;
});
it("keeps available recordings visible when another call's recording request fails", async () => {
  mocks.calls = [
    { queryRecordings: vi.fn().mockResolvedValue({ recordings: [recording] }) },
    { queryRecordings: vi.fn().mockRejectedValue(new Error("Offline")) },
  ];
  render(<CallList type="recordings" />);
  expect(await screen.findByText("Design review")).toBeVisible();
  expect(screen.getByRole("alert")).toHaveTextContent(
    "Some recordings could not be loaded",
  );
  expect(
    screen.getByText(new Date(recording.start_time).toLocaleString()),
  ).toBeVisible();
});
it("waits for recording responses and retries failed requests", async () => {
  let finish!: (value: unknown) => void;
  const query = vi.fn().mockReturnValueOnce(
    new Promise((resolve) => {
      finish = resolve;
    }),
  );
  mocks.calls = [{ queryRecordings: query }];
  render(<CallList type="recordings" />);
  expect(screen.getByText("Loading recordings")).toBeVisible();
  await act(async () => finish({ recordings: [] }));
  expect(screen.getByText("No recordings")).toBeVisible();
});
it("provides a working retry after recording failure", async () => {
  const query = vi
    .fn()
    .mockRejectedValueOnce(new Error("Offline"))
    .mockResolvedValueOnce({ recordings: [recording] });
  mocks.calls = [{ queryRecordings: query }];
  render(<CallList type="recordings" />);
  fireEvent.click(await screen.findByRole("button", { name: "Try again" }));
  expect(await screen.findByText("Design review")).toBeVisible();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});
it("does not fetch recordings for the upcoming-meetings page", () => {
  const query = vi.fn();
  mocks.calls = [{ queryRecordings: query }];
  render(<CallList type="upcoming" />);
  expect(query).not.toHaveBeenCalled();
});
