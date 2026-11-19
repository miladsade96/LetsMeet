export function meetingPath(input: string, origin: string) {
  let url: URL;
  try {
    url = new URL(input.trim(), origin);
  } catch {
    throw new Error("Enter a valid meeting invitation link.");
  }
  if (
    !/^https?:$/.test(url.protocol) ||
    url.origin !== new URL(origin).origin ||
    url.username ||
    url.password ||
    url.hash ||
    !/^\/meeting\/[a-zA-Z0-9_-]{1,128}\/?$/.test(url.pathname)
  ) {
    throw new Error("Use an invitation link from this LetsMeet website.");
  }
  const personal =
    url.searchParams.get("personal") === "true" ? "?personal=true" : "";
  return url.pathname.replace(/\/$/, "") + personal;
}

export function meetingLink(id: string, personal = false) {
  const path = `/meeting/${encodeURIComponent(id)}${personal ? "?personal=true" : ""}`;
  // Use the deployed origin, including Netlify previews. No undefined base URL.
  return typeof window === "undefined"
    ? path
    : new URL(path, window.location.origin).href;
}

export function meetingDetails(
  kind: "instant" | "scheduled",
  date: Date | null,
  description: string,
  now = new Date(),
) {
  if (
    kind === "scheduled" &&
    (!date ||
      !Number.isFinite(date.getTime()) ||
      date.getTime() <= now.getTime())
  ) {
    throw new Error("Choose a date and time in the future.");
  }
  if (description.trim().length > 500)
    throw new Error("Keep the description under 500 characters.");
  return {
    starts_at: (kind === "instant" ? now : date!).toISOString(),
    custom: {
      description:
        kind === "instant"
          ? "Instant meeting"
          : description.trim() || "Scheduled meeting",
    },
  };
}

export function splitCalls<
  T extends {
    state: {
      startsAt?: Date;
      endedAt?: Date;
      session?: { ended_at?: string | null };
    };
  },
>(calls: T[], now = new Date()) {
  const upcomingCalls = calls
    .filter(
      ({ state }) => !state.endedAt && state.startsAt && state.startsAt > now,
    )
    .sort((a, b) => a.state.startsAt!.getTime() - b.state.startsAt!.getTime());
  const endedCalls = calls
    .filter(
      ({ state }) =>
        !!state.endedAt ||
        (!!state.startsAt &&
          state.startsAt <= now &&
          (!state.session || !!state.session.ended_at)),
    )
    .sort(
      (a, b) =>
        (b.state.endedAt || b.state.startsAt)!.getTime() -
        (a.state.endedAt || a.state.startsAt)!.getTime(),
    );
  return { upcomingCalls, endedCalls };
}
