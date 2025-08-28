import mongoose from "mongoose";
import { IAddDomainToQueueOptions, TDomain, TManualDomain, TokenTransaction, TxValidationParams } from "../types/types";
import { addDomainToQueue } from "./schedule";
import { schedulePackageCleanup } from "../jobs/schedulePackageCleanup.scheduler";
import { autoCronQueue, packageCleanupQueue } from "../queues/autoCron.queue";
import User from "../models/User";

export const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

export function isValidTokenTransaction(
  tx: TokenTransaction,
  {
    expectedHash,
    expectedTo,
    expectedTokenContract,
    expectedValueInWei,
  }: TxValidationParams
): boolean {
  return (
    tx.hash.toLowerCase() === expectedHash.toLowerCase() &&
    tx.to.toLowerCase() === expectedTo.toLowerCase() &&
    tx.contractAddress.toLowerCase() === expectedTokenContract.toLowerCase() &&
    tx.value === expectedValueInWei
  );
}


const COOKIE_EXPIRY = 15 * 24 * 60 * 60 * 1000;

export const setRefreshCookie = (res: any, token: string) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: COOKIE_EXPIRY,
  });
};

export function isTimestampOlderThan24Hours(timestampInSeconds: number): boolean {
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const oneDayInSeconds = 24 * 60 * 60;
  const differenceInSeconds = currentTimestamp - timestampInSeconds;
  return differenceInSeconds > oneDayInSeconds;
}


export const isValidMongoId = (id: string): boolean => mongoose.Types.ObjectId.isValid(id)


export function calculateExpirationDate(validityInDays: number): Date {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  const totalDurationMs = validityInDays * millisecondsPerDay;
  const now = new Date();

  return new Date(now.getTime() + totalDurationMs);
}

export const addUserDomainsToTaskQueue = async (user: any): Promise<boolean> => {
  try {
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
        intervalInMs: subscription.intervalInMs,
        expires: new Date(user.packageExpiresAt),
      }
      // first remove if already exists
      await removeDomainFromQueue({ userId, domainUrl: domain.url, type: "default" });

      await addDomainToQueue(dataToInsert)
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
        intervalInMs: domain.executeInMs,
        expires: new Date(user.packageExpiresAt),
      }

      // first remove if already exists
      await removeDomainFromQueue({ userId, domainUrl: domain.url, type: "manual" })

      // add domain.
      await addDomainToQueue(dataToInsert)
    }

    return true;
  } catch (error) {
    console.log("Error adding domains to the task queue ", error)
    return false;
  }
}

export async function removeDomainFromQueue({
  userId,
  domainUrl,
  type,
}: {
  userId: string;
  domainUrl: string;
  type: "default" | "manual";
}): Promise<boolean> {
  try {
    const schedulers = await autoCronQueue.getJobSchedulers();

    // Find the exact scheduler that matches this user + domain
    const targetScheduler = schedulers.find(
      (scheduler) =>
        scheduler?.name === "auto-execute" &&
        scheduler?.template?.data?.userId?.toString() === userId.toString() &&
        scheduler?.template?.data?.domain?.url === domainUrl &&
        scheduler?.template?.data?.type === type
    );

    if (!targetScheduler) {
      console.warn(
        `[removeDomainFromQueue] No repeatable job found for user=${userId}, domain=${domainUrl}, type=${type}`
      );
      return false;
    }
    await autoCronQueue.removeJobScheduler(targetScheduler.key);

    console.log(
      `[removeDomainFromQueue] Removed repeatable job for user=${userId}, domain=${domainUrl}, type=${type}`
    );
    return true;
  } catch (error) {
    console.error(
      `[removeDomainFromQueue] Failed to remove job for ${domainUrl}`,
      error
    );
    return false;
  }
}


export async function updateDomainInQueue(options: IAddDomainToQueueOptions): Promise<boolean> {
  const { userId, domain, type } = options;

  // 1. Remove existing job
  await removeDomainFromQueue({ userId, domainUrl: domain.url, type });

  // 2. Add new job with updated settings
  return await addDomainToQueue(options);
}


export const cleanAllPreviousTaskFromQueue = async (userId: string): Promise<boolean> => {
  try {
    const jobSchedulers = await autoCronQueue.getJobSchedulers();

    for (const repeatJob of jobSchedulers) {
      const jobUserId = repeatJob.template?.data?.userId;
      if (jobUserId === userId.toString()) {
        await autoCronQueue.removeJobScheduler(repeatJob.key);
      }
    }

    // Remove cleanup job from packageCleanupQueue
    const cleanupJobId = `cleanup-${userId.toString()}`;
    const cleanupJob = await packageCleanupQueue.getJob(cleanupJobId);
    if (cleanupJob) {
      await cleanupJob.remove();
    }
    return true;
  } catch (error) {
    console.error(`[cleanPreviousTaskFromQueue] Failed for user: ${userId}`, error);
    return false;
  }
};


export const updateJobsForPackageUsers = async (packageId: string) => {

  console.log(packageId, ' packageid')
  try {
    const oneMinuteFromNow = new Date(Date.now() + 60 * 1000)
    const users = await User.find({
      packageExpiresAt: { $gte: oneMinuteFromNow },
      status: 'enabled',
      role: 'user',
      subscription: packageId,
    })
      .select('subscription defaultDomains manualDomains status packageExpiresAt')
      .populate({
        path: 'subscription',
        model: 'Package',
        select: 'intervalInMs status'
      })
      .lean();

    if (!users.length) {
      console.log(`[${new Date().toISOString()}] No eligible users to update.`);
      return;
    }

    for (const user of users) {
      console.log(user,  ' user from updatePakcaege');
      const added = await addUserDomainsToTaskQueue(user);
      if (!added) {
        console.log("Error occured adding domain to task queue")
      }
    }
  } catch (err) {
    console.error("Error removing jobs for package users:", err);
  }
};


export const removeJobsForPackageUsers = async (packageId: string) => {
  const twentySecondsFromNow = new Date(Date.now() + 20 * 1000)
  const users = await User.find({
    packageExpiresAt: { $gte: twentySecondsFromNow },
    status: 'enabled',
    role: 'user',
    subscription: packageId,
  }).lean()

  if (!users.length) {
    console.log(`[${new Date().toISOString()}] No eligible users to remove.`);
    return;
  }

  for (const user of users) {
    const { _id } = user;
    const defaultDomains = user.defaultDomains?.filter((d: TDomain) => d.status === 'enabled') || [];
    const manualDomains = user.manualDomains?.filter((d: TManualDomain) => d.status === 'enabled') || [];
    const userId = _id as string;

    // add queue for default domains
    for (const domain of defaultDomains) {
      await removeDomainFromQueue({ type: "default", userId, domainUrl: domain.url })
    }

    // Manual domains use domain-specific interval
    for (const domain of manualDomains) {

      // skip for disabled domain
      if (domain.status !== "enabled") continue;
      await removeDomainFromQueue({ userId, domainUrl: domain.url, type: "manual" })
    }
  }
}