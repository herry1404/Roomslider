require('dotenv').config();
const mongoose = require('mongoose');
const Owner = require('./src/models/Owner');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const owners = await Owner.find({
    $or: [{ slug: { $exists: false } }, { slug: null }, { slug: '' }],
  });
  console.log('Slug chahiye:', owners.length, 'owners');
  for (const o of owners) {
    o.slug = undefined;
    await o.save();
    console.log(o.name, '->', o.slug);
  }
  await mongoose.disconnect();
  console.log('Done');
})().catch((e) => { console.error(e); process.exit(1); });
