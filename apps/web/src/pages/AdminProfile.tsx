import UserProfilePage from '@/features/profile/UserProfilePage';

export default function AdminProfile() {
  return (
    <UserProfilePage
      roleLabel="Platform admin"
      allowDelete={false}
      emailRequired
      deleteMessage="Platform admin accounts cannot self-delete to prevent lockout. Hand the role over to another admin first."
    />
  );
}
