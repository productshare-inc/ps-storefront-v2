import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://neondb_owner:rGSD58CKqkgH@ep-old-rice-a6y6dsq0.us-west-2.aws.neon.tech/neondb?sslmode=require"
});

export const initializeDatabase = async () => {
  const client = await pool.connect();
  try {
    console.log("Starting database initialization...");
    
    // First check if table exists
    const tableCheck = await client.query(`\n      SELECT EXISTS (\n        SELECT FROM information_schema.tables \n        WHERE table_name = 'softgen_users'\n      );\n    `);
    
    const tableExists = tableCheck.rows[0].exists;
    console.log("Table exists check:", tableExists);

    if (!tableExists) {
      console.log("Creating softgen_users table...");
      await client.query(`\n        CREATE TABLE softgen_users (\n          id SERIAL PRIMARY KEY,\n          privy_user_id TEXT UNIQUE NOT NULL,\n          email TEXT,\n          twitter_oauth_token TEXT,\n          twitter_refresh_token TEXT,\n          twitter_username TEXT,\n          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,\n          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP\n        );\n      `);
      console.log("Table created successfully");
    } else {
      console.log("Table already exists, skipping creation");
    }

    return { success: true, tableExists };
  } catch (error) {
    console.error("Error in database initialization:", error);
    throw error;
  } finally {
    client.release();
  }
};

export const saveUserData = async ({
  privyUserId,
  email,
  twitterOAuthToken,
  twitterRefreshToken,
  twitterUsername
}: {
  privyUserId: string;
  email?: string | null;
  twitterOAuthToken?: string | null;
  twitterRefreshToken?: string | null;
  twitterUsername?: string | null;
}) => {
  const client = await pool.connect();
  try {
    console.log("Saving user data:", {
      privyUserId,
      hasEmail: !!email,
      hasTwitterToken: !!twitterOAuthToken,
      twitterUsername
    });

    const result = await client.query(
      `\n        INSERT INTO softgen_users \n        (privy_user_id, email, twitter_oauth_token, twitter_refresh_token, twitter_username)\n        VALUES ($1, $2, $3, $4, $5)\n        ON CONFLICT (privy_user_id) \n        DO UPDATE SET \n          email = COALESCE(EXCLUDED.email, softgen_users.email),\n          twitter_oauth_token = COALESCE(EXCLUDED.twitter_oauth_token, softgen_users.twitter_oauth_token),\n          twitter_refresh_token = COALESCE(EXCLUDED.twitter_refresh_token, softgen_users.twitter_refresh_token),\n          twitter_username = COALESCE(EXCLUDED.twitter_username, softgen_users.twitter_username),\n          updated_at = CURRENT_TIMESTAMP\n        RETURNING *\n      `,
      [privyUserId, email || null, twitterOAuthToken || null, twitterRefreshToken || null, twitterUsername || null]
    );

    console.log("User data saved:", result.rows[0]);
    return result.rows[0];
  } catch (error) {
    console.error("Error saving user data:", error);
    throw error;
  } finally {
    client.release();
  }
};