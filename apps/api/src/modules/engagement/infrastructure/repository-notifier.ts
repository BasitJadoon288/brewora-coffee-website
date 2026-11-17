import { Notifier } from '../../../shared/application/ports';
import { logger } from '../../../shared/infrastructure/logger';
import { NewNotification, NotificationRepository } from '../domain/engagement';
/** Notifier port backed by the notifications collection. Failures are logged, never thrown. */
export class RepositoryNotifier implements Notifier {
  constructor(private repo: NotificationRepository) {}
  private async safe(n: NewNotification) { try { await this.repo.create(n); } catch (err) { logger.error({ err }, 'notification failed'); } }
  toAdmins(n: { title: string; message?: string; type?: string; link?: string }) { return this.safe({ audience: 'Admin', ...n }); }
  toUser(userId: string, n: { title: string; message?: string; type?: string; link?: string }) { return this.safe({ audience: 'User', userId, ...n }); }
}
