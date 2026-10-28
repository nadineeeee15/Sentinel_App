import React from "react";
import { ShieldAlert } from "lucide-react";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogAction,
} from "@/components/ui/alert-dialog";

// Shown after a PDF export: the file is not encrypted, so remind the user to
// move it somewhere secure and delete the copy left on the device.
export default function PdfSafetyNotice({ open, onOpenChange }) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-[calc(100%-2rem)] rounded-2xl sm:max-w-md">
        <AlertDialogHeader className="items-center text-center sm:text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-500/15">
            <ShieldAlert className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <AlertDialogTitle>Please protect your file</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2 text-center">
            <span className="block">
              Your report has been saved as a PDF on this device. It is not password
              protected, so anyone who opens it can read it.
            </span>
            <span className="block">
              Secure it now, for example on a USB drive or with someone you trust,
              and delete this file from your device once you're finished.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction className="w-full rounded-full">I understand</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
