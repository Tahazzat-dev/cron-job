// utils/queueUtils.ts

import { autoCronQueue } from '../queues/autoCron.queue';
import { IAddDomainToQueueOptions } from '../types/types';



export async function addDomainToQueue({
    userId,
    domain,
    type,
    intervalInMs,
    expires
}: IAddDomainToQueueOptions): Promise<boolean> {
    try {
        const jobId = `auto-${type}-${userId}-${domain.url}`;
        const repeatInterval = intervalInMs ? intervalInMs : 10 * 60 * 1000;
        await autoCronQueue.add(
            'auto-execute',
            { userId, domain, type },
            {
                jobId,
                removeOnComplete: true,
                removeOnFail: true,
                repeat: {
                    every: repeatInterval,
                    endDate:expires
                },
            }
        );

        return true;
    } catch (error) {
        console.error(`[addDomainToQueue] Failed to add job for ${domain.url}`, error);
        return false;
    }
}

