const ServiceBooking = require('../models/serviceBooking.model');
const ServiceProvider = require('../models/service.model');
const User = require('../models/user.model');
const cloudinary = require('../config/cloudinary');
const { sendNotificationToRecipients, notifyUser } = require('../utils/notificationDelivery');

const STATUSES = ['new', 'contacted', 'confirmed', 'completed', 'cancelled'];
const cleanBooking = (booking) => {
  const data = booking.toObject ? booking.toObject() : { ...booking };
  delete data.idPhotoUrl;
  delete data.idPhotoPublicId;
  return data;
};
const parseBodyValue = (value, fallback) => {
  if (value === undefined) return fallback;
  if (typeof value !== 'string') return value;
  try { return JSON.parse(value); } catch { return fallback; }
};

exports.createBooking = async (req, res) => {
  try {
    const body = req.body || {};
    const providerId = body.providerId;
    const selectedItems = parseBodyValue(body.selectedItems, []);
    const address = parseBodyValue(body.address, null);
    const preferredDate = body.preferredDate;
    const preferredTimeSlot = body.preferredTimeSlot;
    const startDate = body.startDate;
    const note = body.note;
    const extra = parseBodyValue(body.extra, {});
    if (!providerId || !address || !String(address.flatNo || '').trim() || !String(address.area || '').trim()) {
      return res.status(400).json({ message: 'Provider, flat/house number and area are required' });
    }
    const userId = req.user._id || req.user.id;
    const [user, provider] = await Promise.all([
      User.findById(userId).select('name phone role'),
      ServiceProvider.findById(providerId),
    ]);
    if (!provider || !provider.isActive) return res.status(404).json({ message: 'Provider not found' });
    const phone = String(user?.phone || '').replace(/\D/g, '').slice(-10);
    if (phone.length !== 10) return res.status(400).json({ message: 'Add a valid phone number to your profile before requesting a service' });
    if (!Array.isArray(selectedItems)) {
      return res.status(400).json({ message: 'Selected services are invalid' });
    }
    if (selectedItems.length === 0 && (provider.priceList || []).length > 0) {
      return res.status(400).json({ message: 'Choose at least one service' });
    }
    const picked = (selectedItems || []).map((selection) => {
      const item = (provider.priceList || []).find((p) => p.name === selection.name && p.type === selection.type);
      if (!item) throw new Error('A selected service is no longer available');
      const quantity = item.allowQuantity ? Math.min(99, Math.max(1, parseInt(selection.quantity, 10) || 1)) : 1;
      return {
        name: item.name,
        type: item.type,
        price: item.price,
        unit: item.unit || '',
        perUnit: item.perUnit || '',
        quantity,
        lineTotal: Number(item.price || 0) * quantity,
      };
    });
    if (picked.length === 0 && provider.category !== 'rent-agreement') {
      const legacyName = String(provider.priceNote || provider.price || 'Service request').trim();
      picked.push({ name: legacyName, type: 'one-time', price: 0, unit: '', perUnit: '', quantity: 1, lineTotal: 0 });
    }
    const total = picked.reduce((sum, item) => sum + Number(item.lineTotal || 0), 0);
    const hasMonthly = picked.some((item) => item.type === 'monthly');
    const hasOneTime = picked.some((item) => item.type === 'one-time') || picked.length === 0;
    const date = preferredDate ? new Date(preferredDate) : null;
    const monthlyStart = startDate ? new Date(startDate) : null;
    if (hasMonthly && (!monthlyStart || Number.isNaN(monthlyStart.getTime()))) return res.status(400).json({ message: 'Choose a valid start date' });
    if (hasOneTime && (!date || Number.isNaN(date.getTime()))) return res.status(400).json({ message: 'Choose a valid preferred date' });
    if (hasOneTime && !['morning', 'afternoon', 'evening'].includes(preferredTimeSlot)) return res.status(400).json({ message: 'Choose a preferred time slot' });
    const hasCoordinates = address.lat !== undefined && address.lat !== null && address.lat !== '' && address.lng !== undefined && address.lng !== null && address.lng !== '';
    const coordinates = hasCoordinates ? { lat: Number(address.lat), lng: Number(address.lng) } : {};
    if (Object.keys(coordinates).length && (!Number.isFinite(coordinates.lat) || !Number.isFinite(coordinates.lng) || Math.abs(coordinates.lat) > 90 || Math.abs(coordinates.lng) > 180)) {
      return res.status(400).json({ message: 'Invalid location coordinates' });
    }
    if (provider.category === 'rent-agreement' && (!String(extra.ownerName || '').trim() || !String(extra.tenantName || '').trim() || extra.monthlyRent === '' || extra.deposit === '' || !String(extra.startDate || '').trim())) {
      return res.status(400).json({ message: 'Complete the agreement details' });
    }
    const safeExtra = provider.category === 'rent-agreement' ? {
      ownerName: String(extra.ownerName || '').slice(0, 100),
      tenantName: String(extra.tenantName || '').slice(0, 100),
      monthlyRent: Math.max(0, Number(extra.monthlyRent) || 0),
      deposit: Math.max(0, Number(extra.deposit) || 0),
      startDate: String(extra.startDate || '').slice(0, 30),
    } : {};
    const booking = await ServiceBooking.create({
      provider: provider._id, category: provider.category, user: userId,
      name: user.name || 'Customer', phone, selectedItems: picked,
      totalEstimate: total,
      startDate: monthlyStart, preferredDate: date, preferredTimeSlot: hasOneTime ? preferredTimeSlot : '',
      address: {
        flatNo: String(address.flatNo).trim().slice(0, 100),
        building: String(address.building || '').trim().slice(0, 100),
        area: String(address.area).trim().slice(0, 100),
        landmark: String(address.landmark || '').trim().slice(0, 150),
        ...coordinates,
      },
      note: String(note || '').slice(0, 1000), extra: safeExtra,
      ...(req.file && provider.category === 'rent-agreement' && { idPhotoUrl: req.file.path, idPhotoPublicId: req.file.filename }),
    });
    try {
      const admins = await User.find({ role: 'admin' }).select('_id').lean();
      await sendNotificationToRecipients(admins.map((admin) => ({ id: admin._id, model: 'User' })), {
        type: 'service_request', title: 'New service request', message: 'A customer submitted a new service request.', actionUrl: '/admin/service-requests',
      });
    } catch (error) { console.error('SERVICE REQUEST NOTIFICATION ERROR:', error); }
    res.status(201).json({ request: cleanBooking(booking), requestId: booking._id, id: booking._id });
  } catch (error) {
    if (req.file?.filename) {
      try { await cloudinary.uploader.destroy(req.file.filename, { resource_type: 'image', type: 'authenticated', invalidate: true }); } catch (cleanupError) { console.error('SERVICE ID PHOTO CLEANUP ERROR:', cleanupError); }
    }
    if (error.message === 'A selected service is no longer available') return res.status(400).json({ message: error.message });
    console.error('createBooking error:', error);
    res.status(500).json({ message: 'Could not create request' });
  }
};

exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await ServiceBooking.find({ user: req.user._id || req.user.id }).populate('provider', 'name category subType').sort({ createdAt: -1 }).limit(50).lean();
    res.json(bookings.map(cleanBooking));
  } catch (error) {
    console.error('getMyBookings error:', error);
    res.status(500).json({ message: 'Could not load requests' });
  }
};

exports.getAllBookings = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status && STATUSES.includes(req.query.status)) filter.status = req.query.status;
    if (req.query.category) filter.category = req.query.category;
    const bookings = await ServiceBooking.find(filter).select('+idPhotoUrl +idPhotoPublicId').populate('provider', 'name contactNumber category').populate('user', 'name phone email').sort({ createdAt: -1 }).limit(300).lean();
    res.json(bookings.map((booking) => ({ ...booking, idPhotoUrl: booking.idPhotoPublicId ? cloudinary.url(booking.idPhotoPublicId, { type: 'authenticated', sign_url: true, secure: true }) : '' })));
  } catch (error) {
    console.error('getAllBookings error:', error);
    res.status(500).json({ message: 'Could not load requests' });
  }
};

exports.getNewBookingCount = async (req, res) => {
  try { res.json({ count: await ServiceBooking.countDocuments({ status: 'new' }) }); }
  catch (error) { res.status(500).json({ message: 'Could not load request count' }); }
};

exports.updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!STATUSES.includes(status)) return res.status(400).json({ message: 'Invalid status' });
    const booking = await ServiceBooking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Request not found' });
    const previousStatus = booking.status;
    booking.status = status;
    await booking.save();
    if (previousStatus !== status) {
      try {
        const statusLabel = status.replace(/_/g, ' ');
        await notifyUser(booking.user, {
          type: 'service_status',
          title: 'Service request update',
          body: `Your service request is now ${statusLabel}.`,
          link: '/profile?tab=activity',
        });
      } catch (notificationError) {
        console.error('SERVICE STATUS NOTIFICATION ERROR:', notificationError);
      }
    }
    res.json(cleanBooking(booking));
  } catch (error) {
    console.error('updateBookingStatus error:', error);
    res.status(500).json({ message: 'Could not update request' });
  }
};
