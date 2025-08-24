import getRedisInstance from '../config/redis';
import User from '../models/User';
import { autoCronQueue, packageCleanupQueue } from '../queues/autoCron.queue';
import { IAddDomainToQueueOptions, TManualDomain } from '../types/types';
import { addDomainToQueue } from '../utils/schedule';
import { addUserDomainsToTaskQueue } from '../utils/utilityFN';
const redis = getRedisInstance();

export async function initializeAutoScheduler() {
  await clearAllRepeatableJobs()
  await clearAllRedisLogs()

  // load admins manual domains
  try {
    const admins = await User.find({
      status: 'enabled',
      role: 'admin',
    })
      .select('manualDomains').lean();
    if (!admins) {
      console.log(`[${new Date().toISOString()}] No eligible admins for autocron.`);
      return;
    }

    for (const user of admins) {
      const adminManualDomains = user.manualDomains?.filter((d: TManualDomain) => d.status === 'enabled') || [];
      // Manual domains use domain-specific interval
      for (const domain of adminManualDomains) {
        // skip for disabled domain 
        if (domain.status !== "enabled") continue;

        const dataToInsert: IAddDomainToQueueOptions = {
          userId: user._id as string,
          domain: {
            url: domain?.url,
            _id: domain?._id,
            status: domain?.status
          },
          type: "manual",
          intervalInMs: domain?.executeInMs
        }

        console.log(dataToInsert, ' data to insert from initilizer')
        await addDomainToQueue(dataToInsert)
      }
    }
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Error in scheduleAutoCrons:`, err);
  }

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
    if (scheduler?.key) {
      await autoCronQueue.removeJobScheduler(scheduler?.key);
    } else {
      console.warn(`[Cleanup] Skipping invalid scheduler:`, scheduler);
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

export async function clearAllRedisLogs() {
  const keys = await redis.keys('cronlogs:*');

  for (const key of keys) {
    await redis.del(key);
  }
}