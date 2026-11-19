"use client";
import { useGetCalls } from "@/hooks/useGetCalls";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Call, CallRecording } from "@stream-io/video-react-sdk";
import MeetingCard from "@/components/MeetingCard";
import Loader from "@/components/Loader";
import RequestError from "@/components/RequestError";
import { meetingLink } from "@/lib/meetings";

export default function CallList({
  type,
}: {
  type: "upcoming" | "ended" | "recordings";
}) {
  const { endedCalls, upcomingCalls, callRecordings, isLoading, error, retry } =
    useGetCalls();
  const router = useRouter();
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{
    source?: Call[];
    attempt?: number;
    recordings: CallRecording[];
    loading: boolean;
    error?: string;
  }>({ recordings: [], loading: true });
  useEffect(() => {
    if (type !== "recordings" || isLoading || error) return;
    let active = true;
    Promise.allSettled(
      callRecordings.map((call) => call.queryRecordings()),
    ).then((responses) => {
      if (!active) return;
      const recordings = responses.flatMap((response) =>
        response.status === "fulfilled" ? response.value.recordings : [],
      );
      const unique = Array.from(
        new Map(
          recordings.map((recording) => [recording.url, recording]),
        ).values(),
      );
      unique.sort(
        (a, b) => Date.parse(b.start_time) - Date.parse(a.start_time),
      );
      setResult({
        source: callRecordings,
        attempt,
        recordings: unique,
        loading: false,
        error: responses.some((response) => response.status === "rejected")
          ? "Some recordings could not be loaded. You can try again."
          : undefined,
      });
    });
    return () => {
      active = false;
    };
  }, [type, callRecordings, isLoading, error, attempt]);
  if (error) return <RequestError message={error} onRetry={retry} />;
  if (
    isLoading ||
    (type === "recordings" &&
      (result.loading ||
        result.source !== callRecordings ||
        result.attempt !== attempt))
  )
    return <Loader />;
  const calls = type === "upcoming" ? upcomingCalls : endedCalls;
  return (
    <>
      {type === "recordings" && result.error && (
        <RequestError
          message={result.error}
          onRetry={() => setAttempt((value) => value + 1)}
        />
      )}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {type === "recordings" ? (
          result.recordings.length ? (
            result.recordings.map((recording) => (
              <MeetingCard
                key={recording.url}
                icon="/icons/recordings.svg"
                title={recording.filename || "Meeting recording"}
                date={new Date(recording.start_time).toLocaleString()}
                buttonIcon1="/icons/play.svg"
                buttonText="Play"
                link={recording.url}
                handleClick={() => {
                  if (/^https:\/\//i.test(recording.url))
                    window.open(recording.url, "_blank", "noopener,noreferrer");
                }}
              />
            ))
          ) : (
            <p>No recordings</p>
          )
        ) : calls.length ? (
          calls.map((call) => (
            <MeetingCard
              key={call.cid}
              icon={
                type === "ended" ? "/icons/previous.svg" : "/icons/upcoming.svg"
              }
              title={
                typeof call.state.custom.description === "string"
                  ? call.state.custom.description
                  : "Personal meeting"
              }
              date={
                call.state.startsAt?.toLocaleString() || "No scheduled time"
              }
              isPreviousMeeting={type === "ended"}
              buttonText="Start"
              link={meetingLink(call.id)}
              handleClick={() => router.push(`/meeting/${call.id}`)}
            />
          ))
        ) : (
          <p>
            {type === "upcoming" ? "No upcoming calls" : "No previous calls"}
          </p>
        )}
      </div>
    </>
  );
}
