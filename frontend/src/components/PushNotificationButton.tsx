'use client';

import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Bell, BellOff, Loader2, CheckCircle } from 'lucide-react';
import { schoolConfig } from '@/lib/school-config';

export default function PushNotificationButton() {
  const { isSupported, permission, subscription, isSubscribing, error, subscribe, unsubscribe } = usePushNotifications();

  if (!isSupported) {
    return null;
  }

  const isSubscribed = !!subscription;

  const handleClick = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isSubscribing}
      className="p-2 rounded-lg transition-all flex items-center justify-center"
      style={{
        backgroundColor: isSubscribed ? schoolConfig.primaryColor : 'transparent',
        color: isSubscribed ? 'white' : 'gray',
      }}
      aria-label={isSubscribed ? 'Disable push notifications' : 'Enable push notifications'}
      title={isSubscribed ? 'Push notifications enabled' : 'Enable push notifications'}
    >
      {isSubscribing ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : isSubscribed ? (
        <Bell className="w-5 h-5" />
      ) : (
        <BellOff className="w-5 h-5" />
      )}
    </button>
  );
}