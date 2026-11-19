import { useEffect, useMemo, useState } from "react";
import { Call, useStreamVideoClient } from "@stream-io/video-react-sdk";
import { useUser } from "@clerk/nextjs";
import { splitCalls } from "@/lib/meetings";

export function useGetCalls() {
  const [result, setResult] = useState<{
    identity?: string;
    calls: Call[];
    loading: boolean;
    error?: string;
    client?: typeof client;
    attempt?: number;
  }>({ calls: [], loading: true });
  const [attempt, setAttempt] = useState(0);
  const [now, setNow] = useState(() => new Date());
  const client = useStreamVideoClient();
  const { user } = useUser();
  const userId = user?.id;
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    let active = true;
    if (!client || !userId) return;
    async function load() {
      try {
        const collected: Call[] = [];
        let next: string | undefined;
        do {
          const response = await client!.queryCalls({
            sort: [{ field: "starts_at", direction: -1 }],
            filter_conditions: {
              $or: [
                { created_by_user_id: userId! },
                { members: { $in: [userId!] } },
              ],
            },
            limit: 100,
            next,
          });
          if (!active) return;
          collected.push(...response.calls);
          next = response.next;
        } while (next);
        if (active)
          setResult({
            identity: userId,
            client,
            attempt,
            calls: Array.from(
              new Map(collected.map((call) => [call.cid, call])).values(),
            ),
            loading: false,
          });
      } catch {
        if (active)
          setResult({
            identity: userId,
            client,
            attempt,
            calls: [],
            loading: false,
            error: "Could not load your meetings.",
          });
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [client, userId, attempt]);
  const calls = useMemo(
    () =>
      result.identity === userId &&
      result.client === client &&
      result.attempt === attempt &&
      client
        ? result.calls
        : [],
    [client, userId, result, attempt],
  );
  const grouped = useMemo(() => splitCalls(calls, now), [calls, now]);
  return {
    ...grouped,
    callRecordings: calls,
    isLoading:
      !!client &&
      !!userId &&
      (result.identity !== userId ||
        result.client !== client ||
        result.attempt !== attempt ||
        result.loading),
    error:
      result.identity === userId && result.attempt === attempt
        ? result.error
        : undefined,
    retry: () => setAttempt((value) => value + 1),
  };
}
