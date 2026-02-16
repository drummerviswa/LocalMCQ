"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface PinDialogProps {
    onVerified: () => void;
    open: boolean;
}

export function PinDialog({ onVerified, open }: PinDialogProps) {
    const [pin, setPin] = useState("");
    const [error, setError] = useState("");

    const handleVerify = () => {
        if (pin === "3010") {
            onVerified();
            setError("");
        } else {
            setError("Invalid PIN. Please try again.");
        }
    };

    return (
        <Dialog open={open} onOpenChange={() => { }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-center text-xl">Enter Admin PIN</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-4">
                    <Input
                        type="password"
                        placeholder="Enter 4-digit PIN"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        className="text-center text-2xl tracking-widest"
                        maxLength={4}
                        onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                    />
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    <Button onClick={handleVerify} className="w-full">
                        Verify PIN
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
