import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function ConfirmDialog({ open, onConfirm, onCancel }) {
  return (
    <Dialog open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-red-600">
            Are you sure you want to end the test?
          </DialogTitle>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Continue Test
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            End Test
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
