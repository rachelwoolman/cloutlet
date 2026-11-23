// Someone's profile (or yours, opened from elsewhere). The view itself is in components/ProfileView.
import { useLocalSearchParams } from 'expo-router';
import { ProfileView } from '../../components/ProfileView';

export default function ProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ProfileView id={id} />;
}
