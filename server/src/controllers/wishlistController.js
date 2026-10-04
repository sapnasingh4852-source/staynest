import User from '../models/User.js';
import Listing from '../models/Listing.js';
import asyncHandler from '../utils/asyncHandler.js';

// GET /api/wishlist (current user's saved listings)
export const getWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate({
    path: 'wishlist',
    populate: { path: 'host', select: 'name' },
  });
  res.json(user.wishlist);
});

// POST /api/wishlist/:listingId (toggle save/unsave)
export const toggleWishlist = asyncHandler(async (req, res) => {
  const listing = await Listing.findById(req.params.listingId);
  if (!listing) {
    res.status(404);
    throw new Error('Listing not found');
  }

  const user = await User.findById(req.user._id);
  const index = user.wishlist.findIndex((id) => id.equals(listing._id));
  const added = index === -1;
  if (added) {
    user.wishlist.push(listing._id);
  } else {
    user.wishlist.splice(index, 1);
  }
  await user.save();

  res.json({ wishlist: user.wishlist, added });
});
