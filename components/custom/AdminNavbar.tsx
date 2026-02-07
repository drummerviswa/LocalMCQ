"use client";

import instance from "@/lib/axios";
import { Button } from "../ui/button";
import { LogOut, Trash } from "lucide-react";

export function AdminNavbar({
  onDeleteClick,
}: {
  onDeleteClick: () => void;
}) {
  const handleLogout = async () => {
    await instance.post("/admin/auth/logout", {}, { withCredentials: true });
    localStorage.removeItem("admin");
    localStorage.removeItem("otp_verified");
    window.location.reload();
  };

  return (
    <div className="grid grid-cols-12 items-center border-b mx-auto max-w-7xl px-4 py-3">
      <div className="col-span-6 text-lg font-semibold">
        Hello Admin 👋🏻
      </div>

      <div className="col-span-6 flex justify-end items-center gap-3">
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>

        <Button variant="destructive" onClick={onDeleteClick}>
          <Trash className="mr-2 h-4 w-4" />
          Delete Results
        </Button>
      </div>
    </div>
  );
}
