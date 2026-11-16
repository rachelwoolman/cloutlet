// Welcome: pick which side of Cloutlet you want to try.
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../components';
import { colors, radius, spacing, type } from '../theme';

// To use a different logo, replace this file (or change the path).
const logo = require('../../assets/logo.jpg');

export default function Welcome() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1, paddingHorizontal: spacing.screen, justifyContent: 'center' }}>
        {/* The goggles are white, so they sit on a card the same color as the logo's background */}
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

        <Text style={type.display}>Local spots,{'\n'}meet local creators.</Text>
        <Text style={[type.body, { color: colors.textSecondary, marginTop: spacing.md }]}>
          Cafes get videos people actually watch. Creators get paid in money and, occasionally,
          pastries.
        </Text>
      </View>

      <View style={{ paddingHorizontal: spacing.screen, paddingBottom: spacing.lg, gap: spacing.sm }}>
        <Button title="I'm a business" onPress={() => router.push('/business/discover')} />
        <Button title="I'm a creator" variant="secondary" onPress={() => router.push('/creator/offers')} />
        <Text style={[type.small, { textAlign: 'center', marginTop: spacing.sm }]}>
          A prototype. Nothing here is real, including the pastries.
        </Text>
      </View>
    </SafeAreaView>
  );
}
