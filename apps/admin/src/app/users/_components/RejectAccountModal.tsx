'use client';

import * as React from 'react';
import { Button, Modal, Textarea } from '@elevatesde/ui';

const MAX_REASON_LENGTH = 500;

interface RejectAccountModalProps {
  email: string | null;
  submitting: boolean;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}

export function RejectAccountModal({
  email,
  submitting,
  onConfirm,
  onClose,
}: Readonly<RejectAccountModalProps>) {
  const [reason, setReason] = React.useState('');

  React.useEffect(() => {
    if (email) {
      setReason('');
    }
  }, [email]);

  return (
    <Modal
      open={email !== null}
      onClose={onClose}
      title="Deny registration"
      description={email ? `${email} will not be able to sign in.` : undefined}
    >
      <form
        className="flex flex-col gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          onConfirm(reason);
        }}
      >
        <Textarea
          label="Reason (optional, internal only)"
          value={reason}
          maxLength={MAX_REASON_LENGTH}
          onChange={(event) => setReason(event.target.value)}
          placeholder="e.g. Duplicate account, spam sign-up"
        />
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="danger" disabled={submitting}>
            {submitting ? 'Denying…' : 'Deny registration'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
