"use client";

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { useAppDispatch } from "@/app/hooks";
import { verifyOtp } from "@/lib/features/admin/adminSlice";

const OTP_VALUE = "3010"; // simple client gate
const STORAGE_KEY = "otp_verified";

export default function OTP() {
  const [error, setError] = useState("");
  const [value, setValue] = useState("");
  const dispatch = useAppDispatch();

  // 🔁 Restore OTP state on refresh
  useEffect(() => {
    const verified = localStorage.getItem(STORAGE_KEY);
    if (verified === "true") {
      dispatch(verifyOtp());
    }
  }, [dispatch]);

  const handleChange = (otp: string) => {
    setValue(otp);
    setError("");

    if (otp.length === 4) {
      if (otp === OTP_VALUE) {
        localStorage.setItem(STORAGE_KEY, "true");
        dispatch(verifyOtp());
      } else {
        setError("Invalid OTP. Try again.");
      }
    }
  };

  return (
    <Dialog open>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            Enter OTP to Continue
          </DialogTitle>
        </DialogHeader>

        <InputOTP
          value={value}
          onChange={handleChange}
          maxLength={4}
          className="w-full">
          <InputOTPGroup className="flex w-full gap-3 justify-center">
            {[0, 1, 2, 3].map((i) => (
              <InputOTPSlot key={i} index={i} className="flex-1 h-14 text-xl" />
            ))}
          </InputOTPGroup>
        </InputOTP>

        {error && (
          <p className="text-red-500 text-sm text-center mt-2">{error}</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
