import type { CrmAppointment, CrmCustomer } from "@/types/Crm";

function escapeCalendarText(value: string) {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll("\n", "\\n")
    .replaceAll(",", "\\,")
    .replaceAll(";", "\\;");
}

function toCalendarDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date
    .toISOString()
    .replaceAll("-", "")
    .replaceAll(":", "")
    .replace(/\.\d{3}Z$/, "Z");
}

function appointmentEnd(appointment: CrmAppointment) {
  if (appointment.endAt) return appointment.endAt;
  const start = new Date(appointment.startAt);
  if (Number.isNaN(start.getTime())) return appointment.startAt;
  return new Date(start.getTime() + 60 * 60 * 1000).toISOString();
}

function calendarDescription(customer: CrmCustomer, appointment: CrmAppointment) {
  const address = [
    customer.street,
    `${customer.postalCode} ${customer.city}`.trim(),
  ]
    .filter(Boolean)
    .join(", ");

  return [
    `Kunde: ${customer.name}`,
    customer.company && `Firma: ${customer.company}`,
    customer.customerNumber && `Kundennummer: ${customer.customerNumber}`,
    customer.email && `E-Mail: ${customer.email}`,
    customer.phone && `Telefon: ${customer.phone}`,
    address && `Adresse: ${address}`,
    appointment.details && `Details: ${appointment.details}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function downloadAppointmentCalendar(
  customer: CrmCustomer,
  appointment: CrmAppointment
) {
  const startAt = toCalendarDate(appointment.startAt);
  const endAt = toCalendarDate(appointmentEnd(appointment));
  if (!startAt || !endAt) return false;

  const location = [
    customer.street,
    `${customer.postalCode} ${customer.city}`.trim(),
  ]
    .filter(Boolean)
    .join(", ");
  const calendar = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Umzugshelden//CRM//DE",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${escapeCalendarText(appointment.id)}@umzugshelden.io`,
    `DTSTAMP:${toCalendarDate(new Date().toISOString())}`,
    `DTSTART:${startAt}`,
    `DTEND:${endAt}`,
    `SUMMARY:${escapeCalendarText(`${appointment.title} - ${customer.name}`)}`,
    `DESCRIPTION:${escapeCalendarText(calendarDescription(customer, appointment))}`,
    `LOCATION:${escapeCalendarText(location)}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const file = new Blob([calendar], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${appointment.title || "Termin"}.ics`
    .replace(/[^a-z0-9äöüß_-]+/gi, "-")
    .replace(/^-|-$/g, "");
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  return true;
}