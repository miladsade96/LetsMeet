import { useState } from "react";
type CallLayoutType = "grid" | "speaker-left" | "speaker-right";
export default function MeetingRoom() {
  return <div>Meeting Room</div>;
  const [layout, setLayout] = useState<CallLayoutType>("speaker-left");
  const [showParticipants, setShowParticipants] = useState(false);
}
