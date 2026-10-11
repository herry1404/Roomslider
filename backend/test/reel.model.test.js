const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const Reel = require("../src/models/Reel");

const validReel = () => new Reel({
  owner: new mongoose.Types.ObjectId(),
  videoUrl: "https://res.cloudinary.com/demo/video/upload/reel.mp4",
  videoPublicId: "roomslider/reels/reel",
  thumbnailUrl: "https://res.cloudinary.com/demo/video/upload/reel.jpg",
});

test("reels default to active with zero likes", async () => {
  const reel = validReel();
  assert.equal(reel.status, "active");
  assert.equal(reel.likes, 0);
  assert.equal(reel.room, null);
  await reel.validate();
});

test("reels reject captions over 300 characters and invalid statuses", async () => {
  const reel = validReel();
  reel.caption = "x".repeat(301);
  reel.status = "deleted";
  await assert.rejects(reel.validate(), (error) => {
    assert.ok(error.errors.caption);
    assert.ok(error.errors.status);
    return true;
  });
});

test("reels require a video URL and owner", async () => {
  const reel = new Reel({ thumbnailUrl: "https://example.com/reel.jpg" });
  await assert.rejects(reel.validate(), (error) => {
    assert.ok(error.errors.owner);
    assert.ok(error.errors.videoUrl);
    return true;
  });
});
