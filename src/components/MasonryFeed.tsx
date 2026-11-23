// Two columns of cards with different heights, like Pinterest (and the B1 mockup).
// Each new item goes into whichever column is currently shorter.
// Pull down at the top to refresh: built in on iPhone/Android, added by hand on web.
import { ReactElement, ReactNode, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, RefreshControl, ScrollView, ScrollViewInstance, View } from 'react-native';
import { colors, spacing } from '../theme';

type Props<T> = {
  items: T[];
  getHeight: (item: T) => number; // rough height, used to balance the columns
  keyExtractor: (item: T) => string;
  renderItem: (item: T) => ReactElement;
  header?: ReactNode; // anything to show above the feed (search bar, tabs)
  gap?: number;
  refreshing?: boolean;
  onRefresh?: () => void; // pull down to refresh
};

export function MasonryFeed<T>({
  items,
  getHeight,
  keyExtractor,
  renderItem,
  header,
  gap = spacing.md,
  refreshing = false,
  onRefresh,
}: Props<T>) {
  const scroller = useRef<ScrollViewInstance>(null);
  const webPull = useWebPullToRefresh(scroller, onRefresh);

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

  const spinnerHeight = webPull.spinning || refreshing ? 52 : webPull.pull;

  return (
    <View style={{ flex: 1 }}>
      {Platform.OS === 'web' && onRefresh ? (
        <View pointerEvents="none" style={{ height: spinnerHeight, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.accent} size="small" style={{ opacity: webPull.spinning || refreshing ? 1 : Math.min(1, webPull.pull / PULL_TO_REFRESH) }} />
        </View>
      ) : null}
      <ScrollView
        ref={scroller}
        contentContainerStyle={{ paddingHorizontal: spacing.screen, paddingBottom: spacing.xxl }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          // Orange spinner while you pull: tintColor on iPhone, colors on Android
          onRefresh && Platform.OS !== 'web' ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} colors={[colors.accent]} progressBackgroundColor={colors.surface} />
          ) : undefined
        }
      >
        {header}
        <View style={{ flexDirection: 'row', gap }}>
          {column(left)}
          {column(right)}
        </View>
      </ScrollView>
    </View>
  );
}

const PULL_TO_REFRESH = 64; // pixels of pull that trigger a refresh
const MAX_PULL = 90;

// Web only. Pull down while the feed is at the very top: touch drag, mouse drag, or
// trackpad/scroll wheel past the top. Shows an orange spinner, then calls onRefresh.
function useWebPullToRefresh(scroller: React.RefObject<ScrollViewInstance | null>, onRefresh?: () => void) {
  const [pull, setPull] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const refresh = useRef(onRefresh);
  useEffect(() => {
    refresh.current = onRefresh;
  });

  useEffect(() => {
    if (Platform.OS !== 'web' || !refresh.current) return;
    const node = scroller.current?.getScrollableNode() as unknown as HTMLElement | undefined;
    if (!node) return;

    let startY: number | null = null;
    let distance = 0;
    let dragged = false;
    let wheelTotal = 0;
    let wheelGesture = false; // one continuous trackpad/wheel movement
    let wheelStartedAtTop = false;
    let wheelTimer: ReturnType<typeof setTimeout> | undefined;
    let spinTimer: ReturnType<typeof setTimeout> | undefined;

    const show = (d: number) => {
      distance = Math.max(0, Math.min(MAX_PULL, d));
      setPull(distance);
    };
    const finish = () => {
      if (distance >= PULL_TO_REFRESH) {
        setSpinning(true);
        refresh.current?.();
        clearTimeout(spinTimer);
        spinTimer = setTimeout(() => setSpinning(false), 900); // long enough to see it
      }
      show(0);
      startY = null;
    };

    const begin = (y: number) => {
      if (node.scrollTop <= 0) {
        startY = y;
        dragged = false;
      }
    };
    const move = (y: number, e: Event) => {
      if (startY === null) return;
      const dy = y - startY;
      if (dy <= 0 || node.scrollTop > 0) {
        if (distance) show(0);
        return;
      }
      if (dy > 6) dragged = true;
      e.preventDefault(); // stop the page itself from scrolling or bouncing
      show(dy * 0.5);
    };

    // Touch (phones and tablets in a browser)
    const touchStart = (e: TouchEvent) => begin(e.touches[0].clientY);
    const touchMove = (e: TouchEvent) => move(e.touches[0].clientY, e);
    // Mouse drag (laptops)
    const mouseDown = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button === 0) begin(e.clientY);
    };
    const mouseMove = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') move(e.clientY, e);
    };
    const mouseUp = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && startY !== null) finish();
    };
    // A drag shouldn't also open the post under the mouse
    const click = (e: MouseEvent) => {
      if (dragged) {
        e.stopPropagation();
        e.preventDefault();
        dragged = false;
      }
    };
    // Trackpad or scroll wheel: keep scrolling up past the top
    // Only counts if the movement started at the top, so coasting up to the top doesn't refresh by accident
    const wheel = (e: WheelEvent) => {
      if (!wheelGesture) {
        wheelGesture = true;
        wheelStartedAtTop = node.scrollTop <= 0;
      }
      clearTimeout(wheelTimer);
      wheelTimer = setTimeout(() => {
        if (wheelTotal) finish();
        wheelTotal = 0;
        wheelGesture = false;
      }, 180);
      if (!wheelStartedAtTop || node.scrollTop > 0 || e.deltaY >= 0) return;
      wheelTotal += -e.deltaY;
      show(wheelTotal * 0.4);
    };

    node.addEventListener('touchstart', touchStart, { passive: true });
    node.addEventListener('touchmove', touchMove, { passive: false });
    node.addEventListener('touchend', finish);
    node.addEventListener('pointerdown', mouseDown);
    window.addEventListener('pointermove', mouseMove);
    window.addEventListener('pointerup', mouseUp);
    node.addEventListener('click', click, true);
    node.addEventListener('wheel', wheel, { passive: true });
    return () => {
      node.removeEventListener('touchstart', touchStart);
      node.removeEventListener('touchmove', touchMove);
      node.removeEventListener('touchend', finish);
      node.removeEventListener('pointerdown', mouseDown);
      window.removeEventListener('pointermove', mouseMove);
      window.removeEventListener('pointerup', mouseUp);
      node.removeEventListener('click', click, true);
      node.removeEventListener('wheel', wheel);
      clearTimeout(wheelTimer);
      clearTimeout(spinTimer);
    };
  }, [scroller]);

  return { pull, spinning };
}
