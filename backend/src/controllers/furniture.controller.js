const FurnitureItem = require('../models/furnitureItem.model');

const CATEGORIES = FurnitureItem.CATEGORIES;

const parseJSON = (v, fallback) => {
  if (v === undefined) return fallback;
  if (typeof v !== 'string') return v;
  try {
    return JSON.parse(v);
  } catch (e) {
    return fallback;
  }
};
const toNum = (v) => (v === '' || v === null || v === undefined ? null : Number(v));
const toBool = (v) => v === true || v === 'true';

const cleanPlans = (plans) =>
  (Array.isArray(plans) ? plans : [])
    .map((p) => ({ months: Number(p.months), monthlyRent: Number(p.monthlyRent) }))
    .filter((p) => p.months > 0 && p.monthlyRent > 0)
    .sort((a, b) => a.months - b.months);

// PUBLIC: active items, optional ?category=
exports.getItems = async (req, res) => {
  try {
    const filter = { isActive: true };
    if (req.query.category && req.query.category !== 'all') filter.category = req.query.category;
    if (req.query.donated === "true") filter.isDonated = true;
    if (req.query.donated === "false") filter.isDonated = false;
    const items = await FurnitureItem.find(filter).select("-donatedBy").sort({ createdAt: -1 }).lean();
    res.json(items);
  } catch (error) {
    console.error('getItems error:', error);
    res.status(500).json({ message: 'Could not load items' });
  }
};

// ADMIN: all items (including hidden)
exports.getAllItems = async (req, res) => {
  try {
    let query = FurnitureItem.find({}).sort({ createdAt: -1 });
    if (req.user?.role === "admin") query = query.select("+donatedBy");
    const items = await query.lean();
    res.json(items);
  } catch (error) {
    console.error('getAllItems error:', error);
    res.status(500).json({ message: 'Could not load items' });
  }
};

exports.getItemById = async (req, res) => {
  try {
    const item = await FurnitureItem.findOne({ _id: req.params.id, isActive: true }).select("-donatedBy").lean();
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json(item);
  } catch (error) {
    res.status(404).json({ message: 'Item not found' });
  }
};

exports.getAdminItemById = async (req, res) => {
  try {
    const item = await FurnitureItem.findById(req.params.id).select("+donatedBy").lean();
    if (!item) return res.status(404).json({ message: "Item not found" });
    res.json(item);
  } catch {
    res.status(404).json({ message: "Item not found" });
  }
};

exports.createItem = async (req, res) => {
  try {
    const b = req.body;
    if (!b.name || !CATEGORIES.includes(b.category)) {
      return res.status(400).json({ message: 'Name and a valid category are required' });
    }
    const rentPlans = cleanPlans(parseJSON(b.rentPlans, []));
    const buyPrice = toNum(b.buyPrice);
    if (rentPlans.length === 0 && !buyPrice) {
      return res.status(400).json({ message: 'Add at least a rent plan or a buy price' });
    }
    const images = (req.files || []).map((f) => f.path || f.secure_url || f.location).filter(Boolean);

    const item = await FurnitureItem.create({
      name: b.name,
      category: b.category,
      description: b.description || '',
      images,
      rentPlans,
      deposit: Number(b.deposit) || 0,
      buyPrice,
      secondHandPrice: toNum(b.secondHandPrice),
      deliveryFee: Number(b.deliveryFee) || 0,
      isAvailable: b.isAvailable === undefined ? true : toBool(b.isAvailable),
      isActive: b.isActive === undefined ? true : toBool(b.isActive),
      badge: b.badge || '',
      isDonated: req.user?.role === "admin" && toBool(b.isDonated),
    });
    res.status(201).json(item);
  } catch (error) {
    console.error('createItem error:', error);
    res.status(500).json({ message: 'Could not add item' });
  }
};

exports.updateItem = async (req, res) => {
  try {
    const item = await FurnitureItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    const b = req.body;

    ['name', 'description', 'badge'].forEach((f) => {
      if (b[f] !== undefined) item[f] = b[f];
    });
    if (b.category !== undefined && CATEGORIES.includes(b.category)) item.category = b.category;
    if (b.deposit !== undefined) item.deposit = Number(b.deposit) || 0;
    if (b.deliveryFee !== undefined) item.deliveryFee = Number(b.deliveryFee) || 0;
    if (b.buyPrice !== undefined) item.buyPrice = toNum(b.buyPrice);
    if (b.secondHandPrice !== undefined) item.secondHandPrice = toNum(b.secondHandPrice);
    if (b.isAvailable !== undefined) item.isAvailable = toBool(b.isAvailable);
    if (b.isActive !== undefined) item.isActive = toBool(b.isActive);
    if (req.user?.role === "admin" && b.isDonated !== undefined) item.isDonated = toBool(b.isDonated);
    if (req.user?.role === "admin" && b.donatedBy !== undefined) item.donatedBy = b.donatedBy || null;
    if (b.rentPlans !== undefined) item.rentPlans = cleanPlans(parseJSON(b.rentPlans, []));

    // existingImages = list of old image URLs to keep; new uploads get appended
    if (b.existingImages !== undefined) item.images = parseJSON(b.existingImages, item.images);
    const newImages = (req.files || []).map((f) => f.path || f.secure_url || f.location).filter(Boolean);
    if (newImages.length) item.images = [...item.images, ...newImages];

    await item.save();
    res.json(item);
  } catch (error) {
    console.error('updateItem error:', error);
    res.status(500).json({ message: 'Could not update item' });
  }
};

exports.deleteItem = async (req, res) => {
  try {
    const item = await FurnitureItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json({ message: 'Deleted' });
  } catch (error) {
    console.error('deleteItem error:', error);
    res.status(500).json({ message: 'Could not delete item' });
  }
};
