// Two columns of cards with different heights, like Pinterest (and the B1 mockup).
// Each new item goes into whichever column is currently shorter.
import { ReactElement, ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { spacing } from '../theme';

type Props<T> = {
  items: T[];
  getHeight: (item: T) => number; // rough height, used to balance the columns
  keyExtractor: (item: T) => string;
  renderItem: (item: T) => ReactElement;
  header?: ReactNode; // anything to show above the feed (search bar, tabs)
  gap?: number;
};

export function MasonryFeed<T>({
  items,
  getHeight,
  keyExtractor,
  renderItem,
  header,
  gap = spacing.md,
}: Props<T>) {
  const left: T[] = [];
  const right: T[] = [];
  let leftHeight = 0;
  let rightHeight = 0;

  for (const item of items) {
    if (leftHeight <= rightHeight) {
      left.push(item);
      leftHeight += getHeight(item) + gap;
    } else {
      right.push(item);
      rightHeight += getHeight(item) + gap;
    }
  }

  const column = (list: T[]) => (
    <View style={{ flex: 1, gap }}>
      {list.map((item) => (
        <View key={keyExtractor(item)}>{renderItem(item)}</View>
      ))}
    </View>
  );

  return (
    <ScrollView
      contentContainerStyle={{ paddingHorizontal: spacing.screen, paddingBottom: spacing.xxl }}
      showsVerticalScrollIndicator={false}
    >
      {header}
      <View style={{ flexDirection: 'row', gap }}>
        {column(left)}
        {column(right)}
      </View>
    </ScrollView>
  );
}
