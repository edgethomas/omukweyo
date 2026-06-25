import StubPage from '@/components/StubPage';

export default function EmbedPage() {
  return (
    <StubPage
      title="Embed a business"
      subtitle="Configure the iframe or script that drops Omukweyo on another site."
      phase={3}
      bullets={[
        'Pick the company and branch to embed.',
        'Set default service and brand color.',
        'Copy the script tag or iframe snippet.',
      ]}
      backTo="/dashboard"
      backLabel="Back to admin console"
    />
  );
}
