import UserProfilePage from '@/features/profile/UserProfilePage';

export default function StaffProfile() {
  return (
    <UserProfilePage
      roleLabel="Counter staff"
      settingsPath="/staff/settings"
      allowDelete
      emailRequired
      deleteMessage="Removes your counter account, contact details, session, and profile photo. Branch history and tickets served today stay on the company record."
    />
  );
}