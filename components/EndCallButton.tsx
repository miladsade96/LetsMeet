"use client";

import { useCall, useCallStateHooks } from "@stream-io/video-react-sdk";
import { Button } from "@/components/ui/button";
import { useRef, useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

export default function EndCallButton() {
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);
  const call = useCall();
  const router = useRouter();

  const { useLocalParticipant } = useCallStateHooks();
  const localParticipant = useLocalParticipant();

  const isMeetingOwner =
    localParticipant &&
    call?.state.createdBy &&
    localParticipant.userId === call.state.createdBy.id;

  if (!isMeetingOwner) return null;

  return (
    <Button
      onClick={async () => {
        if (pendingRef.current) return;
        pendingRef.current = true;
        setPending(true);
        try {
          await call?.endCall();
          router.push("/");
        } catch {
          toast({
            title: "Could not end the meeting. Try again.",
            variant: "destructive",
          });
        } finally {
          pendingRef.current = false;
          setPending(false);
        }
      }}
      disabled={pending}
      className="bg-red-700"
    >
      End call for everyone
    </Button>
  );
}
