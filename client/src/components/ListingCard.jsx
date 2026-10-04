import { Link } from 'react-router-dom';
import { formatINR } from '../utils/format.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useWishlist } from '../context/WishlistContext.jsx';

export default function ListingCard({ listing }) {
  const { user } = useAuth();
  const { toggle, has } = useWishlist();
  const saved = has(listing._id);

  const onHeart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(listing._id).catch(() => {});
  };

  return (
    <Link to={`/stays/${listing._id}`} className="card listing-card">
      <img src={listing.images[0]} alt={listing.title} />
      {user && (
        <button
          type="button"
          className={saved ? 'wishlist-btn on' : 'wishlist-btn'}
          onClick={onHeart}
          aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'}
        >
          {saved ? '♥' : '♡'}
        </button>
      )}
      <div className="card-body">
        <div className="row-between">
          <span className="tag">{listing.type}</span>
          <span className="muted">
            {listing.reviewCount > 0 ? `★ ${listing.avgRating} (${listing.reviewCount})` : 'New'}
          </span>
        </div>
        <strong className="listing-title">{listing.title}</strong>
        <span className="muted">{listing.city}, {listing.state}</span>
        <span>
          <strong>{formatINR(listing.pricePerNight)}</strong> <span className="muted">/ night</span>
        </span>
      </div>
    </Link>
  );
}
