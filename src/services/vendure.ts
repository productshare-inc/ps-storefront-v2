import { usePrivy } from "@privy-io/react-auth";

interface VendureLoginResponse {
  token: string;
  expires: string;
  user: {
    id: string;
    identifier: string;
    verified: boolean;
    customFields?: {
      privyUserId?: string;
      twitterUsername?: string;
    };
  };
}

interface PrivyAuthInput {
  privyUserId: string;
  email: string;
  twitterUsername?: string;
  twitterOAuthToken?: string;
  twitterRefreshToken?: string;
}

const VENDURE_API_URL = process.env.NEXT_PUBLIC_VENDURE_API_URL || "https://staging.productshare.net/shop-api";

export class VendureService {
  private static async graphqlRequest(query: string, variables?: any, token?: string) {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(VENDURE_API_URL, {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          query,
          variables,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.errors) {
        throw new Error(data.errors[0].message);
      }

      return data.data;
    } catch (error) {
      console.error("Vendure API error:", error);
      throw error;
    }
  }

  static async authenticateWithPrivy(privyData: PrivyAuthInput): Promise<VendureLoginResponse> {
    const query = `\n      mutation AuthenticateWithPrivy($input: PrivyAuthInput!) {\n        authenticatePrivy(input: $input) {\n          token\n          expires\n          user {\n            id\n            identifier\n            verified\n            customFields {\n              privyUserId\n              twitterUsername\n            }\n          }\n        }\n      }\n    `;

    const result = await this.graphqlRequest(query, {
      input: privyData
    });

    return result.authenticatePrivy;
  }

  static async loginOrRegister(email: string, privyUserId: string, twitterUsername?: string): Promise<VendureLoginResponse> {
    try {
      const authData: PrivyAuthInput = {
        privyUserId,
        email,
        twitterUsername
      };

      const response = await this.authenticateWithPrivy(authData);

      if (!response.token) {
        throw new Error("Authentication failed: No token received");
      }

      return response;
    } catch (error) {
      console.error("Privy authentication error:", error);
      throw error;
    }
  }

  static async getCurrentUser(token: string) {
    const query = `\n      query {\n        me {\n          id\n          identifier\n          verified\n          customFields {\n            privyUserId\n            twitterUsername\n          }\n        }\n      }\n    `;

    const result = await this.graphqlRequest(query, null, token);
    return result.me;
  }

  static async validateSession(token: string): Promise<boolean> {
    try {
      const user = await this.getCurrentUser(token);
      return !!user;
    } catch (error) {
      return false;
    }
  }

  static async logout() {
    const query = `\n      mutation {\n        logout {\n          success\n        }\n      }\n    `;

    await this.graphqlRequest(query);
    localStorage.removeItem("vendureToken");
  }
}