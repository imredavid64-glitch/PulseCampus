'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsSupported('serviceWorker' in navigator && 'PushManager' in window);
      setPermission(Notification.permission);
    }
  }, []);

  const subscribe = useCallback(async () => {
    if (!isSupported) {
      setError('Push notifications not supported in this browser');
      return false;
    }

    if (permission === 'denied') {
      setError('Push notifications are blocked. Please enable them in browser settings.');
      return false;
    }

    setIsSubscribing(true);
    setError(null);

    try {
      // Request permission
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== 'granted') {
        setError('Permission denied for push notifications');
        return false;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Get VAPID public key from backend
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const vapidResponse = await fetch(`${apiUrl}/api/push/vapid-public-key`);
      const { publicKey } = await vapidResponse.json();

      // Convert VAPID key to Uint8Array
      const applicationServerKey = urlBase64ToUint8Array(publicKey) as unknown as BufferSource;

      // Subscribe to push
      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      const subscriptionJson = pushSubscription.toJSON();
      const subscriptionData: PushSubscription = {
        endpoint: subscriptionJson.endpoint!,
        keys: {
          p256dh: subscriptionJson.keys!.p256dh!,
          auth: subscriptionJson.keys!.auth!,
        },
      };

      // Send subscription to backend
      const subscribeResponse = await fetch(`${apiUrl}/api/push/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: subscriptionData,
          user_agent: navigator.userAgent,
        }),
      });

      if (!subscribeResponse.ok) {
        throw new Error('Failed to save subscription');
      }

      setSubscription(subscriptionData);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to subscribe');
      return false;
    } finally {
      setIsSubscribing(false);
    }
  }, [isSupported, permission]);

  const unsubscribe = useCallback(async () => {
    if (!subscription) return;

    setIsSubscribing(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      await fetch(`${apiUrl}/api/push/subscribe?endpoint=${encodeURIComponent(subscription.endpoint)}`, {
        method: 'DELETE',
      });
      setSubscription(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unsubscribe');
    } finally {
      setIsSubscribing(false);
    }
  }, [subscription]);

  return {
    isSupported,
    permission,
    subscription,
    isSubscribing,
    error,
    subscribe,
    unsubscribe,
  };
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}