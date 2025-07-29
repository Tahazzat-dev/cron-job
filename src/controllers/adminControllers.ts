import CronLog from "../models/CronLog";
import User from "../models/User";
import { IDomain, IManualDomain, TDomain } from "../types/types";

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


export const getCronHistoryController = async (req: any, res: any) => {
    try {
        const {
            userId,
            domainType,
            domainUrl,
            status,
            page: rawPage = '1',
            limit: rawLimit = '20',
        } = req.query;

        const page = parseInt(rawPage as string, 10);
        const limit = parseInt(rawLimit as string, 10);
        const skip = (page - 1) * limit;

        const query: any = {};

        if (userId) query.userId = userId;
        if (domainType) query['domainType'] = domainType;
        if (domainUrl) query['domain'] = domainUrl;
        if (status) query.status = Number(status);

        const [logs, total] = await Promise.all([
            CronLog.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            CronLog.countDocuments(query),
        ]);

        return res.json({
            logs,
            total,
            page: Number(page),
            pages: Math.ceil(total / Number(limit)),
        });
    } catch (err) {
        console.error('Error fetching cron history:', err);
        return res.status(500).json({ message: 'Server error' });
    }
}

export const clearCronHistoryController = async (req: any, res: any) => {
    try {
        const { userId, domainType, domainUrl, status } = req.query;

        const query: any = {};

        if (userId) query.userId = userId;
        if (domainType) query.domainType = domainType;
        if (domainUrl) query.domain = domainUrl;
        if (status) query.status = Number(status);

        const result = await CronLog.deleteMany(query);

        return res.json({
            message: 'Cron history cleared successfully',
            deletedCount: result.deletedCount,
        });

    } catch (err) {
        console.error('Error clearing cron history:', err);
        return res.status(500).json({ message: 'Server error' });
    }
}
