import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  user: { id: "one", username: "One", imageUrl: "" } as {
    id: string;
    username: string;
    imageUrl: string;
  } | null,
  clients: [] as {
    connectUser: ReturnType<typeof vi.fn>;
    disconnectUser: ReturnType<typeof vi.fn>;
  }[],
  fail: false,
}));
vi.mock("@clerk/nextjs", () => ({
  useUser: () => ({ user: mocks.user, isLoaded: true }),
}));
vi.mock("@/actions/stream.actions", () => ({ tokenProvider: vi.fn() }));
vi.mock("@/components/Loader", () => ({ default: () => <p>Connecting</p> }));
vi.mock("@stream-io/video-react-sdk", () => ({
  StreamVideoClient: class {
    connectUser = vi.fn(() =>
      mocks.fail ? Promise.reject(new Error("Offline")) : Promise.resolve(),
    );
    disconnectUser = vi.fn(() => Promise.resolve());
    constructor() {
      mocks.clients.push(this);
    }
  },
  StreamVideo: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
import StreamClientProvider from "@/providers/StreamClientProvider";
beforeEach(() => {
  mocks.clients.length = 0;
  mocks.user = { id: "one", username: "One", imageUrl: "" };
  mocks.fail = false;
  vi.stubEnv("NEXT_PUBLIC_STREAM_API_KEY", "offline-key");
});
afterEach(() => vi.unstubAllEnvs());
it("disconnects the previous user and avoids showing their client during account switches", async () => {
  const { rerender, unmount } = render(
    <StreamClientProvider>Meeting app</StreamClientProvider>,
  );
  await screen.findByText("Meeting app");
  mocks.user = { id: "two", username: "Two", imageUrl: "" };
  rerender(<StreamClientProvider>Meeting app</StreamClientProvider>);
  await waitFor(() =>
    expect(mocks.clients[0].disconnectUser).toHaveBeenCalledTimes(1),
  );
  await screen.findByText("Meeting app");
  unmount();
  await waitFor(() =>
    expect(mocks.clients[1].disconnectUser).toHaveBeenCalledTimes(1),
  );
});
it("does not recreate the client for an equivalent user object", async () => {
  const { rerender } = render(
    <StreamClientProvider>Meeting app</StreamClientProvider>,
  );
  await screen.findByText("Meeting app");
  mocks.user = { ...mocks.user! };
  rerender(<StreamClientProvider>Meeting app</StreamClientProvider>);
  expect(mocks.clients).toHaveLength(1);
});
it("offers a retry after service connection failure", async () => {
  mocks.fail = true;
  render(<StreamClientProvider>Meeting app</StreamClientProvider>);
  await screen.findByRole("alert");
  mocks.fail = false;
  await act(async () =>
    screen.getByRole("button", { name: "Try again" }).click(),
  );
  await screen.findByText("Meeting app");
});
it("reports missing configuration without throwing inside an effect", async () => {
  vi.stubEnv("NEXT_PUBLIC_STREAM_API_KEY", "");
  render(<StreamClientProvider>Meeting app</StreamClientProvider>);
  expect(screen.getByRole("alert")).toHaveTextContent("not configured");
  expect(mocks.clients).toHaveLength(0);
});
