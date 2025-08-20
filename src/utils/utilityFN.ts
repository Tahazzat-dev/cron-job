import mongoose from "mongoose";
import { IAddDomainToQueueOptions, TDomain, TManualDomain, TokenTransaction, TxValidationParams } from "../types/types";
import { addDomainToQueue } from "./schedule";
import { schedulePackageCleanup } from "../jobs/schedulePackageCleanup.scheduler";
import { autoCronQueue, packageCleanupQueue } from "../queues/autoCron.queue";

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
        intervalInMs: domain.intervalInMs,
        expires: new Date(user.packageExpiresAt),
      }

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
  const success = await addDomainToQueue(options);

  return success;
}

// await updateDomainInQueue({
//   userId: "123",
//   domain: { url: "example.com/cron", _id: "abc", status: "enabled" },
//   type: "manual",
//   intervalInMs: 5 * 60 * 1000, // new interval
// });



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


/*
 Example use
 const transactions: TokenTransaction[] = [/* paste JSON array here ];

const expectedParams: TxValidationParams = {
  expectedHash: "0xa2b64119d7301acce0c70c1e367d16f79a20b7d4297be1026b014e41a51c9384",
  expectedTo: "0x53f78a071d04224b8e254e243fffc6d9f2f3fa23",
  expectedFrom: "0x9399f9bc69f92e025a99d2a794e4db0c42b56751",
  expectedTokenContract: "0x55d398326f99059ff775485246999027b3197955",
  expectedValueInWei: "10000000000000000000", // 10 USDT
};

const match = transactions.find((tx) =>
  isValidTokenTransaction(tx, expectedParams)
);

if (match) {
  console.log("✅ Payment confirmed:", match.hash);
} else {
  console.log("❌ No matching valid transaction found.");
}


*/