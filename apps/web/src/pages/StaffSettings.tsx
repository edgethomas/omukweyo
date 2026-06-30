import UserSettingsPage from '@/features/profile/UserSettingsPage';

export default function StaffSettings() {
  return (
    <UserSettingsPage
      roleLabel="Counter staff"
      profilePath="/staff/profile"
      allowDelete
      notificationDescription="Shift reminders, walk-in alerts, and queue status updates for your counter."
    />
  );
}