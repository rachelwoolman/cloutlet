// Old link: offers are now made inside the chat (offer sheet), so this just opens the chat
// with that creator and the offer sheet up.
import { useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Loading } from '../../components';
import { useProfile } from '../../data/hooks';
import { useMe } from '../../data/session';
import { requestCollab } from '../../lib/openChat';

export default function RequestCollabRedirect() {
  const me = useMe();
  const { id } = useLocalSearchParams<{ id: string }>();
  const creator = useProfile(id);
  const c = creator.data;
  useEffect(() => {
    if (!c) return;
    if (router.canGoBack()) router.back();
    requestCollab(me, c);
  }, [c, me]);
  return <Loading />;
}
