import * as React from "react";
import {
  Slot,
  Dialog as DialogPrimitive,
  AlertDialog as AlertPrimitive,
} from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { X } from "lucide-react";
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
const variants = cva("button", {
  variants: {
    variant: {
      default: "primary",
      outline: "outline",
      ghost: "ghost",
      destructive: "destructive",
    },
  },
  defaultVariants: { variant: "default" },
});
export function Button({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof variants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "button";
  return <Comp className={cn(variants({ variant }), className)} {...props} />;
}
export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return <input className={cn("input", className)} {...props} />;
}
export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;
export const DialogTitle = DialogPrimitive.Title;
export const DialogDescription = DialogPrimitive.Description;
export function DialogContent({
  children,
  closeDisabled = false,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  closeDisabled?: boolean;
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="overlay" />
      <DialogPrimitive.Content dir="rtl" className="dialog" {...props}>
        {children}
        <DialogPrimitive.Close
          disabled={closeDisabled}
          className="close"
          aria-label="بستن"
        >
          <X size={18} />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
export const AlertDialog = AlertPrimitive.Root;
export const AlertDialogTrigger = AlertPrimitive.Trigger;
export const AlertDialogTitle = AlertPrimitive.Title;
export const AlertDialogDescription = AlertPrimitive.Description;
export const AlertDialogCancel = AlertPrimitive.Cancel;
export function AlertDialogContent({ children }: React.PropsWithChildren) {
  return (
    <AlertPrimitive.Portal>
      <AlertPrimitive.Overlay className="overlay" />
      <AlertPrimitive.Content dir="rtl" className="dialog">
        {children}
      </AlertPrimitive.Content>
    </AlertPrimitive.Portal>
  );
}
export function Table(props: React.ComponentProps<"table">) {
  return (
    <div className="table-scroll">
      <table {...props} />
    </div>
  );
}
export function TableHeader(props: React.ComponentProps<"thead">) {
  return <thead {...props} />;
}
export function TableBody(props: React.ComponentProps<"tbody">) {
  return <tbody {...props} />;
}
export function TableRow(props: React.ComponentProps<"tr">) {
  return <tr {...props} />;
}
export function TableHead(props: React.ComponentProps<"th">) {
  return <th {...props} />;
}
export function TableCell(props: React.ComponentProps<"td">) {
  return <td {...props} />;
}
