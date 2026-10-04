import { useWishlist } from '../context/WishlistContext.jsx';
import ListingCard from '../components/ListingCard.jsx';

export default function Wishlist() {
  const { items } = useWishlist();

  return (
    <section>
      <div className="hero">
        <h1>Your wishlist</h1>
        <p className="muted">Stays you have saved for later.</p>
      </div>

      {items.length === 0 ? (
        <p className="muted">No saved stays yet. Tap the ♡ on any listing to save it.</p>
      ) : (
        <div className="grid">
          {items.map((l) => <ListingCard key={l._id} listing={l} />)}
        </div>
      )}
    </section>
  );
}
