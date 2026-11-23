// Welcome: pick a side. Both sides land on the same Explore feed.
import { Image } from 'expo-image';
import { Redirect, router } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../components';
import { startDemo, useSession } from '../data/session';
import { Role } from '../data/types';
import { isLive } from '../lib/config';
import { colors, radius, spacing, type } from '../theme';

const logo = require('../../assets/logo.jpg');

export default function Welcome() {
  const session = useSession();

  if (session.status === 'ready') return <Redirect href="/explore" />;
  if (session.status === 'needsProfile') return <Redirect href="/sign-in" />;

  const choose = async (role: Role) => {
    if (isLive) {
      router.push({ pathname: '/sign-in', params: { role } });
    } else {
      await startDemo(role); // once signed in, the Redirect above opens Explore
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1, paddingHorizontal: spacing.screen, justifyContent: 'center' }}>
        <View
          style={{
            alignSelf: 'flex-start',
            backgroundColor: colors.logoCard,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: colors.divider,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            marginBottom: spacing.xxl,
          }}
        >
          <Image source={logo} style={{ width: 120, height: 67 }} contentFit="contain" />
        </View>

        <Text style={type.display}>Local spots.{'\n'}Local creators.</Text>
        <Text style={[type.body, { color: colors.textSecondary, marginTop: spacing.md }]}>
          Businesses get videos. Creators get paid.
        </Text>
      </View>

      <View style={{ paddingHorizontal: spacing.screen, paddingBottom: spacing.lg, gap: spacing.sm }}>
        {session.status === 'loading' ? (
          <ActivityIndicator color={colors.accent} style={{ height: 112 }} />
        ) : (
          <>
            <Button title="I'm a business" onPress={() => choose('business')} />
            <Button title="I'm a creator" variant="secondary" onPress={() => choose('creator')} />
          </>
        )}
        {!isLive ? <Text style={[type.small, { textAlign: 'center', marginTop: spacing.sm }]}>Demo mode · sample data</Text> : null}
      </View>
    </SafeAreaView>
  );
}
