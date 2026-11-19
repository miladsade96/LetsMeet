// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ auth: vi.fn(), token: vi.fn() }));
vi.mock("@clerk/nextjs/server", () => ({ auth: mocks.auth }));
vi.mock("@stream-io/node-sdk", () => ({
  StreamClient: class {
    generateUserToken = mocks.token;
  },
}));
beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_STREAM_API_KEY", "test-key");
  vi.stubEnv("STREAM_SECRET_KEY", "test-secret");
});
it("issues a bounded token only for the authenticated session", async () => {
  mocks.auth.mockResolvedValue({ userId: "session-user" });
  mocks.token.mockReturnValue("test-token");
  const { tokenProvider } = await import("@/actions/stream.actions");
  expect(await tokenProvider()).toBe("test-token");
  const payload = mocks.token.mock.calls[0][0];
  expect(payload.user_id).toBe("session-user");
  expect(payload.exp - payload.iat).toBe(3660);
});
it("never creates a video token for a signed-out request", async () => {
  mocks.auth.mockResolvedValue({ userId: null });
  const { tokenProvider } = await import("@/actions/stream.actions");
  await expect(tokenProvider()).rejects.toThrow("not logged in");
  expect(mocks.token).not.toHaveBeenCalled();
});
