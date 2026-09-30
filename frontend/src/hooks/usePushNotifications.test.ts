import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

describe('usePushNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('detects push support', () => {
    const { result } = renderHook(() => usePushNotifications());
    
    expect(result.current.isSupported).toBe(true);
  });

  it('returns correct initial permission', () => {
    const { result } = renderHook(() => usePushNotifications());
    
    expect(result.current.permission).toBe('default');
  });

  it('returns no subscription initially', () => {
    const { result } = renderHook(() => usePushNotifications());
    
    expect(result.current.subscription).toBeNull();
  });
});