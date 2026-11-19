"use client";
import {
  DeviceSettings,
  useCall,
  VideoPreview,
} from "@stream-io/video-react-sdk";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export default function MeetingSetup({
  setIsSetupComplete,
}: {
  setIsSetupComplete: (value: boolean) => void;
}) {
  const [devicesOff, setDevicesOff] = useState(true);
  const [joining, setJoining] = useState(false);
  const joiningRef = useRef(false);
  const deviceQueue = useRef(Promise.resolve());
  const [error, setError] = useState("");
  const call = useCall();
  useEffect(() => {
    if (!call) return;
    let active = true;
    deviceQueue.current = deviceQueue.current.then(async () => {
      if (!active) return;
      try {
        await Promise.all([
          devicesOff ? call.camera.disable() : call.camera.enable(),
          devicesOff ? call.microphone.disable() : call.microphone.enable(),
        ]);
      } catch {
        await Promise.allSettled([
          call.camera.disable(),
          call.microphone.disable(),
        ]);
        if (active) {
          setDevicesOff(true);
          setError(
            "Camera or microphone access was denied. You can join with both off.",
          );
        }
      }
    });
    return () => {
      active = false;
    };
  }, [call, devicesOff]);
  if (!call) return <p role="alert">This meeting is unavailable.</p>;
  async function join() {
    if (!call || joiningRef.current) return;
    joiningRef.current = true;
    setJoining(true);
    setError("");
    try {
      await deviceQueue.current;
      await call.join();
      setIsSetupComplete(true);
    } catch {
      setError(
        "Could not join the meeting. Please check your connection and try again.",
      );
    } finally {
      joiningRef.current = false;
      setJoining(false);
    }
  }
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center gap-5 p-6 text-white">
      <h1 className="text-2xl font-bold">Set up your meeting</h1>
      <div className="w-full max-w-2xl overflow-hidden rounded-xl">
        <VideoPreview />
      </div>
      <div className="flex flex-wrap items-center justify-center gap-5">
        <label className="flex items-center gap-2 font-medium">
          <input
            type="checkbox"
            checked={devicesOff}
            disabled={joining}
            onChange={(event) => setDevicesOff(event.target.checked)}
          />
          Join with microphone and camera off
        </label>
        <DeviceSettings />
      </div>
      {error && (
        <p role="alert" className="max-w-xl text-red-300">
          {error}
        </p>
      )}
      <Button
        disabled={joining}
        aria-busy={joining}
        className="rounded-md bg-green-700 px-4 py-2.5"
        onClick={join}
      >
        {joining ? "Joining…" : "Join meeting"}
      </Button>
    </div>
  );
}
