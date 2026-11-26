// Bottom tabs: Explore, Map, Inbox, Profile. Same for creators and businesses.
// No Post tab: businesses post jobs from the + on Explore; creators add portfolio videos in Settings.
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { ColorValue } from 'react-native';
import { needsMyMove } from '../../components/OfferSummary';
import { useAlerts, useOffers } from '../../data/hooks';
import { useLocationSync } from '../../data/location';
import { useSession } from '../../data/session';
import { Profile } from '../../data/types';
import { colors, fonts } from '../../theme';

type IconName = keyof typeof Ionicons.glyphMap;
type IconProps = { color: ColorValue; focused: boolean; size: number };

function TabIcon({ name, active, color, focused, size }: IconProps & { name: IconName; active: IconName }) {
  return <Ionicons name={focused ? active : name} size={size - 2} color={color as string} />;
}

const icon = (name: IconName, active: IconName) =>
  function Icon(props: IconProps) {
    return <TabIcon name={name} active={active} {...props} />;
  };

export default function TabsLayout() {
  const session = useSession();
  if (session.status !== 'ready') return null; // root layout sends signed-out people to Welcome
  return <SignedInTabs me={session.profile} />;
}

function SignedInTabs({ me }: { me: Profile }) {
  const offers = useOffers(me);
  useLocationSync(me); // asks for location the first time, then keeps it fresh
  const alerts = useAlerts(me);
  const yourMove = (offers.data ?? []).filter((o) => needsMyMove(o, me.role)).length;
  const unreadUpdates = (alerts.data ?? []).filter((a) => !a.read).length;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.divider },
        tabBarLabelStyle: { fontFamily: fonts.bodyMedium, fontSize: 11 },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen name="explore" options={{ title: 'Explore', tabBarIcon: icon('compass-outline', 'compass') }} />
      <Tabs.Screen name="map" options={{ title: 'Map', tabBarIcon: icon('map-outline', 'map') }} />
      <Tabs.Screen
        name="inbox"
        options={{
          title: 'Inbox',
          tabBarIcon: icon('chatbubbles-outline', 'chatbubbles'),
          tabBarBadge: yourMove + unreadUpdates || undefined,
          tabBarBadgeStyle: { backgroundColor: colors.accent, fontFamily: fonts.bodySemiBold, fontSize: 10 },
        }}
      />
      <Tabs.Screen name="me" options={{ title: 'Profile', tabBarIcon: icon('person-outline', 'person') }} />
    </Tabs>
  );
}
