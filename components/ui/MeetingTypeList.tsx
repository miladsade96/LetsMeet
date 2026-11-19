"use client";

import HomeCard from "@/components/ui/HomeCard";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import MeetingModal from "@/components/MeetingModal";
import { useUser } from "@clerk/nextjs";
import { Call, useStreamVideoClient } from "@stream-io/video-react-sdk";
import { useToast } from "@/components/ui/use-toast";
import { Textarea } from "@/components/ui/textarea";
import ReactDatePicker from "react-datepicker";
import { Input } from "@/components/ui/input";
import { meetingDetails, meetingLink, meetingPath } from "@/lib/meetings";

export default function MeetingTypeList() {
  const { toast } = useToast();
  const [meetingState, setMeetingState] = useState<
    "isScheduleMeeting" | "isJoiningMeeting" | "isInstantMeeting" | undefined
  >();
  const [values, setValues] = useState(() => ({
    dateTime: new Date(Date.now() + 15 * 60000) as Date | null,
    description: "",
    link: "",
  }));
  const pendingRef = useRef(false);
  const [isPending, setIsPending] = useState(false);
  const [callDetails, setCallDetails] = useState<Call>();

  const router = useRouter();

  const { user } = useUser();
  const client = useStreamVideoClient();

  function openMeeting(kind: typeof meetingState) {
    setCallDetails(undefined);
    setValues({
      dateTime: new Date(Date.now() + 15 * 60000),
      description: "",
      link: "",
    });
    setMeetingState(kind);
  }

  async function createMeeting() {
    if (pendingRef.current) return;
    if (!user || !client) {
      toast({ title: "Please wait for the meeting service to connect." });
      return;
    }
    pendingRef.current = true;
    setIsPending(true);
    try {
      const kind =
        meetingState === "isScheduleMeeting" ? "scheduled" : "instant";
      const data = meetingDetails(kind, values.dateTime, values.description);
      const call = client.call("default", crypto.randomUUID());
      await call.getOrCreate({ data });
      if (kind === "instant") router.push(`/meeting/${call.id}`);
      else setCallDetails(call);
      toast({ title: "Meeting created" });
    } catch (error) {
      toast({
        title:
          error instanceof Error ? error.message : "Failed to create meeting.",
        variant: "destructive",
      });
    } finally {
      pendingRef.current = false;
      setIsPending(false);
    }
  }

  async function copyLink() {
    if (!callDetails) return;
    try {
      await navigator.clipboard.writeText(meetingLink(callDetails.id));
      toast({ title: "Link copied" });
    } catch {
      toast({
        title: "Could not copy the link. Please allow clipboard access.",
        variant: "destructive",
      });
    }
  }

  function joinMeeting() {
    try {
      router.push(meetingPath(values.link, window.location.origin));
    } catch (error) {
      toast({ title: (error as Error).message, variant: "destructive" });
    }
  }

  return (
    <section className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
      <HomeCard
        img="/icons/add-meeting.svg"
        title="New Meeting"
        description="Start an instant meeting"
        handleClick={() => openMeeting("isInstantMeeting")}
        additionalClasses="bg-orange-1"
      />
      <HomeCard
        img="/icons/schedule.svg"
        title="Schedule Meeting"
        description="Plan your meeting"
        handleClick={() => openMeeting("isScheduleMeeting")}
        additionalClasses="bg-blue-1"
      />
      <HomeCard
        img="/icons/recordings.svg"
        title="View Recordings"
        description="Check out your recordings"
        handleClick={() => router.push("/recordings")}
        additionalClasses="bg-purple-1"
      />
      <HomeCard
        img="/icons/join-meeting.svg"
        title="Join Meeting"
        description="Via invitation link"
        handleClick={() => openMeeting("isJoiningMeeting")}
        additionalClasses="bg-yellow-1"
      />

      {!callDetails ? (
        <MeetingModal
          isOpen={meetingState === "isScheduleMeeting"}
          onClose={() => {
            if (!pendingRef.current) setMeetingState(undefined);
          }}
          title="Create Meeting"
          handleClick={createMeeting}
          isPending={isPending}
        >
          <div className="flex flex-col gap-2.5">
            <label
              htmlFor="meeting-description"
              className="text-base text-normal leading-[22px] text-sky-200"
            >
              Add a description
            </label>
            <Textarea
              id="meeting-description"
              value={values.description}
              maxLength={500}
              className="border-none bg-dark-2 focus-visible:ring-0 focus-visible:ring-offset-0"
              onChange={(e) => {
                setValues({ ...values, description: e.target.value });
              }}
            />
          </div>
          <div className="flex w-full flex-col gap-2.5">
            <label
              htmlFor="meeting-date"
              className="text-base text-normal leading-[22px] text-sky-200"
            >
              Select Date and Time
            </label>
            <ReactDatePicker
              id="meeting-date"
              minDate={new Date()}
              onChange={(date: Date | null) => {
                setValues({ ...values, dateTime: date });
              }}
              selected={values.dateTime}
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={15}
              timeCaption="time"
              dateFormat="MMMM d, yyyy h:mm aa"
              className="w-full rounded bg-dark-2 p-2 focus:outline-none"
            />
          </div>
        </MeetingModal>
      ) : (
        <MeetingModal
          isOpen={meetingState === "isScheduleMeeting"}
          onClose={() => {
            if (!pendingRef.current) setMeetingState(undefined);
          }}
          title="Meeting is Created"
          additionalClasses="text-center"
          buttonText="Copy meeting link"
          handleClick={copyLink}
          image="/icons/checked.svg"
          buttonIcon="/icons/copy.svg"
        />
      )}

      <MeetingModal
        isOpen={meetingState === "isInstantMeeting"}
        onClose={() => {
          if (!pendingRef.current) setMeetingState(undefined);
        }}
        title="Start an instant meeting"
        additionalClasses="text-center"
        buttonText="Start meeting"
        handleClick={createMeeting}
        isPending={isPending}
      />

      <MeetingModal
        isOpen={meetingState === "isJoiningMeeting"}
        onClose={() => {
          if (!pendingRef.current) setMeetingState(undefined);
        }}
        title="Type the link here"
        additionalClasses="text-center"
        buttonText="Join meeting"
        handleClick={joinMeeting}
      >
        <label htmlFor="meeting-link">Meeting invitation link</label>
        <Input
          id="meeting-link"
          value={values.link}
          placeholder="Meeting link"
          className="border-none bg-blue-800 text-white placeholder:text-white
          focus-visible:ring-0 focus-visible:ring-offset-0"
          onChange={(e) => setValues({ ...values, link: e.target.value })}
        />
      </MeetingModal>
    </section>
  );
}
