"use client";
import { StreamVideo, StreamVideoClient } from "@stream-io/video-react-sdk";
import { ReactNode, useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { tokenProvider } from "@/actions/stream.actions";
import Loader from "@/components/Loader";
import RequestError from "@/components/RequestError";

export default function StreamClientProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [connection, setConnection] = useState<{
    userId: string;
    client?: StreamVideoClient;
    error?: string;
  }>();
  const [attempt, setAttempt] = useState(0);
  const { user, isLoaded } = useUser();
  const userId = user?.id;
  const name = user?.fullName || user?.username || userId;
  const image = user?.imageUrl;
  const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
  useEffect(() => {
    if (!isLoaded || !userId || !apiKey) return;
    let active = true;
    const client = new StreamVideoClient({ apiKey });
    const connected = client.connectUser(
      { id: userId, name, image },
      tokenProvider,
    );
    connected
      .then(() => {
        if (active) setConnection({ userId, client });
      })
      .catch(() => {
        if (active)
          setConnection({
            userId,
            error: "Could not connect to the meeting service.",
          });
      });
    return () => {
      active = false;
      void connected
        .catch(() => undefined)
        .then(() => client.disconnectUser())
        .catch(() => undefined);
    };
  }, [userId, name, image, apiKey, isLoaded, attempt]);
  if (!isLoaded) return <Loader />;
  if (!userId)
    return <RequestError message="Please sign in to use LetsMeet." />;
  if (!apiKey)
    return (
      <RequestError message="The meeting service is not configured yet." />
    );
  if (connection?.userId === userId && connection.error)
    return (
      <RequestError
        message={connection.error}
        onRetry={() => {
          setConnection(undefined);
          setAttempt((value) => value + 1);
        }}
      />
    );
  if (connection?.userId !== userId || !connection.client) return <Loader />;
  return <StreamVideo client={connection.client}>{children}</StreamVideo>;
}
