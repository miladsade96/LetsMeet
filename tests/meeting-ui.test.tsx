import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  toast: vi.fn(),
  create: vi.fn(),
  join: vi.fn(),
  enableCamera: vi.fn(),
  disableCamera: vi.fn(),
  enableMic: vi.fn(),
  disableMic: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // Next Image is replaced by a plain image only in these offline component tests.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...props} />
  ),
}));
vi.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({ toast: mocks.toast }),
}));
vi.mock("@clerk/nextjs", () => ({
  useUser: () => ({ user: { id: "user-1" } }),
}));
vi.mock("react-datepicker", () => ({
  default: ({
    id,
    onChange,
  }: {
    id: string;
    onChange: (date: Date | null) => void;
  }) => (
    <input
      id={id}
      onChange={(event) =>
        onChange(event.target.value ? new Date(event.target.value) : null)
      }
    />
  ),
}));
vi.mock("@stream-io/video-react-sdk", () => ({
  useStreamVideoClient: () => ({
    call: () => ({ id: "test-meeting", getOrCreate: mocks.create }),
  }),
  useCall: () => ({
    join: mocks.join,
    camera: { enable: mocks.enableCamera, disable: mocks.disableCamera },
    microphone: { enable: mocks.enableMic, disable: mocks.disableMic },
  }),
  VideoPreview: () => <div>Video preview</div>,
  DeviceSettings: () => <button>Device settings</button>,
}));
import MeetingTypeList from "@/components/ui/MeetingTypeList";
import MeetingSetup from "@/components/MeetingSetup";
beforeEach(() => {
  vi.resetAllMocks();
  for (const fn of [
    mocks.create,
    mocks.join,
    mocks.enableCamera,
    mocks.disableCamera,
    mocks.enableMic,
    mocks.disableMic,
  ])
    fn.mockResolvedValue(undefined);
});
it("schedules a meeting with no description and keeps the created-link dialog open", async () => {
  render(<MeetingTypeList />);
  fireEvent.click(screen.getByRole("button", { name: /Schedule Meeting/ }));
  fireEvent.click(screen.getByRole("button", { name: "Schedule Meeting" }));
  await screen.findByRole("button", { name: /Copy meeting link/ });
  expect(mocks.create.mock.calls[0][0].data.custom.description).toBe(
    "Scheduled meeting",
  );
  expect(mocks.push).not.toHaveBeenCalled();
});
it("rejects a cleared scheduling date before creating a call", async () => {
  render(<MeetingTypeList />);
  fireEvent.click(screen.getByRole("button", { name: /Schedule Meeting/ }));
  fireEvent.change(screen.getByLabelText("Select Date and Time"), {
    target: { value: "2030-01-01" },
  });
  fireEvent.change(screen.getByLabelText("Select Date and Time"), {
    target: { value: "" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Schedule Meeting" }));
  expect(mocks.create).not.toHaveBeenCalled();
  expect(mocks.toast).toHaveBeenCalledWith(
    expect.objectContaining({ title: expect.stringContaining("future") }),
  );
});
it("blocks repeated instant-meeting creation while the first request is pending", async () => {
  let finish!: () => void;
  mocks.create.mockImplementationOnce(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
  );
  render(<MeetingTypeList />);
  fireEvent.click(screen.getByRole("button", { name: /New Meeting/ }));
  const start = screen.getByRole("button", { name: "Start meeting" });
  fireEvent.click(start);
  fireEvent.click(start);
  expect(mocks.create).toHaveBeenCalledTimes(1);
  expect(start).toBeDisabled();
  await act(async () => finish());
  expect(mocks.push).toHaveBeenCalledWith("/meeting/test-meeting");
});
it("rejects external invitation URLs in the actual join dialog", () => {
  render(<MeetingTypeList />);
  fireEvent.click(screen.getByRole("button", { name: /Join Meeting/ }));
  fireEvent.change(screen.getByLabelText("Meeting invitation link"), {
    target: { value: "javascript:alert(1)" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Join meeting" }));
  expect(mocks.push).not.toHaveBeenCalled();
  expect(mocks.toast).toHaveBeenCalled();
});
it("reports clipboard failure instead of falsely claiming success", async () => {
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
    configurable: true,
  });
  render(<MeetingTypeList />);
  fireEvent.click(screen.getByRole("button", { name: /Schedule Meeting/ }));
  fireEvent.click(screen.getByRole("button", { name: "Schedule Meeting" }));
  fireEvent.click(
    await screen.findByRole("button", { name: /Copy meeting link/ }),
  );
  await waitFor(() =>
    expect(mocks.toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining("Could not copy"),
      }),
    ),
  );
});
it("keeps the setup screen open on join failure and allows a retry", async () => {
  const complete = vi.fn();
  mocks.join.mockRejectedValueOnce(new Error("Offline"));
  render(<MeetingSetup setIsSetupComplete={complete} />);
  fireEvent.click(screen.getByRole("button", { name: "Join meeting" }));
  await screen.findByRole("alert");
  expect(complete).not.toHaveBeenCalled();
  expect(screen.getByRole("button", { name: "Join meeting" })).toBeEnabled();
  fireEvent.click(screen.getByRole("button", { name: "Join meeting" }));
  await waitFor(() => expect(complete).toHaveBeenCalledWith(true));
});
it("starts with media disabled and permits joining after device permission is denied", async () => {
  mocks.enableCamera.mockRejectedValueOnce(new Error("NotAllowedError"));
  render(<MeetingSetup setIsSetupComplete={vi.fn()} />);
  expect(screen.getByRole("checkbox")).toBeChecked();
  fireEvent.click(screen.getByRole("checkbox"));
  await screen.findByRole("alert");
  expect(screen.getByRole("checkbox")).toBeChecked();
  expect(mocks.disableMic).toHaveBeenCalled();
});
