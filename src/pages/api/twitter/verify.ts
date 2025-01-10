import { NextApiRequest, NextApiResponse } from "next";
import { verifyTwitterCredentials } from "@/services/twitter";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({ error: "Missing access token" });
    }

    console.log("Verifying Twitter credentials with token:", accessToken.substring(0, 10) + "...");

    const result = await verifyTwitterCredentials(accessToken);
    
    if (!result.success) {
      console.error("Twitter verification failed:", result.error);
      return res.status(400).json({ error: result.error });
    }

    console.log("Twitter verification successful:", {
      username: result.username,
      hasEmail: !!result.email
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("Twitter verification error:", error);
    res.status(500).json({ 
      error: "Failed to verify Twitter credentials",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
}