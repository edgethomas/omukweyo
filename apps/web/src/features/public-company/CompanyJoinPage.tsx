import StubPage from '@/components/StubPage';

export default function CompanyJoinPage() {
  return (
    <StubPage
      title="Join a queue"
      subtitle="Pick a service and join the live queue in one tap."
      phase={2}
      bullets={[
        'Choose the service and confirm contact details.',
        'See live position and ETA before joining.',
        'Get the ticket by SMS or open the live ticket on this device.',
      ]}
      backTo="/businesses"
      backLabel="Back to businesses"
    />
  );
}
