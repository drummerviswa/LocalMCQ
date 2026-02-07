import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function DeleteOtpDialog({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");

  const REAL_OTP = process.env.NEXT_PUBLIC_OTP || "3010";

  const handleVerify = () => {
    if (otp === REAL_OTP) {
      setError("");
      onSuccess();
    } else {
      setError("Invalid OTP");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-red-600">
            Confirm Deletion with OTP
          </DialogTitle>
        </DialogHeader>

        <Input
          placeholder="Enter OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
        />

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleVerify}>
            Verify & Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
