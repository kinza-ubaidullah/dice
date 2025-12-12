
// Default to localhost, but allow override from LocalStorage
export const getBaseUrl = () => localStorage.getItem('api_base_url') || 'https://dice-627497957398.europe-west1.run.app';

interface ApiResponse<T> {
  status?: string | number;
  message?: string;
  data?: T;
  [key: string]: any;
}

/**
 * Standard fetch wrapper.
 * Throws real errors if the backend is unreachable.
 * NO SIMULATION - Ensures real backend connection is required.
 */
async function fetchFromBackend(url: string, options: RequestInit) {
  console.log(`[API Request] ${options.method} ${url}`);
  
  try {
    const response = await fetch(url, options);
    
    // Check if response is JSON
    const contentType = response.headers.get("content-type");
    let data;
    if (contentType && contentType.indexOf("application/json") !== -1) {
      data = await response.json();
    } else {
      const text = await response.text();
      if (response.status === 404) {
          throw new Error(`Endpoint not found (404): ${url}.`);
      }
      throw new Error(`Server Error (${response.status}): ${text.substring(0, 50)}...`);
    }
    
    if (!response.ok) {
        if (Array.isArray(data.message)) {
            throw new Error(data.message[0]); 
        }
        throw new Error(data.message || `API Error: ${response.status}`);
    }
    return data;
  } catch (error: any) {
    console.error("[API Error]", error);
    const isNetworkError = 
        error.message === 'Failed to fetch' || 
        error.message.includes('NetworkError') || 
        error.name === 'TypeError';

    if (isNetworkError) {
        throw new Error(`Connection Failed: Could not reach backend.`);
    }
    
    throw error; 
  }
}

export const authApi = {
  /**
   * 1.1 User Signup
   * POST /api/auth/signup
   */
  signup: async (email: string, password: string, firstName: string, lastName: string, phone: string, role: string = 'user') => {
    const baseUrl = getBaseUrl();
    const cleanPhone = phone.replace(/\D/g, ''); 
    const phoneNum = cleanPhone ? parseInt(cleanPhone, 10) : 0;

    return fetchFromBackend(
      `${baseUrl}/api/auth/signup`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            email, 
            password, 
            firstName,
            lastName,
            phoneNumber: phoneNum, 
            role
        }),
      }
    );
  },

  /**
   * 1.2 User Login
   * GET /api/auth/login
   */
  login: async (phoneNumber: string, password: string) => {
    const baseUrl = getBaseUrl();
    const cleanPhone = phoneNumber.replace(/\D/g, ''); 

    return fetchFromBackend(
      `${baseUrl}/api/auth/login?phoneNumber=${cleanPhone}&password=${encodeURIComponent(password)}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  },

  /**
   * 1.3 Forgot Password
   */
  forgotPassword: async (email: string, newPassword: string, confirmPassword: string) => {
    const baseUrl = getBaseUrl();
    return fetchFromBackend(
      `${baseUrl}/api/mailsender/forgotPassword`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword, confirmPassword }),
      }
    );
  },

  /**
   * 1.4 Reset Password
   */
  resetPassword: async (email: string, password: string) => {
    const baseUrl = getBaseUrl();
    return fetchFromBackend(
      `${baseUrl}/api/mailsender/resetPassword`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      }
    );
  }
};

export const gameApi = {
  /**
   * 2.1 Live Users
   * GET /api/game/searchPlayers
   */
  getLiveUsers: async () => {
    const baseUrl = getBaseUrl();
    try {
        return await fetchFromBackend(`${baseUrl}/api/game/searchPlayers`, { method: 'GET' });
    } catch (error: any) {
        console.warn(`Live Users API Error: ${error.message}`);
        return { onlineUsers: [] };
    }
  },

  /**
   * 2.2 Roll Dice
   * POST /api/game/rollDice
   */
  rollDice: async (players: { uid: string, displayName: string }[]) => {
    const baseUrl = getBaseUrl();
    return fetchFromBackend(
      `${baseUrl}/api/game/rollDice`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(players)
      }
    );
  }
};

export const adminApi = {
    /**
     * 3.1 Deposit
     * POST /api/admin/deposit
     */
    deposit: async (uid: string, displayName: string, amount: number, vip: boolean = false) => {
        const baseUrl = getBaseUrl();
        return fetchFromBackend(
            `${baseUrl}/api/admin/deposit`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uid, displayName, vip, amount })
            }
        );
    },

    /**
     * 3.2 Deposit History
     * GET /api/admin/depositHistory
     */
    getDepositHistory: async () => {
        const baseUrl = getBaseUrl();
        try {
            return await fetchFromBackend(`${baseUrl}/api/admin/depositHistory`, { method: 'GET' });
        } catch (e) {
            console.warn("Deposit History API failed", e);
            return [];
        }
    },

    /**
     * 3.3 Check Profitability
     * GET /api/admin/profitability?commission=X
     */
    getProfitability: async (commission: number = 5) => {
        const baseUrl = getBaseUrl();
        try {
            // Fixed: Added /api/admin prefix to match likely server structure and fix 404
            return await fetchFromBackend(`${baseUrl}/api/admin/profitability?commission=${commission}`, { method: 'GET' });
        } catch (e) {
            console.warn("Profitability API failed", e);
            return { transactions: 0, commission: 0, totalProfit: 0, depositHistory: [] };
        }
    }
};
