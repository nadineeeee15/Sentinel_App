import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import IncidentForm from "./IncidentForm";

export default function IncidentSheet({ open, onOpenChange, incident, onSaved }) {
  const editing = Boolean(incident?.id);
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-slate-100 px-5 py-4 text-left">
          <SheetTitle>{editing ? "Edit incident" : "Log an incident"}</SheetTitle>
          <SheetDescription>
            {editing ? "Update the details of this incident." : "Capture what happened while it's fresh."}
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-5 py-5">
          <IncidentForm
            incident={incident}
            onSaved={(saved) => {
              onSaved?.(saved);
              onOpenChange?.(false);
            }}
            onCancel={() => onOpenChange?.(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}