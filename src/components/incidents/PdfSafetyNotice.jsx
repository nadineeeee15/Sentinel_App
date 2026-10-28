import React from "react";
import { ShieldAlert } from "lucide-react";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel,
} from "@/components/ui/alert-dialog";

// Shown before a PDF export: the file is not encrypted, so remind the user to
// move it somewhere secure and delete the copy left on the device. It must come
// first because iOS opens the PDF full screen and hides anything shown after.
export default function PdfSafetyNotice({ open, onOpenChange, onConfirm }) {
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
              Your report will be saved as a PDF on this device. It is not password
              protected, so anyone who opens it can read it.
            </span>
            <span className="block">
              Secure it straight away, for example on a USB drive or with someone you
              trust, and delete this file from your device once you're finished.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:space-x-0">
          <AlertDialogCancel className="mt-0 w-full rounded-full sm:w-auto">Cancel</AlertDialogCancel>
          <AlertDialogAction className="w-full rounded-full sm:w-auto" onClick={onConfirm}>
            I understand, export PDF
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
