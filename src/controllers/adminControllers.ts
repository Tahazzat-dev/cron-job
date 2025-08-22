import mongoose from "mongoose";
import CronLog from "../models/CronLog";
import User from "../models/User";
import { IAddDomainToQueueOptions, IDomain, IManualDomain, TDomain, TManualDomain } from "../types/types";
import Package from "../models/Package";
import { addUserDomainsToTaskQueue, calculateExpirationDate, cleanAllPreviousTaskFromQueue, isValidMongoId, removeDomainFromQueue } from "../utils/utilityFN";
import { sanitizeDomain } from "../utils/sanitize";
import { addDomainToQueue } from "../utils/schedule";

export const getUsersDetailsController = async (req: any, res: any) => {
    try {
        const {
            name,
            email,
            status,
            domain,
            subscription,
            page = 1,
            limit = 10,
        } = req.query;

        const filters: any = {
            role: 'user', // Only regular users
        };

        if (name) {
            filters.name = { $regex: name, $options: 'i' };
        }

        if (email) {
            filters.email = { $regex: email, $options: 'i' };
        }

        if (status) {
            filters.status = status;
        }

        if (domain) {
            filters.domain = { $regex: domain, $options: 'i' };
        }

        if (subscription) {
            filters.subscription = subscription;
        }

        const users = await User.find(filters)
            .populate('subscription', 'name')
            .sort({ createdAt: -1 })
            .skip((+page - 1) * +limit)
            .limit(+limit)
            .lean();

        const total = await User.countDocuments(filters);

        return res.json({
            users,
            total,
            page: +page,
            totalPages: Math.ceil(total / +limit),
        });
    } catch (err) {
        console.error('Error fetching users:', err);
        return res.status(500).json({ message: 'Server error' });
    }
};


export const updateUserController = async (req: any, res: any) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user || user.role !== 'user') {
            return res.status(404).json({ message: 'User not found' });
        }

        const {
            name,
            email,
            password,
            mobile,
            status,
            allowedToAddManualDomains,
            defaultDomains,
            manualDomains,
            domain,
        } = req.body;

        if (name) user.name = name;
        if (email) user.email = email;
        if (password) user.password = password;
        if (mobile) user.mobile = mobile;
        if (domain) user.domain = domain;

        const validStatuses = ['enabled', 'disabled', 'deleted', 'blocked']

        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({
                error: true,
                message: `Invalid status. Status should be : "enabled", "disabled", "deleted", "blocked".`,
            });
        }

        if (status) {
            user.status = status;
        }

        if (allowedToAddManualDomains !== undefined) {
            user.allowedToAddManualDomains = allowedToAddManualDomains;
        }

        // Update only the status of existing default domains
        if (Array.isArray(defaultDomains)) {
            for (const updatedDomain of defaultDomains) {
                const domain = user.defaultDomains.find(
                    (d: IDomain) => String(d._id) === String(updatedDomain._id)
                );
                if (domain && updatedDomain.status) {
                    domain.status = updatedDomain.status;
                }
                if (domain && updatedDomain.url) {
                    domain.url = updatedDomain.url;
                }
            }
        }

        // Update only the status of existing manual domains
        if (Array.isArray(manualDomains)) {
            for (const updatedDomain of manualDomains) {
                const domain = user.manualDomains?.find(
                    (d: IManualDomain) => String(d._id) === String(updatedDomain._id)
                );
                if (domain && updatedDomain.status) {
                    domain.status = updatedDomain.status;
                }
            }
        }

        await user.save();


        if (status || defaultDomains || manualDomains) {

            await cleanAllPreviousTaskFromQueue(user._id);
            const oneMinuteFromNow = new Date(Date.now() + 60 * 1000);

            const updatedUser = await User.findOne({
                _id: user._id,
                packageExpiresAt: { $gte: oneMinuteFromNow },
                status: 'enabled'
            })
                .select('subscription defaultDomains manualDomains status packageExpiresAt')
                .populate({
                    path: 'subscription',
                    model: 'Package',
                    select: 'intervalInMs status',
                })
                .lean();


            if (!updatedUser) {
                return res.json({ message: 'User updated successfully', user });
            }

            const isAdded = await addUserDomainsToTaskQueue(updatedUser);

            if (!isAdded) {
                return res.status(200).json({ success: true, message: 'User updated successfully but could not added to the queue.', data: user });
            } else {
                return res.json({ message: 'User updated successfully', user });
            }
        }


    } catch (err) {
        console.error('Error updating user:', err);
        return res.status(500).json({ message: 'Server error' });
    }
};


export const getSingleUserController = async (req: any, res: any) => {
    try {
        const userId = req.params.id;

        const user = await User.findOne({ _id: userId, role: 'user' })
            .select('-password') // exclude password
            .populate('subscription'); // optionally populate package info

        if (!user) {
            return res.status(404).json({ message: 'User not found or not allowed' });
        }

        return res.status(200).json({ user });
    } catch (err) {
        console.error('Error fetching user:', err);
        return res.status(500).json({ message: 'Server error' });
    }
};

