import { isValidObjectId } from "mongoose";
import User from "../models/User";
import { IAddDomainToQueueOptions, IPayment, ITransaction, TDomain, TManualDomain, TokenTransaction, TxValidationParams } from "../types/types";
import { extractPathAfterRootDomain, sanitizeDomain } from "../utils/sanitize";
import axios from "axios";
import { calculateExpirationDate, isTimestampOlderThan24Hours, isValidTokenTransaction, removeDomainFromQueue } from "../utils/utilityFN";
import Package from "../models/Package";
import { error } from "console";
import Transaction from "../models/Transaction";
import Payment from "../models/Payment";
import { autoCronQueue } from "../queues/autoCron.queue";
import { addDomainToQueue } from "../utils/schedule";

interface SanitizeResult {
  raw: string;
  sanitized: string | null;
}

function isSanitizedString(item: SanitizeResult): item is { raw: string; sanitized: string } {
  return item.sanitized !== null && item.sanitized !== undefined && item.sanitized !== '';
}

export const profileUpdateController = async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    console.log(userId, ' user id from update profile');

    const { name, mobile, password } = req?.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: true, message: 'User not found' });

    // Update fields if provided
    if (name) user.name = name;
    if (mobile) user.mobile = mobile;

    if (password && password.length >= 8) {
      user.password = password
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        name: user.name,
        email: user.email,
        domain: user.defaultDomains,
        mobile: user.mobile,
      }
    });

  } catch (err) {
    console.error('[Update Profile]', err);
    res.status(500).json({ error: true, message: 'Server error' });
  }
};


export const viewProfileController = async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId)
      .select('name email mobile status role defaultDomains telegramConnected packageExpiresAt subscription manualCronCount allowedToAddManualDomains manualDomains')
      .populate({
        path: 'subscription',
        model: 'Package',
        select: 'name validity status features',
      })
      .lean();

    if (!user) return res.status(404).json({ error: true, message: 'User not found' });

    res.json({
      success: true,
      user
    });

  } catch (err) {
    console.error('[Update Profile]', err);
    res.status(500).json({ error: true, message: 'Server error' });
  }
};

export const addDomainController = async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const { url, title, executeInMs } = req.body;

    if (!url || !title || !executeInMs) {
      return res.status(400).json({ error: true, message: 'URL, title and executeInMs properties are required' });
    }

    if (executeInMs < 3000) {
      return res.status(403).json({ error: true, message: 'executeInMs must be larger than 3s' });
    }

    const sanitized = sanitizeDomain(url);
    if (typeof url !== 'string' || !sanitized) {
      return res.status(400).json({ error: true, message: 'Invalid URL formate. A valid URL must be provided' });
    }

    const user: any = await User.findById(userId).populate('subscription').lean();
    if (!user) return res.status(404).json({ error: true, message: 'User not found' });


    // check if the user is permitted to add manual domain
    if (!user.allowedToAddManualDomains) {
      return res.status(403).json({ error: true, message: 'You are not authorized to add manual domain please contact admin to enable that.' });
    }

    if (!user?.domain || sanitized !== user.domain) {
      return res.status(400).json({
        error: true,
        message: 'Root domain mismatch. You can only add Urls under your registered root domain.',
        expectedRoot: user.domain,
        receivedRoot: sanitized,
      });
    }

    const defaultUrls = user.defaultDomains.map((d: TDomain) => d.url);
    const manualUrls = (user.manualDomains || []).map((d: TDomain) => d.url);
    const allUrls = new Set([...defaultUrls, ...manualUrls]);

    const urlAfterRoot = extractPathAfterRootDomain(url);
    const fullUrl = sanitized + urlAfterRoot;
    console.log(fullUrl, ' full url')

    if (allUrls.has(fullUrl)) {
      return res.status(409).json({
        error: true,
        message: ' This url already exists in your account',
        domain: url
      });
    }


    const manualCronCount = user.manualCronCount || 0;
    const limit = user.subscription?.manualCronLimit || 0;

    if (manualCronCount + 1 > limit) {
      return res.status(400).json({
        error: true,
        message: `Adding this URL exceeds your manual cron limit (${limit})`,
        currentCount: manualCronCount
      });
    }

    // All checks passed: Add url
    const fullSanitizedDomain = sanitized + urlAfterRoot;
    const domainObject: TManualDomain = {
      url: fullSanitizedDomain,
      status: 'enabled',
      title,
      executeInMs,
    };


    // find the user and add the manual domain
    const updatedUser = await User.findOneAndUpdate(
      { _id: userId },
      {
        $push: { manualDomains: domainObject },
        $inc: { manualCronCount: 1 },
      },
      { new: true, projection: { manualDomains: { $slice: -1 } } } // only return last inserted domain
    );

    const insertedDomain = updatedUser?.manualDomains[0];

    // add the manual domain in the task queue to execute 
    if (insertedDomain && updatedUser.status === "enabled") {
      const dataToInsert: IAddDomainToQueueOptions = {
        userId,
        domain: {
          url: insertedDomain.url,
          _id: insertedDomain._id,
          status: insertedDomain.status
        },
        type: "manual",
        intervalInMs: insertedDomain.executeInMs,
        expires: calculateExpirationDate(user?.subscription?.validity)
      }
      await addDomainToQueue(dataToInsert)
    }

    return res.status(200).json({
      success: true,
      message: 'Domain added successfully',
      added: sanitized
    });

  } catch (err) {
    console.error('[Add Domain]', err);
    return res.status(500).json({ error: true, message: 'Server error' });
  }
};


