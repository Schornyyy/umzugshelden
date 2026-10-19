import AppointmentSession from "./AppointmentSession";

export default async function AppointmentPage({
  params,
}: {
  params: Promise<{
    userid: string;
    customerId: string;
    appointmentId: string;
  }>;
}) {
  const { userid, customerId, appointmentId } = await params;
  return (
    <AppointmentSession
      ownerId={userid}
      customerId={customerId}
      appointmentId={appointmentId}
    />
  );
}
