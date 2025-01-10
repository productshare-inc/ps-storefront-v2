import { NextApiRequest, NextApiResponse } from "next";

interface TwitterUserResponse {
  data: {
    email?: string;
    id: string;
    name: string;
    username: string;
  }
}

export async function getTwitterUserData(accessToken: string): Promise<TwitterUserResponse["data"]> {
  const response = await fetch(
    "https://api.twitter.com/2/users/me", {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    "User-Agent": "v2UserLookupJS",
    },
    cache: "no-cache",
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Twitter API Error Response:", error);
    throw new Error(`Twitter API error: ${error}`);
  }

  const data = await response.json() as TwitterUserResponse;
  
  if (!data.data) {
    throw new Error("Invalid response from Twitter API");
  }

  return data.data;
}

export async function verifyTwitterCredentials(accessToken: string) {
  try {
    const userData = await getTwitterUserData(accessToken);
    
    if (!userData || !userData.id) {
      return {
        success: false,
        error: "Invalid user data received from Twitter"
      };
    }

    return {
      success: true,
      email: userData.email,
      username: userData.username,
      id: userData.id,
      name: userData.name
    };
  } catch (error) {
    console.error("Error verifying Twitter credentials:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}