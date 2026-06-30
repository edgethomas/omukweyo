import UserSettingsPage from '@/features/profile/UserSettingsPage';

export default function RunnerSettings() {
  return (
    <UserSettingsPage
      roleLabel="Runner"
      profilePath="/runner/profile"
      allowDelete
      notificationDescription="New job alerts, payout updates, and proof-of-line messages for your active coverage."
    />
  );
}