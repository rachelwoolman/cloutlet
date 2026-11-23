// Web only: lets a mouse click-and-drag (and the up/down arrow keys) move
// between full-screen posts, the way a finger swipe does on a phone.
// Browsers don't scroll on mouse drag by themselves. Does nothing on iOS/Android.
import { RefObject, useEffect, useRef } from 'react';
import { FlatList, Platform } from 'react-native';

const DRAG_TO_FLIP = 0.12; // drag this share of the screen to go to the next post

export function useMouseSwipe<T>(list: RefObject<FlatList<T> | null>, height: number, index: number, count: number) {
  const current = useRef(index);
  useEffect(() => {
    current.current = index;
  }, [index]);

  useEffect(() => {
    if (Platform.OS !== 'web' || !height || !count) return;
    const node = list.current?.getScrollableNode() as HTMLElement | undefined;
    if (!node) return;

    const go = (i: number) => {
      const to = Math.max(0, Math.min(count - 1, i));
      list.current?.scrollToIndex({ index: to, animated: true });
    };

    let startY = 0;
    let startTop = 0;
    let dragging = false;
    let moved = false;

    const down = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      dragging = true;
      moved = false;
      startY = e.clientY;
      startTop = node.scrollTop;
      e.preventDefault(); // no text selection while dragging
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      const dy = e.clientY - startY;
      if (!moved && Math.abs(dy) < 6) return;
      if (!moved) {
        moved = true;
        node.style.scrollSnapType = 'none'; // follow the mouse smoothly while dragging
        node.style.cursor = 'grabbing';
      }
      node.scrollTop = startTop - dy;
    };
    const up = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      if (!moved) return;
      node.style.cursor = '';
      const dy = e.clientY - startY;
      const from = Math.round(startTop / height);
      const target = dy < -height * DRAG_TO_FLIP ? from + 1 : dy > height * DRAG_TO_FLIP ? from - 1 : from;
      go(target);
      // Put snapping back once the animation has settled
      setTimeout(() => (node.style.scrollSnapType = ''), 450);
    };
    // A drag shouldn't also count as a tap on whatever was under the mouse
    const click = (e: MouseEvent) => {
      if (moved) {
        e.stopPropagation();
        e.preventDefault();
        moved = false;
      }
    };
    // Stop the browser's own "drag this image" behaviour, which would cut the swipe short
    const noNativeDrag = (e: DragEvent) => e.preventDefault();
    const key = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'PageDown') go(current.current + 1);
      else if (e.key === 'ArrowUp' || e.key === 'PageUp') go(current.current - 1);
      else return;
      e.preventDefault();
    };

    node.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    node.addEventListener('click', click, true);
    node.addEventListener('dragstart', noNativeDrag);
    window.addEventListener('keydown', key);
    return () => {
      node.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      node.removeEventListener('click', click, true);
      node.removeEventListener('dragstart', noNativeDrag);
      window.removeEventListener('keydown', key);
    };
  }, [list, height, count]);
}