export const addManualCronController = async (req: any, res: any) => {

    try {
        const { executeInMs, url, title, status } = req.body;

        const sanitized = sanitizeDomain(url);
        if (!sanitized) {
            return res.status(400).json({ error: true, message: `Invalid domain: ${url}` });
        }

        const delay = Number(executeInMs);

        if (!url) {
            return res.status(400).json({
                success: false,
                message: 'Invalid input. `url` is required',
            });
        }

        if (!delay || delay < 3000) {
            return res.status(400).json({
                success: false,
                message: 'Invalid input. `executeInMs` must be at least 3000 ms.',
            });
        }

        if (!title) {
            return res.status(400).json({
                success: false,
                message: 'Cron title is required',
            })
        }

        // Find the admin user (or whoever should own this cron)\
        const admin = await User.findById(req.user._id);

        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin user not found or disabled',
            });
        }


        // Add domain to admin.manualDomains if not already exists
        admin.manualDomains = admin.manualDomains || [];

        const exists = admin.manualDomains?.some((d: TManualDomain) => d.url === url);
        const objectId = new mongoose.Types.ObjectId();
        if (!exists) {
            admin.manualDomains.push({
                _id: objectId,
                url,
                title,
                status: (status as string) || 'enabled',
                executeInMs: delay || (1000 * 60 * 10) // default 10 min
            });
            await admin.save();


            // add to the task queue
            if (status === "enabled") {
                const dataToInsert: IAddDomainToQueueOptions = {
                    userId: req.user._id,
                    domain: {
                        url: url,
                        _id: objectId.toString(),
                        status: "enabled"
                    },
                    type: "manual",
                    intervalInMs: delay,
                }

                await addDomainToQueue(dataToInsert)
            }

        } else {
            return res.status(409).json({
                success: false,
                message: "This domain already exists in your database"
            })
        }

        return res.status(201).json({
            success: true,
            message: 'Manual domain added',

            //   jobId: job.id,
        });

    } catch (err) {
        console.error('Error clearing cron history:', err);
        return res.status(500).json({ message: 'Server error' });
    }


}

export const getManualCronsController = async (req: any, res: any) => {
    try {
        const admin = await User.findById(req.user._id);

        return res.status(201).json({
            success: true,
            manualCrons: admin.manualDomains || []
        });

    } catch (err) {
        console.error('Error clearing cron history:', err);
        return res.status(500).json({ message: 'Server error' });
    }
}

