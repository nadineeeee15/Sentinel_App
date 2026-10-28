import React from "react";
import { Sparkles } from "lucide-react";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel,
} from "@/components/ui/alert-dialog";

// One-time opt-in before the first AI summary: says exactly what is sent.
export default function AiConsentDialog({ open, onOpenChange, onConfirm }) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-[calc(100%-2rem)] rounded-2xl sm:max-w-md">
        <AlertDialogHeader className="items-center text-center sm:text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-500/15">
            <Sparkles className="h-6 w-6 text-violet-600 dark:text-violet-300" />
          </div>
          <AlertDialogTitle>Use AI to write your summary?</AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            To write your summary, the title, category, severity, description, location and date
            you typed are sent to an AI service. Your photos, GPS location and identity are never
            sent. You'll review and can edit the summary before exporting.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:space-x-0">
          <AlertDialogCancel className="mt-0 w-full rounded-full sm:w-auto">Cancel</AlertDialogCancel>
          <AlertDialogAction className="w-full rounded-full sm:w-auto" onClick={onConfirm}>
            Allow and generate
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
