const STORAGE_KEY = 'user';
const SYNC_EVENT = 'zync:user-updated';
const BROADCAST_CHANNEL = 'zync:auth';

let _broadcastChannel: BroadcastChannel | null = null;

function getBroadcastChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === 'undefined') return null;
  if (!_broadcastChannel) {
    try {
      _broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL);
    } catch {
      return null;
    }
  }
  return _broadcastChannel;
}

export function getUserFromStorage(): any {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

export function updateUserInStorage(userData: any): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: userData }));
    const bc = getBroadcastChannel();
    if (bc) {
      bc.postMessage({ type: SYNC_EVENT, payload: userData });
    }
  } catch (e) {
    console.error('Failed to sync user to storage:', e);
  }
}

export function mergeUserToStorage(userData: any): any {
  const existing = getUserFromStorage();
  const merged = { ...existing, ...userData };
  updateUserInStorage(merged);
  return merged;
}

export function removeUserFromStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: null }));
    const bc = getBroadcastChannel();
    if (bc) {
      bc.postMessage({ type: SYNC_EVENT, payload: null });
    }
  } catch (e) {
    console.error('Failed to remove user from storage:', e);
  }
}

export function listenForUserChanges(callback: (userData: any) => void): () => void {
  const handleCustom = (e: Event) => {
    const detail = (e as CustomEvent).detail;
    callback(detail);
  };

  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      try {
        callback(e.newValue ? JSON.parse(e.newValue) : null);
      } catch {
        callback(null);
      }
    }
  };

  const handleBroadcast = (e: MessageEvent) => {
    if (e.data?.type === SYNC_EVENT) {
      callback(e.data.payload);
    }
  };

  window.addEventListener(SYNC_EVENT, handleCustom);
  window.addEventListener('storage', handleStorage);

  const bc = getBroadcastChannel();
  if (bc) {
    bc.addEventListener('message', handleBroadcast);
  }

  return () => {
    window.removeEventListener(SYNC_EVENT, handleCustom);
    window.removeEventListener('storage', handleStorage);
    if (bc) {
      bc.removeEventListener('message', handleBroadcast);
    }
  };
}

export function getStoredEmail(): string {
  return getUserFromStorage().email || '';
}
