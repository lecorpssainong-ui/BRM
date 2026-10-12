type AuthModalCallback = () => void | Promise<void>;

interface OpenAuthModalOptions {
  reason?: string;
  onSuccess?: AuthModalCallback;
  defaultMode?: 'login' | 'register';
}

let pendingSuccessCallback: AuthModalCallback | null = null;

export function openAuthModal(options?: OpenAuthModalOptions) {
  if (options?.onSuccess) {
    pendingSuccessCallback = options.onSuccess;
  } else {
    pendingSuccessCallback = null;
  }

  const evt = new CustomEvent('brm-open-auth-modal', {
    detail: {
      reason: options?.reason || 'Pour gérer vos rendez-vous, réservations et factures, veuillez indiquer votre identité.',
      defaultMode: options?.defaultMode || 'login',
    },
  });
  window.dispatchEvent(evt);
}

export function triggerAuthSuccessCallback() {
  if (pendingSuccessCallback) {
    try {
      pendingSuccessCallback();
    } catch (e) {
      console.error('Error executing auth callback:', e);
    }
    pendingSuccessCallback = null;
  }
}
