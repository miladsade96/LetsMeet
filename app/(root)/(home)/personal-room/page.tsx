"use client";

import { useRef, useState } from "react";
import { meetingLink as buildMeetingLink } from "@/lib/meetings";
import RequestError from "@/components/RequestError";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { useGetCallById } from "@/hooks/useGetCallById";
import { useStreamVideoClient } from "@stream-io/video-react-sdk";
import { useRouter } from "next/navigation";

interface Props {
  title: string;
  description: string;
}

function Table({ title, description }: Props) {
  return (
    <div className="flex flex-col items-start gap-2 xl:flex-row">
      <h1 className="text-base font-medium text-sky-1 lg:text-xl xl:min-w-32">
        {title}:
      </h1>
      <h1 className="truncate text-sm font-bold max-sm:max-w-[320px] lg:text-xl">
        {description}
      </h1>
    </div>
  );
}

export default function Page() {
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);
  const { user } = useUser();
  const meetingId = user?.id;
  const meetingLink = meetingId ? buildMeetingLink(meetingId, true) : "";
  const { call, isCallLoading, error, retry } = useGetCallById(meetingId);
  const client = useStreamVideoClient();
  const router = useRouter();

  async function startRoom() {
    if (!client || !user || pendingRef.current || isCallLoading || error)
      return;
    pendingRef.current = true;
    setPending(true);
    try {
      const room = call || client.call("default", user.id);
      await room.getOrCreate({
        data: {
          custom: {
            description: `${user.fullName || user.username || "My"}'s personal room`,
          },
        },
      });
      router.push(`/meeting/${user.id}?personal=true`);
    } catch {
      toast({
        title: "Could not start your room. Try again.",
        variant: "destructive",
      });
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
  }

  return (
    <section className="flex size-full flex-col gap-10 text-white">
      <h1 className="text-3xl font-bold">Personal Room</h1>
      <div className="flex flex-col w-full gap-8 xl:max-w-[900px]">
        <Table
          title="Topic"
          description={`${user?.fullName || user?.username || "Your"}'s meeting room`}
        />
        <Table title="Meeting ID" description={meetingId || "Loading…"} />
        <Table title="Invite Link" description={meetingLink} />
      </div>
      {error && <RequestError message={error} onRetry={retry} />}
      <div className="flex flex-wrap gap-5">
        <Button
          className="bg-blue-1 ring-1 hover:bg-blue-500 hover:ring-2 transition-all duration-200"
          onClick={startRoom}
          disabled={pending || isCallLoading || !!error}
        >
          Start Meeting
        </Button>
        <Button
          className="bg-dark-1 ring-1 hover:bg-blue-950 hover:ring-2 transition-all duration-200"
          disabled={!meetingLink}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(meetingLink);
              toast({ title: "Link copied" });
            } catch {
              toast({
                title:
                  "Could not copy the link. Please allow clipboard access.",
                variant: "destructive",
              });
            }
          }}
        >
          Copy Invitation Link
        </Button>
      </div>
    </section>
  );
}
