import store from '../utils/dataStore.js';

/**
 * @desc    Get all school inventory assets
 * @route   GET /api/inventory
 * @access  Private
 */
export const getInventory = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      count: store.inventory.length,
      data: store.inventory,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get inventory summary categorized
 * @route   GET /api/inventory/summary
 * @access  Private
 */
export const getInventorySummary = async (req, res, next) => {
  try {
    const totalAssets = store.inventory.reduce((sum, item) => sum + item.totalQuantity, 0);
    const communityDonated = store.inventory
      .filter((i) => i.source === 'Community Donation')
      .reduce((sum, item) => sum + item.totalQuantity, 0);
    const govtSupplied = store.inventory
      .filter((i) => i.source === 'Government Supply')
      .reduce((sum, item) => sum + item.totalQuantity, 0);

    return res.status(200).json({
      success: true,
      summary: {
        totalAssets,
        communityDonated,
        govtSupplied,
        categoriesCount: 4,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add item directly to school inventory
 * @route   POST /api/inventory
 * @access  Private (Admin)
 */
export const addInventoryItem = async (req, res, next) => {
  try {
    const { itemName, category, location, totalQuantity, condition, source, assetTag, notes } = req.body;

    if (!itemName || !category) {
      return res.status(400).json({
        success: false,
        message: 'Item name and category are required',
      });
    }

    const newItem = {
      _id: `inv-${Date.now()}`,
      itemName,
      category,
      location: location || 'General Storage',
      totalQuantity: Number(totalQuantity) || 1,
      availableQuantity: Number(totalQuantity) || 1,
      condition: condition || 'Good',
      source: source || 'Government Supply',
      assetTag: assetTag || `GOV-AST-${Date.now().toString().slice(-4)}`,
      notes: notes || '',
      createdAt: new Date(),
    };

    store.inventory.unshift(newItem);

    return res.status(201).json({
      success: true,
      message: 'Asset successfully registered in school inventory',
      data: newItem,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update item in inventory
 * @route   PUT /api/inventory/:id
 * @access  Private (Admin)
 */
export const updateInventoryItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = store.inventory.find((i) => i._id.toString() === id.toString());
    if (item) {
      Object.assign(item, req.body);
      return res.status(200).json({ success: true, data: item });
    }
    return res.status(404).json({ success: false, message: 'Inventory item not found' });
  } catch (error) {
    next(error);
  }
};
