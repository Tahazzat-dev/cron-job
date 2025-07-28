import Package from "../models/Package";
import User from "../models/User";

// add a package
export const addPackageController = async (req: any, res: any) => {
  try {
    const { name, price, validity, intervalInMs, manualCronLimit, status } = req.body;

    // Validate required fields
    const missingFields = [];
    if (!name) {
      missingFields.push('name');
    }

    if (!validity) {
      missingFields.push('validity');
    }
    if (!intervalInMs) {
      missingFields.push('intervalInMs');
    }
    if (!manualCronLimit) {
      missingFields.push('manualCronLimit');
    }

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `The following fields are required: ${missingFields.join(', ')}.`,
      });
    }

    // Check for duplicate package name
    const existing = await Package.findOne({ name });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Package with this name already exists.',
      });
    }

    // Create the package
    const newPackage = await Package.create({
      name,
      price: price || 0,
      validity,
      intervalInMs,
      manualCronLimit,
      status: status,
    });

    return res.status(201).json({
      success: true,
      message: 'Package created successfully.',
      data: newPackage,
    });
  } catch (err) {
    console.error('[Create Package]', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// update a package
export const updatePackageController = async (req: any, res: any) => {
  try {
    const { packageId } = req.params;
    const updateFields = req.body;

    if (!packageId) {
      return res.status(400).json({ success: false, message: 'Package ID is required.' });
    }

    const updatedPackage = await Package.findByIdAndUpdate(
      packageId,
      updateFields,
      { new: true, runValidators: true }
    );

    if (!updatedPackage) {
      return res.status(404).json({ success: false, message: 'Package not found.' });
    }

    res.json({
      success: true,
      message: 'Package updated successfully.',
      data: updatedPackage,
    });
  } catch (error:any) {

    // Check if the error is a Mongoose validation error
    if (error.name === 'ValidationError') {
      const errors: { [key: string]: string } = {};
      for (const field in error.errors) {
        if (error.errors.hasOwnProperty(field)) {
          const validationError = error.errors[field];
          // Customize the error message for 'status' enum validation
          if (validationError.path === 'status' && validationError.kind === 'enum') {
            errors[field] = `Status should be either 'enabled' or 'disabled'. Received: '${validationError.value}'`;
          } else {
            errors[field] = validationError.message;
          }
        }
      }
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors,
      });
    }

    // Generic server error for other types of errors
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// delete a package
export const deletePackageController = async (req: any, res: any) => {
  try {
    const { packageId } = req.params;
    const deletedPackage = await Package.findByIdAndDelete(packageId);

    if (!deletedPackage) {
      return res.status(404).json({
        success: false,
        message: 'Package not found or already deleted.',
      });
    }

    return res.json({
      success: true,
      message: 'Package deleted successfully.',
      data: deletedPackage,
    });
  } catch (err) {
    console.error('[Delete Package]', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// get all packages
export const getAllPackagesController = async (req: any, res: any) => {
  try {
    const packages = await Package.find().sort({ price: 1 });

    return res.json({
      success: true,
      message: 'All packages fetched successfully',
      data: packages,
    });
  } catch (err) {
    console.error('[Get All Packages]', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// get a single package info
export const getSinglePackageController = async (req: any, res: any) => {
  try {
    const { packageId } = req.params;
    const foundPackage = await Package.findById(packageId);
    if (!foundPackage) {
      return res.status(404).json({ error: true, message: 'Package not found' });
    }

    res.json({
      success: true,
      data: foundPackage,
    });
  } catch (err) {
    console.error('[Get Single Package]', err);
    res.status(500).json({ error: true, message: 'Server error' });
  }
};


// set a package for a user
export const setUserPackageController = async (req: any, res: any) => {
  try {
    const { userId, packageId } = req.body;

    if (!userId || !packageId) {
      return res.status(400).json({
        success: false,
        message: 'userId and packageId are required',
      });
    }

    const pkg = await Package.findById(packageId);
    if (!pkg) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Calculate expiration date from now based on package validity (in days)
    const validityInMs = pkg.validity * 24 * 60 * 60 * 1000;
    const newExpiryDate = new Date(Date.now() + validityInMs);

    user.subscription = pkg._id;
    user.packageExpiresAt = newExpiryDate;

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'User package updated successfully',
      user: {
        _id: user._id,
        subscription: user.subscription,
        packageExpiresAt: user.packageExpiresAt,
      },
    });
  } catch (err) {
    console.error('[Set User Package]', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};