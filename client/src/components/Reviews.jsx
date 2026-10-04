import { useEffect, useState } from 'react';
import api, { getErrorMessage } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import StarRating from './StarRating.jsx';
import { formatDate } from '../utils/format.js';

export default function Reviews({ listingId, onReviewAdded }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [form, setForm] = useState({ rating: 5, comment: '' });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ rating: 5, comment: '' });
  const [error, setError] = useState('');

  const load = () => api.get(`/listings/${listingId}/reviews`).then(({ data }) => setReviews(data));
  useEffect(() => {
    load();
  }, [listingId]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post(`/listings/${listingId}/reviews`, form);
      setForm({ rating: 5, comment: '' });
      load();
      onReviewAdded?.();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const startEdit = (r) => {
    setEditingId(r._id);
    setEditForm({ rating: r.rating, comment: r.comment });
    setError('');
  };

  const saveEdit = async (e, r) => {
    e.preventDefault();
    setError('');
    try {
      await api.put(`/listings/${listingId}/reviews/${r._id}`, editForm);
      setEditingId(null);
      load();
      onReviewAdded?.();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const remove = async (r) => {
    if (!window.confirm('Delete your review?')) return;
    setError('');
    try {
      await api.delete(`/listings/${listingId}/reviews/${r._id}`);
      load();
      onReviewAdded?.();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const alreadyReviewed = reviews.some((r) => r.user?._id === user?._id);

  return (
    <section className="reviews">
      <h2>Reviews ({reviews.length})</h2>
      {reviews.length === 0 && <p className="muted">No reviews yet.</p>}
      {reviews.map((r) => (
        <div key={r._id} className="review">
          <div className="row-between">
            <strong>{r.user?.name}</strong>
            <span className="muted small">{formatDate(r.createdAt)}</span>
          </div>
          {editingId === r._id ? (
            <form className="form" onSubmit={(e) => saveEdit(e, r)}>
              <StarRating value={editForm.rating} onChange={(rating) => setEditForm({ ...editForm, rating })} />
              <textarea
                required
                value={editForm.comment}
                onChange={(e) => setEditForm({ ...editForm, comment: e.target.value })}
              />
              <div className="row">
                <button className="btn">Save</button>
                <button type="button" className="btn btn-ghost" onClick={() => setEditingId(null)}>
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="stars-static">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
              <p>{r.comment}</p>
              {user && r.user?._id === user._id && (
                <div className="row">
                  <button className="btn btn-ghost" onClick={() => startEdit(r)}>Edit</button>
                  <button className="btn btn-danger" onClick={() => remove(r)}>Delete</button>
                </div>
              )}
            </>
          )}
        </div>
      ))}

      {user && !alreadyReviewed && (
        <form className="card form" onSubmit={submit}>
          <h3>Write a review</h3>
          <StarRating value={form.rating} onChange={(rating) => setForm({ ...form, rating })} />
          <textarea
            required
            placeholder="How was your stay?"
            value={form.comment}
            onChange={(e) => setForm({ ...form, comment: e.target.value })}
          />
          {error && <p className="error">{error}</p>}
          <button className="btn">Submit review</button>
        </form>
      )}
    </section>
  );
}
