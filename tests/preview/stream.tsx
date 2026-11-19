import { ReactNode } from "react";
const call = {
  id: "sample-meeting",
  cid: "default:sample-meeting",
  state: {
    startsAt: new Date(Date.now() + 86400000),
    custom: { description: "Product design review" },
    callingState: "idle",
  },
  getOrCreate: async () => {},
  join: async () => {},
  camera: { enable: async () => {}, disable: async () => {} },
  microphone: { enable: async () => {}, disable: async () => {} },
  queryRecordings: async () => ({ recordings: [] }),
};
const client = {
  call: () => call,
  queryCalls: async () => ({ calls: [call] }),
};
export function useStreamVideoClient() {
  return client;
}
export function useCall() {
  return call;
}
export function VideoPreview() {
  return (
    <div
      style={{
        padding: "80px 24px",
        background: "#1c263a",
        textAlign: "center",
        borderRadius: 16,
      }}
    >
      Camera is off · sample preview
    </div>
  );
}
export function DeviceSettings() {
  return <button>Device settings</button>;
}
export function StreamCall({ children }: { children: ReactNode }) {
  return children;
}