export const removeDomainsController = async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const { domainIds }: { domainIds: string[] } = req.body;

    if (!Array.isArray(domainIds) || domainIds.length === 0) {
      return res.status(400).json({ error: true, message: 'Invalid domain IDs format' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: true, message: 'User not found' });

    const manualDomains = user.manualDomains || [];

    // Track matched vs unmatched domainIds
    const currentDomainIds = manualDomains.map((d: any) => d._id.toString());
    const matchedIds = domainIds.filter(id => currentDomainIds.includes(id));
    const unmatchedIds = domainIds.filter(id => !currentDomainIds.includes(id));

    if (matchedIds.length === 0) {
      return res.status(404).json({ error: true, message: 'No matching domains found for removal' });
    }

    // Remove matched domains
    user.manualDomains = manualDomains.filter((d: any) => !matchedIds.includes(d._id.toString()));

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Domains removed successfully',
      removed: matchedIds,
      notFound: unmatchedIds.length > 0 ? unmatchedIds : undefined
    });

  } catch (err) {
    console.error('[Remove Domain]', err);
    res.status(500).json({ error: true, message: 'Server error' });
  }
};

export const removeDomainController = async (req: any, res: any) => {
  try {
    const { domainId } = await req.params;

    if (!domainId) {
      return res.status(400).json({ success: false, message: 'Domain ID is required' });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(403).json({ success: false, message: 'Access denied. No user found' });
    }

    const originalLength = user.manualDomains?.length || 0;

    // Filter out the domain with the matching _id

    const domainToRemove = (user.manualDomains || []).find((d: any) => d?._id?.toString() === domainId);
    user.manualDomains = (user.manualDomains || []).filter(
      (domain: any) => domain._id.toString() !== domainId
    );

    if (user.manualDomains.length === originalLength) {
      return res.status(404).json({ success: false, message: 'Manual domain not found' });
    }

    await user.save();

    // delete the manual domain from the queue.
    await removeDomainFromQueue({ userId: user?._id, domainUrl: domainToRemove?.url, type: 'manual' })

    return res.status(200).json({ success: true, message: 'Manual domain deleted successfully' });

  } catch (err) {
    console.error('Error deleting manual domain:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const updateDomainStatusController = async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const { domainId, status }: { domainId: string; status: "enabled" | "disabled" } = req.body;

    if (!domainId || !["enabled", "disabled"].includes(status)) {
      return res.status(400).json({ error: true, message: "Invalid domain ID or status" });
    }

    const user: any = await User.findById(userId).populate("subscription"); // removed lean()
    if (!user) return res.status(404).json({ error: true, message: "User not found" });

    let updatedDomainType: "manual" | "default" | null = null;
    let updatedDomain: any = null;

    // --- Try manual domains ---
    if (user?.manualDomains?.length) {
      const domain = user.manualDomains.find((d: any) => d._id.toString() === domainId);
      if (domain) {

        if (domain.status === status) {
          return res.status(400).json({ success: false, message: "Nothing to update. Previous and current status are same." });
        }

        domain.status = status;
        updatedDomain = domain;
        updatedDomainType = "manual";

        console.log(user, ' user details inside manual domain update')

        if (status === "enabled") {
          const dataToInsert: IAddDomainToQueueOptions = {
            userId: user._id.toString(),
            domain: {
              url: domain.url,
              _id: domain._id,
              status: domain.status,
            },
            type: "manual",
            intervalInMs: domain.executeInMs,
            expires: calculateExpirationDate(user?.subscription?.validity),
          };
          await addDomainToQueue(dataToInsert);
        } else {
          // Remove job
          await removeDomainFromQueue({
            userId: user._id,
            domainUrl: domain.url,
            type: "manual",
          });
        }
      }
    }

    // --- Try default domains if not manual ---
    if (!updatedDomain && user?.defaultDomains?.length) {

      const domain = user.defaultDomains.find((d: any) => d._id.toString() === domainId);

      if (domain) {

        if (domain.status === status) {
          return res.status(400).json({ success: false, message: "Nothing to update. Previous and current status are same." });
        }


        domain.status = status;
        updatedDomain = domain;
        updatedDomainType = "default";

        console.log(user, 'user from updating default domain');
        console.log(domain, ' default domain to udpate');

        if (status === "enabled") {
          const dataToInsert: IAddDomainToQueueOptions = {
            userId: user._id.toString(),
            domain: {
              url: domain.url,
              _id: domain._id,
              status: domain.status,
            },
            type: "default",
            intervalInMs: domain.subscription?.intervalInMs || 5000,
            expires: calculateExpirationDate(user?.subscription?.validity),
          };

          await addDomainToQueue(dataToInsert);
        } else {
          await removeDomainFromQueue({
            userId: user._id,
            domainUrl: domain.url,
            type: "default",
          });
        }
      }
    }

    if (!updatedDomain) {
      return res.status(404).json({ error: true, message: "Domain not found in manual or default list" });
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: `Domain status updated to ${status}`,
      type: updatedDomainType,
      domain: {
        id: domainId,
        url: updatedDomain.url,
        status: updatedDomain.status,
      },
    });
  } catch (err) {
    console.error("[Update Domain Status]", err);
    res.status(500).json({ error: true, message: "Server error" });
  }
};

