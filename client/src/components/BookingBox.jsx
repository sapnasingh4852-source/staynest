import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getErrorMessage } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatINR, nightsBetween } from '../utils/format.js';

export default function BookingBox({ listing }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ checkIn: '', checkOut: '', guests: 1 });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const nights = nightsBetween(form.checkIn, form.checkOut);
  const total = nights * listing.pricePerNight;
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  // today's date in YYYY-MM-DD format (local timezone)
  const todayISO = new Date().toLocaleDateString('en-CA'); // 'en-CA' gives YYYY-MM-DD

  // minimum check-out is the day after check-in
  const minCheckOut = form.checkIn
    ? new Date(new Date(form.checkIn).getTime() + 24 * 60 * 60 * 1000).toLocaleDateString('en-CA')
    : todayISO;

  const book = async (e) => {
    e.preventDefault();
    if (!user) return navigate('/login', { state: { from: `/stays/${listing._id}` } });
    setLoading(true);
    setError('');
    try {
      await api.post('/bookings', {
        listingId: listing._id,
        checkIn: form.checkIn,
        checkOut: form.checkOut,
        guests: Number(form.guests),
      });
      navigate('/trips', { state: { booked: true } });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="card booking-box" onSubmit={book}>
      <h3>
        {formatINR(listing.pricePerNight)} <span className="muted">/ night</span>
      </h3>
      <div className="row">
        <label className="grow">
          Check-in
          <input type="date" required value={form.checkIn} onChange={set('checkIn')} min={todayISO} />
        </label>
        <label className="grow">
          Check-out
          <input type="date" required value={form.checkOut} onChange={set('checkOut')} min={minCheckOut} />
        </label>
      </div>
      <label>
        Guests
        <input type="number" min="1" max={listing.maxGuests} value={form.guests} onChange={set('guests')} />
      </label>
      {nights > 0 && (
        <div className="row-between">
          <span>{formatINR(listing.pricePerNight)} × {nights} night{nights > 1 ? 's' : ''}</span>
          <strong>{formatINR(total)}</strong>
        </div>
      )}
      {error && <p className="error">{error}</p>}
      <button className="btn full" disabled={loading}>
        {loading ? 'Booking...' : 'Reserve'}
      </button>
      <p className="muted small">You won't be charged yet. The host will confirm your request.</p>
    </form>
  );
}
