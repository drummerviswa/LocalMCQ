import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function MalpracticeDialog({
  open,
  strikes,
  onClose,
}: {
  open: boolean;
  strikes: number;
  onClose: () => void;
}) {
  return (
    <Dialog open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-red-600">
            Malpractice Detected!
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm">
          You attempted to leave fullscreen, switch tabs, open developer tools,
          or copy content.
        </p>

        <p className="mt-3 font-semibold">
          Warning {strikes} / 2
        </p>

        <Button className="mt-4 w-full" onClick={onClose}>
          Continue Test
        </Button>
      </DialogContent>
    </Dialog>
  );
}
