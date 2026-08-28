export function createCustomerNumber(id: string, createdAt: number) {
  const year = new Date(createdAt).getFullYear();
  const suffix = id.replaceAll("-", "").slice(0, 6).toUpperCase();
  return `KD-${year}-${suffix}`;
}

export function createInvoiceNumber(
  prefix: string,
  issueDate: string,
  sequenceNumber: number
) {
  const year = issueDate.slice(0, 4) || String(new Date().getFullYear());
  const normalizedPrefix = prefix.trim().toUpperCase() || "RE";
  return `${normalizedPrefix}-${year}-${String(sequenceNumber).padStart(4, "0")}`;
}