export const initiateSubscribePackageController = async (req: any, res: any) => {
  try {
    const userId = req.user?.id;
    const { packageId } = req.body;

    if (!packageId) {
      return res.status(400).json({
        error: true,
        message: 'packageId is required',
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: `User not found for user id: ${userId}`,
      });
    }

    const packageToSubscribe = await Package.findOne({
      _id: packageId,
      status: 'enabled',
    });

    if (!packageToSubscribe) {
      return res.status(404).json({
        success: false,
        message: 'Subscription package not found',
      });
    }


    const processExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // expires in 10 minutes

    const paymentData: IPayment = {
      amount: packageToSubscribe.price,
      packageId: packageToSubscribe.packageId,
      processExpiresAt,
      userId,
    };

    const payment = await Payment.findOneAndUpdate(
      { userId },
      {
        userId,
        packageId: packageToSubscribe.packageId,
        amount: packageToSubscribe.price,
        processExpiresAt,
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );


    return res.status(201).json({
      success: true,
      message: 'Payment initialized successfully',
      paymentId: payment._id,
      expiresAt: processExpiresAt,
      amount: paymentData.amount,
    });

  } catch (err) {
    console.error('[initiateSubscribePackageController]', err);
    return res.status(500).json({
      error: true,
      message: 'Internal server error',
    });
  }
};




const USDT_CONTRACT = '0x55d398326f99059fF775485246999027B3197955'; // BSC USDT
export const subscribePackageController = async (req: any, res: any) => {
  try {
    const userId = req.user?.id;
    const { amount, packageId, transactionHash } = req.body;

     if (!amount || !packageId || !transactionHash) {
      return res.status(400).json({
        error: true,
        message: 'amount, packageId, and transactionHash are required',
      });
    }


    // Step-1 : check if the transaction already exists or not.
    const isTransactionExist = await Transaction.findOne({ transactionHash })
    if (isTransactionExist) {
      return res.status(409).json({ success: false, message: "Transaction hash already used" })
    }

    const WALLET = process.env.WALLET || '';
    const API_KEY = process.env.BSCSCAN_API_KEY || '';

    // Step-2 : check for WALLET AND API_KEY
    if (!WALLET || !API_KEY) {
      console.log("Missing .env variables");
      return res.status(500).json({ error: true, message: 'Server misconfiguration' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: `User not found for user id: ${userId}` });
    }

    // check if the package is exist in based on the packageId and price.
    const packageToSubscribe = await Package.findOne({
      _id: packageId,
      status: "enabled",
    });

    if (!packageToSubscribe) {
      return res.status(404).json({ message: "Subscription package is not found", success: false })
    }

    // Fetch token transfer history to your wallet
    const url = `https://api.bscscan.com/api?module=account&action=tokentx&contractaddress=${USDT_CONTRACT}&address=${WALLET}&apikey=${API_KEY}`;
    const { data } = await axios.get(url);

    if (data.status !== '1' || !Array.isArray(data.result)) {
      return res.status(404).json({ success: false, message: 'No token transactions found' });
    }

    const txs: TokenTransaction[] = data.result;

    // Convert amount (in USDT, e.g. 10.01) to Wei (USDT has 18 decimals on BSC)
    const amountInWei = BigInt(Math.round(Number(amount) * 1e18)).toString();

    const matchedTx = txs.find((tx) =>
      isValidTokenTransaction(tx, {
        expectedHash: transactionHash,
        expectedTo: WALLET,
        expectedTokenContract: USDT_CONTRACT,
        expectedValueInWei: amountInWei,
      })
    );

    if (!matchedTx) {
      return res.status(400).json({
        success: false,
        message: 'Transaction not found or not valid',
      });
    }

    if (isTimestampOlderThan24Hours(parseInt(matchedTx.timeStamp))) return res.status(410).json({ success: false, message: "Payment time expired. You have to verifiy payment within 24 hours of your payment" })

    // assing the package to the user and add domains to the task queue.
    
    // Proceed with package activation here (e.g. create subscription, activate access)
    return res.status(200).json({
      success: true,
      message: 'Subscription confirmed',
      transaction: matchedTx,
    });

  } catch (err) {
    console.error('[subscribePackageController]', err);
    return res.status(500).json({ error: true, message: 'Server error' });
  }
};
