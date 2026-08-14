import * as React from 'react';
import {
  loadGoogleIdentityScript,
  getGoogleAccountsId,
  GoogleCredentialResponse,
} from './google-identity';

interface GoogleSignInButtonProps {
  clientId: string;
  onCredential: (idToken: string) => void;
  text?: 'signin_with' | 'signup_with' | 'continue_with';
  disabled?: boolean;
}

export function GoogleSignInButton({
  clientId,
  onCredential,
  text = 'signin_with',
  disabled = false,
}: Readonly<GoogleSignInButtonProps>) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [ready, setReady] = React.useState(false);
  const onCredentialRef = React.useRef(onCredential);
  onCredentialRef.current = onCredential;

  React.useEffect(() => {
    if (!clientId) {
      return;
    }
    let cancelled = false;

    loadGoogleIdentityScript()
      .then(() => {
        if (cancelled) {
          return;
        }
        const accountsId = getGoogleAccountsId();
        const container = containerRef.current;
        if (!accountsId || !container) {
          return;
        }

        accountsId.initialize({
          client_id: clientId,
          callback: (response: GoogleCredentialResponse) => {
            onCredentialRef.current(response.credential);
          },
        });

        container.innerHTML = '';
        accountsId.renderButton(container, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text,
          shape: 'rectangular',
          width: container.getBoundingClientRect().width || 336,
        });
        setReady(true);
      })
      .catch(() => {
        setReady(false);
      });

    return () => {
      cancelled = true;
    };
  }, [clientId, text]);

  if (!clientId) {
    return null;
  }

  return (
    <div className={disabled ? 'pointer-events-none opacity-60' : ''}>
      {!ready && (
        <div className="h-10 w-full rounded-(--radius-sm) border border-(--color-border) bg-(--color-badge-bg) animate-pulse" />
      )}
      <div ref={containerRef} className={ready ? 'flex w-full justify-center' : 'hidden'} />
    </div>
  );
}
