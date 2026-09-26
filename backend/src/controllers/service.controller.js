const ServiceProvider = require('../models/service.model');

const CATEGORIES = ['cleaning', 'packers', 'furniture', 'wifi', 'appliance-repair'];

exports.createProvider = async (req, res) => {
  try {
    const { category, name, area, city, contactNumber, priceNote, description } = req.body;

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

    const fields = ['name', 'area', 'city', 'contactNumber', 'priceNote', 'description', 'isActive'];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) provider[f] = req.body[f];
    });

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
