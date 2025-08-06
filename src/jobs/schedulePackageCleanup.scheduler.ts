import { Queue } from 'bullmq';
import { packageCleanupQueue } from '../queues/autoCron.queue';

export async function schedulePackageCleanup(userId: string, packageExpiresAt: Date) {
  const jobId = `cleanup-${userId}`;

  await packageCleanupQueue.add(
    'remove-user-repeatables',
    { userId },
    {
      jobId,
      delay: packageExpiresAt.getTime() - Date.now(), // delay until expiry
      removeOnComplete: true,
      removeOnFail: true,
    }
  );
}
