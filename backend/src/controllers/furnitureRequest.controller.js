const mongoose = require('mongoose');
const FurnitureItem = require('../models/furnitureItem.model');
const FurnitureRequest = require('../models/furnitureRequest.model');
const User = require('../models/user.model');
const { sendNotificationToRecipients, notifyUser } = require('../utils/notificationDelivery');

const isAdmin = (req) => req.user && req.user.role === 'admin';
const STATUSES = ['new', 'confirmed', 'delivered', 'cancelled'];

exports.createRequest = async (req, res) => {
  try {
    const { items, address, location, deliveryDate } = req.body;

    if (!Array.isArray(items) || items.length === 0 || items.length > 30) {
      return res.status(400).json({ message: 'Cart is empty' });
    }
    if (!address || !String(address.house || '').trim() || !String(address.area || '').trim()) {
      return res.status(400).json({ message: 'House/flat number and area are required' });
    }

    const phoneRaw = req.user.phone || req.body.phone || '';
    const phone = String(phoneRaw).replace(/\D/g, '').slice(-10);
    if (phone.length !== 10) {
      return res.status(400).json({ message: 'A valid 10 digit phone number is required' });
    }

    const ids = items.map((l) => String(l.itemId)).filter((x) => mongoose.isValidObjectId(x));
    const found = await FurnitureItem.find({ _id: { $in: ids } }).lean();
    const map = new Map(found.map((i) => [String(i._id), i]));

    const lines = [];
    for (const l of items) {
      const it = map.get(String(l.itemId));
      if (!it || !it.isActive) return res.status(400).json({ message: 'An item is no longer available' });
      if (!it.isAvailable) return res.status(400).json({ message: it.name + ' is out of stock' });

      const qty = Math.min(20, Math.max(1, parseInt(l.qty, 10) || 1));

      if (l.mode === 'rent') {
        const plan = (it.rentPlans || []).find((p) => p.months === Number(l.months));
        if (!plan) return res.status(400).json({ message: 'Invalid rent plan for ' + it.name });
        lines.push({
          item: it._id, name: it.name, mode: 'rent', months: plan.months, cond: 'new',
          unit: plan.monthlyRent, deposit: it.deposit || 0, delivery: it.deliveryFee || 0, qty,
        });
      } else {
        const used = l.cond === 'used' && Number(it.secondHandPrice) > 0;
        const price = used ? it.secondHandPrice : it.buyPrice;
        if (!(Number(price) > 0)) return res.status(400).json({ message: 'Buy not available for ' + it.name });
        lines.push({
          item: it._id, name: it.name, mode: 'buy', months: 0, cond: used ? 'used' : 'new',
          unit: price, deposit: 0, delivery: it.deliveryFee || 0, qty,
        });
      }
    }

    const totals = { rentMonthly: 0, deposit: 0, buyTotal: 0, delivery: 0, initial: 0 };
    lines.forEach((l) => {
      totals.delivery += l.delivery * l.qty;
      if (l.mode === 'rent') {
        totals.rentMonthly += l.unit * l.qty;
        totals.deposit += l.deposit * l.qty;
      } else {
        totals.buyTotal += l.unit * l.qty;
      }
    });
    totals.initial = totals.rentMonthly + totals.deposit + totals.buyTotal + totals.delivery;

    let loc = { lat: null, lng: null };
    let mapsLink = '';
    const lat = Number(location && location.lat);
    const lng = Number(location && location.lng);
    if (location && isFinite(lat) && isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      loc = { lat, lng };
      mapsLink = 'https://www.google.com/maps?q=' + lat + ',' + lng;
    }

    const requestCode =
      'FR-' + (Date.now().toString(36) + Math.random().toString(36).slice(2, 4)).toUpperCase().slice(-6);

    const doc = await FurnitureRequest.create({
      requestCode,
      user: req.user._id,
      name: req.user.name || 'Customer',
      phone,
      items: lines,
      totals,
      address: {
        house: String(address.house).trim(),
        building: String(address.building || '').trim(),
        area: String(address.area).trim(),
        landmark: String(address.landmark || '').trim(),
        city: String(address.city || 'Indore').trim(),
        state: String(address.state || 'Madhya Pradesh').trim(),
        postalCode: /^\d{6}$/.test(String(address.postalCode || ''))
          ? String(address.postalCode)
          : '',
      },
      location: loc,
      mapsLink,
      deliveryDate: String(deliveryDate || ''),
    });

    try {
      const admins = await User.find({ role: 'admin' }).select('_id').lean();
      await sendNotificationToRecipients(admins.map((admin) => ({ id: admin._id, model: 'User' })), {
        type: 'service_request',
        title: 'New furniture request',
        message: 'A customer submitted a new furniture request.',
        actionUrl: '/admin/furniture/requests',
      });
    } catch (error) {
      console.error('FURNITURE REQUEST NOTIFICATION ERROR:', error);
    }
    res.status(201).json(doc);
  } catch (error) {
    console.error('createRequest error:', error);
    res.status(500).json({ message: 'Could not save request' });
  }
};

exports.getMyRequests = async (req, res) => {
  try {
    const list = await FurnitureRequest.find({ user: req.user._id }).sort({ createdAt: -1 }).lean();
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: 'Could not load requests' });
  }
};

exports.getAllRequests = async (req, res) => {
  try {
    if (!isAdmin(req)) return res.status(403).json({ message: 'Admin only' });
    const filter = {};
    if (req.query.status && STATUSES.includes(req.query.status)) filter.status = req.query.status;
    const list = await FurnitureRequest.find(filter).sort({ createdAt: -1 }).lean();
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: 'Could not load requests' });
  }
};

exports.updateRequestStatus = async (req, res) => {
  try {
    if (!isAdmin(req)) return res.status(403).json({ message: 'Admin only' });
    const { status, adminNote } = req.body;
    if (status !== undefined && !STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const doc = await FurnitureRequest.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Request not found' });
    const previousStatus = doc.status;
    if (status !== undefined) doc.status = status;
    if (adminNote !== undefined) doc.adminNote = String(adminNote);
    await doc.save();
    if (status !== undefined && status !== previousStatus) {
      try {
        await notifyUser(doc.user, {
          type: 'furniture_status',
          title: 'Furniture request update',
          body: `Your furniture request is now ${status.replace(/_/g, ' ')}.`,
          link: '/profile?tab=activity',
        });
      } catch (error) {
        console.error('FURNITURE STATUS NOTIFICATION ERROR:', error);
      }
    }
    res.json(doc);
  } catch (error) {
    res.status(500).json({ message: 'Could not update request' });
  }
};
