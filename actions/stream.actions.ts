"use server";

import { auth } from "@clerk/nextjs/server";
import { StreamClient } from "@stream-io/node-sdk";

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
const apiSecret = process.env.STREAM_SECRET_KEY;

export async function tokenProvider() {
  const { userId } = await auth();

  if (!userId) throw new Error("User is not logged in!");
  if (!apiKey) throw new Error("No API Key Provided!");
  if (!apiSecret) throw new Error("No Secret Key Provided!");

  const client = new StreamClient(apiKey, apiSecret);

  const exp = Math.floor(Date.now() / 1000) + 60 * 60;
  const issued = Math.floor(Date.now() / 1000) - 60;

  return client.generateUserToken({ user_id: userId, exp, iat: issued });
}
