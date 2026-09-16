import { formatDistanceToNowStrict, format } from "date-fns";

export function formatRelative(date) {
  if (!date) return "";
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "";
    return formatDistanceToNowStrict(d, { addSuffix: true });
  } catch {
    return "";
  }
}

export function formatDate(date) {
  if (!date) return "";
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "";
    return format(d, "d MMM yyyy, h:mm a");
  } catch {
    return "";
  }
}