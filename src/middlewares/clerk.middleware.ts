import { Request, Response, Router } from "express";
import { Webhook } from "svix";
import { Logger } from "../utils";
import { userService } from "../services"; // Assuming you have a UserService

const router = Router();

// Clerk webhook handler
router.post("/", async (req: Request, res: Response) => {
  // Get the Clerk webhook secret from environment variables
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    Logger.error("Missing Clerk webhook secret");
    return res.status(500).json({ error: "Server configuration error" });
  }

  // Get the headers
  const svixId = req.headers["svix-id"] as string;
  const svixTimestamp = req.headers["svix-timestamp"] as string;
  const svixSignature = req.headers["svix-signature"] as string;

  // If there are no headers, error out
  if (!svixId || !svixTimestamp || !svixSignature) {
    Logger.error("Missing Svix headers");
    return res.status(400).json({ error: "Missing Svix headers" });
  }

  // Create a new Svix instance with your webhook secret
  const wh = new Webhook(webhookSecret);
  
  let payload: any;
  
  try {
    // Verify the webhook payload
    payload = wh.verify(JSON.stringify(req.body), {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    });
  } catch (err) {
    Logger.error("Invalid webhook signature", err);
    return res.status(400).json({ error: "Invalid webhook signature" });
  }

  // Handle the webhook event
  const { type, data } = payload;

  if (type === "user.created") {
    try {
      // Create a new user in your database
      await userService.createUser({
        uuid: data.id,
        email: data.email_addresses[0]?.email_address,
        username: `${data.first_name} ${data.last_name}`
      });
      
      Logger.info(`User created: ${data.id}`);
      return res.status(200).json({ success: true });
    } catch (error) {
      Logger.error("Error creating user", error);
      return res.status(500).json({ error: "Failed to create user" });
    }
  }

  // Return a 200 for any other event types
  return res.status(200).json({ received: true });
});

export const clerkMiddleware = router; 