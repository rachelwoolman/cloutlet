// Profile tab: your own profile, exactly as others see it. The gear opens Settings.
import { ProfileView } from '../../components/ProfileView';
import { useMe } from '../../data/session';

export default function MyProfile() {
  const me = useMe();
  return <ProfileView id={me.id} asTab />;
}
