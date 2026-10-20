"use client";
import { useState } from "react";
import { Trash2, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { PriceRecord } from "@/lib/types";
import { deleteRecord } from "@/app/actions";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  Button,
} from "./ui";
export function DeleteRecordDialog({ record }: { record: PriceRecord }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  return (
    <AlertDialog
      open={open}
      onOpenChange={(v) => {
        if (!busy) setOpen(v);
      }}
    >
      <AlertDialogTrigger asChild>
        <Button variant="ghost" className="delete" aria-label="حذف رکورد">
          <Trash2 size={16} />
          <span>حذف</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogTitle className="dialog-title">
          آیا از حذف این رکورد مطمئن هستید؟
        </AlertDialogTitle>
        <AlertDialogDescription className="muted">
          این عملیات قابل بازگشت نیست و اطلاعات قیمت حذف خواهد شد.
        </AlertDialogDescription>
        <div className="dialog-actions">
          <Button
            variant="destructive"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                const result = await deleteRecord(record);
                if (result.ok) {
                  toast.success("رکورد حذف شد.");
                  setOpen(false);
                  router.refresh();
                } else toast.error(result.error);
              } catch {
                toast.error("ارتباط با سرور ناموفق بود.");
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy && <LoaderCircle className="spin" size={16} />}حذف
          </Button>
          <AlertDialogCancel asChild>
            <Button variant="outline" disabled={busy}>
              انصراف
            </Button>
          </AlertDialogCancel>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