export const deleteManualCronController = async (req: any, res: any) => {
    try {
        const { domainId } = req.params;

        if (!domainId) {
            return res.status(400).json({ success: false, message: 'Domain ID is required' });
        }

        const admin = await User.findById(req.user._id);

        if (!admin || admin.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const originalLength = admin.manualDomains?.length || 0;

        // Filter out the domain with the matching _id

        const domainToRemove = (admin.manualDomains || []).find((d: any) => d?._id?.toString() === domainId);
        admin.manualDomains = (admin.manualDomains || []).filter(
            (domain: any) => domain._id.toString() !== domainId
        );

        if (admin.manualDomains.length === originalLength) {
            return res.status(404).json({ success: false, message: 'Manual domain not found' });
        }

        await admin.save();

        // delete the manual domain from the queue.
        await removeDomainFromQueue({ userId: admin?._id, domainUrl: domainToRemove?.url, type: 'manual' })

        return res.status(200).json({ success: true, message: 'Manual domain deleted successfully' });

    } catch (err) {
        console.error('Error deleting manual domain:', err);
        return res.status(500).json({ message: 'Server error' });
    }
};

export const updateManualCronController = async (req: any, res: any) => {
    try {
        const { domainId } = req.params;
        const { status, executeInMs } = req.body;

        // Validation
        if (!status && !executeInMs) {
            return res.status(400).json({
                success: false,
                message: "At least one of 'status' or 'executeInMs' must be provided",
            });
        }

        if (status && !["enabled", "disabled"].includes(status)) {
            return res
                .status(400)
                .json({ success: false, message: "Status must be either enabled or disabled" });
        }

        if (!domainId || !isValidMongoId(domainId)) {
            return res
                .status(400)
                .json({ success: false, message: "Valid Domain ID is required" });
        }

        const admin = await User.findById(req.user._id);
        if (!admin || admin.role !== "admin") {
            return res.status(403).json({ success: false, message: "Access denied" });
        }

        // Find domain
        const domainToUpdate = (admin.manualDomains || []).find(
            (domain: any) => domain._id.toString() === domainId
        );

        if (!domainToUpdate) {
            return res
                .status(404)
                .json({ success: false, message: "Manual domain not found" });
        }

        if (status === domainToUpdate?.status && executeInMs === domainToUpdate?.executeInMs) {
            return res
                .status(400)
                .json({ success: false, message: "Noting to update" });
        }

        // Update fields
        if (status) domainToUpdate.status = status;
        if (executeInMs) domainToUpdate.executeInMs = executeInMs;

        // Queue handling
        if (status === "disabled") {
            // Remove job
            await removeDomainFromQueue({
                userId: admin._id.toString(),
                domainUrl: domainToUpdate.url,
                type: "manual",
            });
        } else {
            // Add / update job
            const dataToInsert: IAddDomainToQueueOptions = {
                userId: admin._id.toString(),
                domain: {
                    url: domainToUpdate.url,
                    _id: domainToUpdate._id,
                    status: domainToUpdate.status,
                },
                type: "manual",
                intervalInMs: domainToUpdate.executeInMs,
            };

            await addDomainToQueue(dataToInsert);
        }

        // Save user updates
        await admin.save();

        return res.status(200).json({
            success: true,
            message: "Manual domain updated successfully",
            domain: domainToUpdate,
        });
    } catch (err) {
        console.error("Error updating manual domain:", err);
        return res.status(500).json({ message: "Server error" });
    }
};


export const dashboardInfoCronController = async (req: any, res: any) => {
    try {
        const users = await User.find({ role: 'user' }).select('status defaultDomains manualDomains')

        let totalDefaultDomains = 0;
        let totalManualDomains = 0;
        let activeUsers = 0;
        let deactiveUsers = 0;
        let onlineDomains = 0;
        let offlineDomains = 0;

        for (const user of users) {
            if (user.status === 'enabled') activeUsers++;
            if (user.status === 'disabled') deactiveUsers++;

            totalDefaultDomains += user.defaultDomains?.length || 0;
            totalManualDomains += user.manualDomains?.length || 0;

            const defaultDomains = user.defaultDomains || [];
            const manualDomains = user.manualDomains || [];

            for (const domain of defaultDomains) {
                if (domain.status === 'enabled') {
                    onlineDomains++;
                } else {
                    offlineDomains++;
                }
            }

            for (const domain of manualDomains) {
                if (domain.status === 'enabled') {
                    totalManualDomains++;
                    onlineDomains++;
                } else {
                    offlineDomains++;
                }
            }
        }

        return res.json({
            success: true,
            data: {
                totalDefaultDomains,
                totalManualDomains,
                activeUsers,
                deactiveUsers,
                offlineDomains,
                onlineDomains,
            },
        });

    } catch (err) {
        console.error('Error updating manual domain:', err);
        return res.status(500).json({ message: 'Server error' });
    }
};

export const assignPackageToUserController = async (req: any, res: any) => {
    try {
        const { packageId, userId } = req.body;

        // Validate that both packageId and userId are provided and are valid MongoDB IDs.
        if (!packageId || !userId) {
            return res.status(400).json({ success: false, message: 'packageId and userId are required.' });
        }

        if (!isValidMongoId(packageId) || !isValidMongoId(userId)) {
            return res.status(400).json({ success: false, message: 'Invalid packageId or userId format.' });
        }

        // Check if the package exists.
        const existPackage = await Package.findById(packageId);
        if (!existPackage) {
            return res.status(404).json({ success: false, message: 'Package not found.' });
        }

        // Find the user and update their subscription.
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        // If the user has this package, and it expires in more than 1 day, block the update.
        const now = new Date();
        const oneDayInMs = 24 * 60 * 60 * 1000;

        if (
            user.subscription &&
            user.subscription.toString() === packageId.toString() &&
            user.packageExpiresAt &&
            (user.packageExpiresAt.getTime() - now.getTime()) > oneDayInMs
        ) {
            return res.status(400).json({ success: false, message: 'User already has this package, and it is still valid.' });
        }


        // Assign the new package to the user.

        user.subscription = existPackage._id; // Assign the _id of the found package
        user.packageExpiresAt = calculateExpirationDate(existPackage.validity);

        await user.save();

        const updatedUser = await User.findById(user._id).select('subscription defaultDomains manualDomains status packageExpiresAt')
            .populate({
                path: 'subscription',
                model: 'Package',
                select: 'intervalInMs status'
            })
            .lean();

        await cleanAllPreviousTaskFromQueue(userId);
        const isAdded = await addUserDomainsToTaskQueue(updatedUser);

        if (!isAdded) {
            return res.status(200).json({ success: true, message: 'Package successfully assigned to user but could not added to the queue.', data: user });
        }


        return res.status(200).json({ success: true, message: 'Package successfully assigned to user.', data: user });

    } catch (err) {
        console.error('Error assigning package to user:', err);
        return res.status(500).json({ success: false, message: 'Server error.' });
    }
};