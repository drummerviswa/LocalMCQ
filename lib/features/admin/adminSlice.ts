import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../store";

export interface AdminState {
  isLoggedIn: boolean;
  otpVerified: boolean;
  adminDetails?: {
    username: string;
    password: string;
    name: string;
  };
}

const initialState: AdminState = {
  isLoggedIn: false,
  otpVerified: false,
};

export const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    makelogin: (state) => {
      state.isLoggedIn = true;
    },
    makelogout: (state) => {
      state.isLoggedIn = false;
    },
    verifyOtp: (state) => {
      state.otpVerified = true;
    },
    setAdminDetails: (
      state,
      action: PayloadAction<AdminState["adminDetails"]>,
    ) => {
      state.adminDetails = action.payload;
    },
  },
});

export const { makelogin, makelogout, verifyOtp, setAdminDetails } = adminSlice.actions;

export const selectIsLoggedIn = (state: RootState) => state.admin.isLoggedIn;
export const selectOtpVerified = (state: RootState) => state.admin.otpVerified;

export default adminSlice.reducer;
