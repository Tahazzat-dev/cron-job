import User from '../models/User';
import { autoCronQueue, packageCleanupQueue } from '../queues/autoCron.queue';
import { IAddDomainToQueueOptions, TDomain, TManualDomain } from '../types/types';
import { addDomainToQueue } from '../utils/schedule';
import { addUserDomainsToTaskQueue } from '../utils/utilityFN';
import { schedulePackageCleanup } from './schedulePackageCleanup.scheduler';

export async function initializeAutoScheduler() {
  await clearAllRepeatableJobs()
  // add the users domain fresh starts
  try {
    const oneMinuteFromNow = new Date(Date.now() + 60 * 1000)
    const users = await User.find({
      packageExpiresAt: { $gte: oneMinuteFromNow },
      status: 'enabled',
      role: 'user',
    })
      .select('subscription defaultDomains manualDomains status packageExpiresAt')
      .populate({
        path: 'subscription',
        model: 'Package',
        select: 'intervalInMs status'
      })
      .lean();

    if (!users.length) {
      console.log(`[${new Date().toISOString()}] No eligible users for auto-cron.`);
      return;
    }

    for (const user of users) {
      console.log(user, ' user from initial schedular')
      const added = await addUserDomainsToTaskQueue(user);
      if (!added) {
        console.log("Error occured adding domain to task queue")
      }
    }

    // console.log(`[${new Date().toISOString()}] Scheduled domains for ${users.length} user(s).`);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Error in scheduleAutoCrons:`, err);
  }
}


export async function clearAllRepeatableJobs() {
  const schedulers = await autoCronQueue.getJobSchedulers();
  for (const scheduler of schedulers) {
    console.log(scheduler, ' schedular job key')
    if (scheduler?.key) {
      await autoCronQueue.removeJobScheduler(scheduler?.key);
    } else {
      // console.warn(`[Cleanup] Skipping invalid scheduler:`, scheduler);
    }
  }
  console.log(`[${new Date().toISOString()}] Cleared all repeatable jobs from autoCronQueue`);

  // clean all job clean up tasks
  const cleanupJobs = await packageCleanupQueue.getJobs(['delayed', 'waiting']);
  for (const job of cleanupJobs) {
    await job.remove();
  }
  console.log(`[${new Date().toISOString()}] Cleared ${cleanupJobs.length} delayed cleanup jobs from packageCleanupQueue`);
}