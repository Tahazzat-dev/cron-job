import User from '../models/User';
import { autoCronQueue } from '../queues/autoCron.queue';
import { IAddDomainToQueueOptions, TDomain, TManualDomain } from '../types/types';
import { addDomainToQueue } from '../utils/schedule';

export async function initializeAutoScheduler() {
  await clearAllRepeatableJobs()
  return;

  // add the users domain fresh starts
  try {
    const oneMinuteFromNow = new Date(Date.now() + 60 * 1000)
    const users = await User.find({
      packageExpiresAt: { $gte: oneMinuteFromNow },
      status: 'enabled',
      role: 'user',
    })
      .select('subscription defaultDomains manualDomains status')
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
      const { _id, subscription } = user;
      const defaultDomains = user.defaultDomains?.filter((d: TDomain) => d.status === 'enabled') || [];
      const manualDomains = user.manualDomains?.filter((d: TManualDomain) => d.status === 'enabled') || [];
      const userId = _id as string;
      // add queue for default domains
      for (const domain of defaultDomains) {

        // skip for disabled domain
        if (domain.status !== "enabled") continue;

        const dataToInsert: IAddDomainToQueueOptions = {
          userId,
          domain: {
            url: domain.url,
            _id: domain._id,
            status: domain.status
          },
          type: "default",
          intervalInMs: subscription.intervalInMs
        }


        await addDomainToQueue(dataToInsert)
        // const jobId = `auto-default-${userId}-${domain.url}`;
        // await autoCronQueue.add(
        //   'auto-execute',
        //   { userId, domain, type: "default" },
        //   {
        //     jobId,
        //     removeOnComplete: true,
        //     removeOnFail: true,
        //     repeat: {
        //       every: subscription.intervalInMs,
        //     },
        //   }
        // );
      }

      // Manual domains use domain-specific interval
      for (const domain of manualDomains) {

        // skip for disabled domain
        if (domain.status !== "enabled") continue;


        const dataToInsert: IAddDomainToQueueOptions = {
          userId,
          domain: {
            url: domain.url,
            _id: domain._id,
            status: domain.status
          },
          type: "manual",
          intervalInMs: domain.intervalInMs
        }


        await addDomainToQueue(dataToInsert)

        // const jobId = `auto-manual-${userId}-${domain.url}`;

        // await autoCronQueue.add(
        //   'auto-execute',
        //   { userId, domain, type: "manual" },
        //   {
        //     jobId,
        //     removeOnComplete: true,
        //     removeOnFail: true,
        //     repeat: {
        //       every: domain.executeInMs || 10 * 60 * 1000, // fallback 10 mins
        //     },
        //   }
        // );
      }
    }

    console.log(`[${new Date().toISOString()}] Scheduled domains for ${users.length} user(s).`);
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
}