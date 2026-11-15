// Temporary screen to check the theme on your phone.
// It becomes the Welcome screen in step 4.
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, type } from '../theme';

export default function Index() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: spacing.screen, gap: spacing.md }}>
        <Text style={type.label}>Setup check</Text>
        <Text style={type.display}>cloutlet</Text>
        <Text style={type.h2}>Newsreader for headings.</Text>
        <Text style={type.body}>Inter for everything else. If this looks calm, we're good.</Text>
        <View style={{ height: 1, backgroundColor: colors.divider }} />
        <Text style={type.small}>Secondary text looks like this.</Text>
      </View>
    </SafeAreaView>
  );
}
