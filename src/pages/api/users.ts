import { NextApiRequest, NextApiResponse } from "next";
import { saveUserData } from "@/services/database";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { 
      privyUserId, 
      email, 
      twitterOAuthToken, 
      twitterRefreshToken,
      twitterUsername 
    } = req.body;

    if (!privyUserId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    console.log("Creating/updating user:", {
      privyUserId,
      hasEmail: !!email,
      hasTwitterToken: !!twitterOAuthToken,
      twitterUsername
    });

    const user = await saveUserData({
      privyUserId,
      email,
      twitterOAuthToken,
      twitterRefreshToken,
      twitterUsername
    });

    res.status(200).json(user);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ 
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
}