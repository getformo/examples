import { create } from "zustand";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

interface UserSOLBalanceStore {
  balance: number;
  isLoading: boolean;
  getUserSOLBalance: (publicKey: PublicKey, connection: Connection) => Promise<void>;
}

export const useUserSOLBalanceStore = create<UserSOLBalanceStore>((set) => ({
  balance: 0,
  isLoading: false,
  getUserSOLBalance: async (publicKey, connection) => {
    set({ isLoading: true });
    try {
      const balance = await connection.getBalance(publicKey, "confirmed");
      set({ balance: balance / LAMPORTS_PER_SOL, isLoading: false });
    } catch (error) {
      console.error("Error getting SOL balance:", error);
      set({ balance: 0, isLoading: false });
    }
  },
}));
