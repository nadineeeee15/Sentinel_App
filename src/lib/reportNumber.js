// Report reference like INC-20261028-K3PQ, the same format the AI function
// uses, so reports made without an AI summary still get a number.
export function generateReportNumber() {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `INC-${ymd}-${rand}`;
}
