import User from "../models/User";
import { TDomain } from "../types/types";
import { sanitizeDomain } from "../utils/sanitize";

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

    const { name, mobile, password, domain } = req?.body ;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: true, message: 'User not found' });

    // Update fields if provided
    if (name) user.name = name;
    if (mobile) user.mobile = mobile;

    if (password && password.length >= 8) {
      user.password = password
    }

    if (domain) {
      const sanitized = sanitizeDomain(domain);
      if (!sanitized) return res.status(400).json({ error: true, message: 'Invalid domain' });
      user.defaultDomains = [{ status: 'enabled', url: sanitized }];
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
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: true, message: 'User not found' });
    res.json({
      success: true,
      user: {
        name: user.name,
        email: user.email,
        domain: user.defaultDomains,
        mobile: user.mobile,
        status: user.status,
        role: user.role,
        telegramConnected: user.telegramConnected,
        packageExpiresAt: user.packageExpiresAt,   
        subscription: user.subscription,
        manualCronCount: user.manualCronCount,
        allowedToAddManualDomains: user.allowedToAddManualDomains,
      }
    });

  } catch (err) {
    console.error('[Update Profile]', err);
    res.status(500).json({ error: true, message: 'Server error' });
  }
};

export const addDomainController = async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const { domains }: { domains: string[] } = req.body;

    if (!Array.isArray(domains) || domains.length === 0) {
      return res.status(400).json({ error: true, message: 'Invalid domains format' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: true, message: 'User not found' });

    const sanitized = domains.map(domain => ({
      raw: domain,
      sanitized: sanitizeDomain(domain),
    }));

    const validSanitizedDomains = sanitized.filter(item => item.sanitized);
    const invalidDomains = sanitized.filter(item => !item.sanitized).map(item => item.raw);

    if (validSanitizedDomains.length === 0) {
      return res.status(400).json({ error: true, message: 'No valid domains provided', invalidDomains });
    }

    // Gather existing domain URLs for comparison
    const defaultUrls = user.defaultDomains.map((d: TDomain) => d.url);
    const manualUrls = (user.manualDomains || []).map((d: TDomain) => d.url);
    const allExistingUrls = new Set([...defaultUrls, ...manualUrls]);

    // Filter out duplicates
    const newUniqueDomains = validSanitizedDomains
      .filter(item => !allExistingUrls.has(item.sanitized))
      .map(item => item.sanitized as string);

    const duplicates = validSanitizedDomains
      .filter(item => allExistingUrls.has(item.sanitized))
      .map(item => item.raw);

    if (newUniqueDomains.length === 0) {
      return res.status(409).json({
        error: true,
        message: `${duplicates.length > 1 ? "All" : "This"} domain${duplicates.length > 1 ? "s" : ""} already exist`,
        duplicates,
        invalid: invalidDomains
      });
    }

    // Quota check
    const manualCronCount = user.manualCronCount || 0;
    const limit = user.subscription?.manualCronLimit || 0;
    const newTotal = manualCronCount + newUniqueDomains.length;

    if (newTotal > limit) {
      return res.status(400).json({
        error: true,
        message: `Adding ${newUniqueDomains.length > 1 ? "these" : "this"} domain${newUniqueDomains.length > 1 ? "s" : ""} exceeds your limit (${limit})`,
        currentCount: manualCronCount,
        tryingToAdd: newUniqueDomains.length
      });
    }

    // Add to user's manualDomains
    const domainObjects: TDomain[] = newUniqueDomains.map(url => ({
      url,
      status: 'enabled',
    }));

    user.manualDomains?.push(...domainObjects);
    user.manualCronCount += domainObjects.length;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Domains added successfully',
      added: newUniqueDomains,
      invalid: invalidDomains,
      duplicates
    });

  } catch (err) {
    console.error('[Add Domain]', err);
    res.status(500).json({ error: true, message: 'Server error' });
  }
};


export const removeDomainController = async (req: any, res: any) => {
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

export const updateDomainStatusController = async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const { domainId, status }: { domainId: string; status: 'enabled' | 'disabled' } = req.body;

    if (!domainId || !['enabled', 'disabled'].includes(status)) {
      return res.status(400).json({ error: true, message: 'Invalid domain ID or status' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: true, message: 'User not found' });

    let updatedDomainType: 'manual' | 'default' | null = null;
    let updatedDomain = null;

    // Try updating manualDomains
    if (user.manualDomains) {
      const domain = user.manualDomains.find((d: any) => d._id.toString() === domainId);
      if (domain) {
        domain.status = status;
        updatedDomain = domain;
        updatedDomainType = 'manual';
      }
    }

    // Try updating defaultDomains if not found in manualDomains
    if (!updatedDomain && user.defaultDomains) {
      const domain = user.defaultDomains.find((d: any) => d._id.toString() === domainId);
      if (domain) {
        domain.status = status;
        updatedDomain = domain;
        updatedDomainType = 'default';
      }
    }

    if (!updatedDomain) {
      return res.status(404).json({ error: true, message: 'Domain not found in manual or default list' });
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: `Domain status updated to ${status}`,
      type: updatedDomainType,
      domain: {
        id: domainId,
        url: updatedDomain.url,
        status: updatedDomain.status
      }
    });

  } catch (err) {
    console.error('[Update Domain Status]', err);
    res.status(500).json({ error: true, message: 'Server error' });
  }
};

