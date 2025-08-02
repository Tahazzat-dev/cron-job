import mongoose from "mongoose";
import CronLog from "../models/CronLog";
import User from "../models/User";
import { IDomain, IManualDomain, TDomain, TManualDomain } from "../types/types";

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
            subscription,
            allowedToAddManualDomains,
            defaultDomains,
            manualDomains,
        } = req.body;


        if (name) user.name = name;
        if (email) user.email = email;
        if (password) user.password = password;
        if (mobile) user.mobile = mobile;

        const validStatuses = ['enabled', 'disabled', 'deleted', 'blocked']

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                error: true,
                message: `Invalid status. Status should be : "enabled", "disabled", "deleted", "blocked".`,
            });
        }

        if (status) user.status = status;

        // Update subscription
        if (subscription) {
            // TODO: Remove previous BullMQ repeat jobs if package/interval changes
            user.subscription = subscription;
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

                    // TODO: If status becomes disabled, remove from BullMQ using jobId
                    // const jobId = `auto-default-${user._id}-${domain.url}`;
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

                    // TODO: If status becomes disabled, remove from BullMQ using jobId
                    // const jobId = `auto-manual-${user._id}-${domain.url}`;
                }
            }
        }

        await user.save();

        return res.json({ message: 'User updated successfully', user });
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
        const { executeInMs, url, status } = req.body;

        const delay = Number(executeInMs);

        if (!url) {
            return res.status(400).json({
                success: false,
                message: 'Invalid input. `url` is required',
            });
        }

        if (delay || delay < 3000) {
            return res.status(400).json({
                success: false,
                message: 'Invalid input. `executeInMs` must be at least 3000 ms.',
            });
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

        if (!exists) {
            admin.manualDomains.push({
                _id: new mongoose.Types.ObjectId(),
                url,
                status: (status as string) || 'enabled',
                executeInMs: delay || (1000 * 60 * 10) // default 10 min
            });
            await admin.save();
        } else {
            return res.status(409).json({
                success: false,
                message: "This domain already exists in your database"
            })
        }

        // Add manual cron job with delay
        // TODO: have to add to the queue.
        // const job = await manualCronQueue.add(
        //   'manual-execute',
        //   {
        //     userId: admin._id,
        //     domain: {
        //       url,
        //       status: status ?? 'enabled',
        //     },
        //     type: 'manual',
        //   },
        //   {
        //     delay,
        //     removeOnComplete: true,
        //     removeOnFail: true,
        //   }
        // );

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
        admin.manualDomains = (admin.manualDomains || []).filter(
            (domain: any) => domain._id.toString() !== domainId
        );

        if (admin.manualDomains.length === originalLength) {
            return res.status(404).json({ success: false, message: 'Manual domain not found' });
        }

        await admin.save();

        return res.status(200).json({ success: true, message: 'Manual domain deleted successfully' });

    } catch (err) {
        console.error('Error deleting manual domain:', err);
        return res.status(500).json({ message: 'Server error' });
    }
};

export const updateManualCronController = async (req: any, res: any) => {
    try {
        const { domainId } = req.params;
        const { url, status, executeInMs } = req.body;

        if (!url && !status && !executeInMs) {
            return res.status(400).json({ success: false, message: 'At least one of url, status, or executeInMs must be provided', });
        }

        if (!domainId) {
            return res.status(400).json({ success: false, message: 'Domain ID is required' });
        }

        const admin = await User.findById(req.user._id);

        if (!admin || admin.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const domainToUpdate = (admin.manualDomains || []).find(
            (domain: any) => domain._id.toString() === domainId
        );

        if (!domainToUpdate) {
            return res.status(404).json({ success: false, message: 'Manual domain not found' });
        }

        // Update allowed fields
        if (url !== undefined) domainToUpdate.url = url;
        if (status !== undefined) domainToUpdate.status = status;
        if (executeInMs !== undefined) domainToUpdate.executeInMs = executeInMs;

        await admin.save();

        return res.status(200).json({
            success: true,
            message: 'Manual domain updated successfully',
            domain: domainToUpdate,
        });
    } catch (err) {
        console.error('Error updating manual domain:', err);
        return res.status(500).json({ message: 'Server error' });
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