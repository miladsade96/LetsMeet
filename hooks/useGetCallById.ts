import { Call, useStreamVideoClient } from "@stream-io/video-react-sdk";
import { useEffect, useState } from "react";

export function useGetCallById(id: string | string[] | undefined) {
  const [result, setResult] = useState<{
    id?: string;
    call?: Call;
    error?: string;
    loading: boolean;
    client?: typeof client;
    attempt?: number;
  }>({ loading: true });
  const [attempt, setAttempt] = useState(0);
  const client = useStreamVideoClient();
  const validId =
    typeof id === "string" && /^[a-zA-Z0-9_-]{1,128}$/.test(id)
      ? id
      : undefined;
  useEffect(() => {
    let active = true;
    if (!client || !validId) return;
    client
      .queryCalls({ filter_conditions: { id: validId }, limit: 1 })
      .then(({ calls }) => {
        if (active)
          setResult({
            id: validId,
            client,
            attempt,
            call: calls[0],
            loading: false,
          });
      })
      .catch(() => {
        if (active)
          setResult({
            id: validId,
            client,
            attempt,
            error: "Could not load the meeting. Please try again.",
            loading: false,
          });
      });
    return () => {
      active = false;
    };
  }, [client, validId, attempt]);
  const current =
    result.id === validId &&
    result.client === client &&
    result.attempt === attempt &&
    !!client;
  return {
    call: current ? result.call : undefined,
    error: !validId
      ? "Invalid meeting ID."
      : current
        ? result.error
        : undefined,
    isCallLoading: !!validId && (!current || result.loading),
    retry: () => setAttempt((value) => value + 1),
  };
}
