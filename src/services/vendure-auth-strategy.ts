import { VendureService } from "./vendure";

interface PrivyAuthData {
  privyUserId: string;
  email: string;
  twitterUsername?: string;
  twitterOAuthToken?: string;
  twitterRefreshToken?: string;
}

export class PrivyVendureAuthStrategy {
  static async authenticate(data: PrivyAuthData) {
    try {
      const response = await VendureService.loginOrRegister(
        data.email,
        data.privyUserId
      );

      if (!response.token) {
        throw new Error("No token received from Vendure");
      }

      localStorage.setItem("vendureToken", response.token);
      return {
        success: true,
        user: response.user,
        token: response.token
      };
    } catch (error) {
      console.error("Privy-Vendure authentication error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Authentication failed"
      };
    }
  }

  static async validateSession(token: string) {
    try {
      const user = await VendureService.getCurrentUser(token);
      return {
        success: true,
        user
      };
    } catch (error) {
      console.error("Session validation error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Session validation failed"
      };
    }
  }

  static async logout() {
    try {
      await VendureService.logout();
      return { success: true };
    } catch (error) {
      console.error("Logout error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Logout failed"
      };
    }
  }
}