import getRedisInstance from '../config/redis';
import User from '../models/User';
import { autoCronQueue } from '../queues/autoCron.queue';
import { TDomain, TManualDomain } from '../types/types';

const redis = getRedisInstance();

export async function initializeAutoScheduler() {
  // clear previous job or caching.
  await clearAllRepeatableJobs() 

  // add the users domain fresh starts
  try {
    const oneMinuteFromNow = new Date(Date.now() + 60 * 1000)


    const users = await User.find({
      packageExpiresAt: { $gte: oneMinuteFromNow },
      status: 'enabled',
      role: 'user',
      $or: [
        { defaultDomains: { $elemMatch: { status: 'enabled' } } },
        { manualDomains: { $elemMatch: { status: 'enabled' } } }
      ]
    })
      .select('subscription defaultDomains manualDomains')
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
      const { _id: userId, subscription } = user;
      const defaultDomains = user.defaultDomains?.filter((d: TDomain) => d.status === 'enabled') || [];
      const manualDomains = user.manualDomains?.filter((d: TManualDomain) => d.status === 'enabled') || [];

      // add queue for default domains
      for (const domain of defaultDomains) {
        const jobId = `auto-default-${userId}-${domain.url}`;

        await autoCronQueue.add(
          'auto-execute',
          { userId, domain ,type:"default"},
          {
            jobId,
            removeOnComplete: true,
            removeOnFail: true,
            repeat: {
              every: subscription.intervalInMs,
            },
          }
        );
      }

        // Manual domains use domain-specific interval
        for (const domain of manualDomains) {
          const jobId = `auto-manual-${userId}-${domain.url}`;

          await autoCronQueue.add(
            'auto-execute',
            { userId, domain, type:"manual" },
            {
              jobId,
              removeOnComplete: true,
              removeOnFail: true,
              repeat: {
                every: domain.executeInMs || 10 * 60 * 1000, // fallback 10 mins
              },
            }
          );
        }


    }

    console.log(`[${new Date().toISOString()}] Scheduled domains for ${users.length} user(s).`);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Error in scheduleAutoCrons:`, err);
  }
}



// TODO: have to change the deprecated version.
export async function clearAllRepeatableJobs() {
  const repeatableJobs = await autoCronQueue.getRepeatableJobs();

  for (const job of repeatableJobs) {
    await autoCronQueue.removeRepeatableByKey(job.key);
  }

  console.log(`[${new Date().toISOString()}] Cleared all repeatable jobs from autoCronQueue`);
}


// export async function clearAllRepeatableJobs() {
//     const jobSchedulers = await autoCronQueue.getJobSchedulers();

//   for (const scheduler of jobSchedulers) {
//    await autoCronQueue.removeJobScheduler(scheduler.id);
//   }

//   console.log(`[${new Date().toISOString()}] Cleared all repeatable jobs from autoCronQueue`);
// }