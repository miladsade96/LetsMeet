"use client";

import { useEffect, useState } from "react";
import MeetingTypeList from "@/components/ui/MeetingTypeList";
import { useGetCalls } from "@/hooks/useGetCalls";

export default function Page() {
  const [now, setNow] = useState<Date>();
  useEffect(() => {
    // Read the local clock after hydration; the server cannot know the browser timezone.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const time =
    now?.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) ||
    "—";
  const date = now
    ? new Intl.DateTimeFormat("en-US", { dateStyle: "full" }).format(now)
    : "";
  const { upcomingCalls, error, isLoading } = useGetCalls();
  const upcoming = upcomingCalls[0]?.state.startsAt;
  const upcomingText = error
    ? "Upcoming meetings are unavailable"
    : isLoading
      ? "Loading upcoming meetings…"
      : upcoming
        ? `Upcoming meeting: ${upcoming.toLocaleString()}`
        : "No upcoming meeting";

  return (
    <section className="flex size-full flex-col gap-10 text-white">
      <div className="h-[300px] w-full rounded-[20px] bg-hero bg-cover">
        <div className="flex h-full flex-col justify-between max-md:px-5 max-md:py-8 lg:p-11">
          <h2 className="glassmorphism w-fit rounded text-left px-1 text-base font-normal">
            {upcomingText}
          </h2>
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-extrabold lg:text-7xl">{time}</h1>
            <p className="text-lg font-medium text-sky-1 lg:text-2xl">{date}</p>
          </div>
        </div>
      </div>

      <MeetingTypeList />
    </section>
  );
}
