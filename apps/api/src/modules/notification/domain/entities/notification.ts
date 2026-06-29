import { randomUUID } from 'node:crypto';
import { NotificationType } from '@prisma/client';

export interface NotificationProps {
  id: string;
  userId: string;
  tenantId: string | null;
  type: NotificationType;
  title: string;
  body: string;
  linkUrl: string | null;
  readAt: Date | null;
  createdAt: Date;
}

export interface NotificationDraft {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  linkUrl: string | null;
}

export class Notification {
  private constructor(private readonly props: NotificationProps) {}

  static create(draft: NotificationDraft): Notification {
    return new Notification({
      id: randomUUID(),
      userId: draft.userId,
      tenantId: null,
      type: draft.type,
      title: draft.title,
      body: draft.body,
      linkUrl: draft.linkUrl,
      readAt: null,
      createdAt: new Date(),
    });
  }

  static reconstitute(props: NotificationProps): Notification {
    return new Notification(props);
  }

  isRead(): boolean {
    return this.props.readAt !== null;
  }

  getId(): string {
    return this.props.id;
  }

  getUserId(): string {
    return this.props.userId;
  }

  getTenantId(): string | null {
    return this.props.tenantId;
  }

  getType(): NotificationType {
    return this.props.type;
  }

  getTitle(): string {
    return this.props.title;
  }

  getBody(): string {
    return this.props.body;
  }

  getLinkUrl(): string | null {
    return this.props.linkUrl;
  }

  getReadAt(): Date | null {
    return this.props.readAt;
  }

  getCreatedAt(): Date {
    return this.props.createdAt;
  }
}
