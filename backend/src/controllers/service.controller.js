const ServiceProvider = require('../models/service.model');

const CATEGORIES = ['cleaning', 'packers', 'furniture', 'wifi', 'appliance-repair', 'study-support', 'rent-agreement'];
const parsePriceList = (value) => {
  if (value === undefined) return undefined;
  return typeof value === 'string' ? JSON.parse(value) : value;
};
const parseStringList = (value) => {
  if (value === undefined) return undefined;
  const parsed = typeof value === 'string' ? JSON.parse(value) : value;
  return Array.isArray(parsed) ? parsed.map((item) => String(item).trim()).filter(Boolean) : [];
};
const parseBoolean = (value) => value === true || value === 'true';

exports.createProvider = async (req, res) => {
  try {
    const { category, name, area, city, contactNumber, priceNote, description, subType, experienceYears, availability } = req.body;
    const priceList = parsePriceList(req.body.priceList);
    const languages = parseStringList(req.body.languages);
    const serviceAreas = parseStringList(req.body.serviceAreas);

    if (!CATEGORIES.includes(category)) {
      return res.status(400).json({ message: 'Invalid category' });
    }
    if (!name || !area || !contactNumber) {
      return res.status(400).json({ message: 'Name, area and contact number are required' });
    }

    const images = (req.files || []).map((f) => f.path || f.secure_url || f.location).filter(Boolean);

    const provider = await ServiceProvider.create({
      category,
      name,
      area,
      city: city || 'Indore',
      contactNumber,
      priceNote: priceNote || '',
      subType: subType || '',
      ...(priceList !== undefined && { priceList }),
      ...(languages !== undefined && { languages }),
      ...(serviceAreas !== undefined && { serviceAreas }),
      ...(experienceYears !== undefined && experienceYears !== '' && { experienceYears: Number(experienceYears) }),
      availability: availability || '',
      ...(req.user?.role === 'admin' && req.body.isVerified !== undefined && { isVerified: parseBoolean(req.body.isVerified) }),
      description: description || '',
      images,
    });

    res.status(201).json(provider);
  } catch (error) {
    console.error('createProvider error:', error);
    res.status(500).json({ message: 'Could not add provider' });
  }
};

// PUBLIC: providers of one category
exports.getProvidersByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    if (!CATEGORIES.includes(category)) {
      return res.status(400).json({ message: 'Invalid category' });
    }
    const providers = await ServiceProvider.find({ category, isActive: true })
      .sort({ createdAt: -1 })
      .lean();
    res.json(providers);
  } catch (error) {
    console.error('getProvidersByCategory error:', error);
    res.status(500).json({ message: 'Could not load providers' });
  }
};

// ADMIN: all providers, optional ?category=
exports.getAllProviders = async (req, res) => {
  try {
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    const providers = await ServiceProvider.find(filter).sort({ createdAt: -1 }).lean();
    res.json(providers);
  } catch (error) {
    console.error('getAllProviders error:', error);
    res.status(500).json({ message: 'Could not load providers' });
  }
};

exports.updateProvider = async (req, res) => {
  try {
    const provider = await ServiceProvider.findById(req.params.id);
    if (!provider) return res.status(404).json({ message: 'Provider not found' });

    const fields = ['name', 'area', 'city', 'contactNumber', 'priceNote', 'description', 'isActive', 'subType', 'experienceYears', 'availability'];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) provider[f] = req.body[f];
    });
    if (req.body.priceList !== undefined) provider.priceList = parsePriceList(req.body.priceList);
    if (req.body.languages !== undefined) provider.languages = parseStringList(req.body.languages);
    if (req.body.serviceAreas !== undefined) provider.serviceAreas = parseStringList(req.body.serviceAreas);
    if (req.user?.role === 'admin' && req.body.isVerified !== undefined) provider.isVerified = parseBoolean(req.body.isVerified);

    await provider.save();
    res.json(provider);
  } catch (error) {
    console.error('updateProvider error:', error);
    res.status(500).json({ message: 'Could not update provider' });
  }
};

exports.deleteProvider = async (req, res) => {
  try {
    const provider = await ServiceProvider.findByIdAndDelete(req.params.id);
    if (!provider) return res.status(404).json({ message: 'Provider not found' });
    res.json({ message: 'Deleted' });
  } catch (error) {
    console.error('deleteProvider error:', error);
    res.status(500).json({ message: 'Could not delete provider' });
  }
};
