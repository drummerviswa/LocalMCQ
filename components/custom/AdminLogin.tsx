import { useAppDispatch } from "@/app/hooks";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import instance from "@/lib/axios";
import { makelogin, setAdminDetails } from "@/lib/features/admin/adminSlice";
import { useState } from "react";

export default function AdminLogin({ open }: { open: boolean }) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const dispatch = useAppDispatch();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    const data = {
      username: formData.get("username"),
      password: formData.get("password"),
    };

    try {
      const res = await instance.post("/admin/auth/login", data, {
        withCredentials: true,
      });

      if (res.data.success) {
        dispatch(setAdminDetails(res.data.data));
        localStorage.setItem("admin", JSON.stringify(res.data.data));
        window.location.reload();
        dispatch(makelogin());
      } else {
        setError(res.data.message || "Invalid credentials");
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Something went wrong. Try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent showCloseButton={false} className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Admin Login
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <Label htmlFor="username">Username</Label>
              <Input id="username" name="username" required />
            </Field>
            <Field>
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </Field>
          </FieldGroup>

          <DialogFooter className="mt-4">
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </Button>
          </DialogFooter>

          {error && (
            <DialogDescription className="text-red-500 mt-2 text-center">
              {error}
            </DialogDescription>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
