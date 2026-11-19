"use client";

import { useUser } from "@clerk/nextjs";
import { StreamCall, StreamTheme } from "@stream-io/video-react-sdk";
import { useEffect, useState } from "react";
import MeetingSetup from "@/components/MeetingSetup";
import MeetingRoom from "@/components/MeetingRoom";
import { useGetCallById } from "@/hooks/useGetCallById";
import Loader from "@/components/Loader";
import RequestError from "@/components/RequestError";
import { useParams } from "next/navigation";

export default function Meeting() {
  const { id } = useParams<{ id: string }>();
  const { user, isLoaded } = useUser();
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const { call, isCallLoading, error, retry } = useGetCallById(id);

  useEffect(
    () => () => {
      if (!call) return;
      void Promise.allSettled([
        call.camera.disable(),
        call.microphone.disable(),
      ]);
      if (
        call.state.callingState !== "idle" &&
        call.state.callingState !== "left"
      )
        void call.leave().catch(() => undefined);
    },
    [call],
  );
  if (error) return <RequestError message={error} onRetry={retry} />;
  if (!isLoaded || isCallLoading) return <Loader />;

  if (!user)
    return <RequestError message="Please sign in to join this meeting." />;
  if (!call)
    return (
      <RequestError message="This meeting was not found or you do not have access." />
    );
  if (call.state.endedAt)
    return <RequestError message="This meeting has ended." />;
  return (
    <main className="h-screen w-full">
      <StreamCall call={call}>
        <StreamTheme>
          {!isSetupComplete ? (
            <MeetingSetup setIsSetupComplete={setIsSetupComplete} />
          ) : (
            <MeetingRoom />
          )}
        </StreamTheme>
      </StreamCall>
    </main>
  );
}
