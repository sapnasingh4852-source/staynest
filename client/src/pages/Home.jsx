import { useEffect, useState } from 'react';
import api, { getErrorMessage } from '../api/client.js';
import ListingCard from '../components/ListingCard.jsx';
import Loader from '../components/Loader.jsx';
import { STAY_TYPES } from '../utils/format.js';

const initial = { city: '', type: '', guests: '', maxPrice: '' };
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'rating', label: 'Top rated' },
];

export default function Home() {
  const [filters, setFilters] = useState(initial);
  const [sort, setSort] = useState('newest');
  const [listings, setListings] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const search = (params, sortValue, pageValue) => {
    setLoading(true);
    setError('');
    const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== ''));
    api
      .get('/listings', { params: { ...clean, sort: sortValue, page: pageValue } })
      .then(({ data }) => {
        setListings(data.listings);
        setMeta({ page: data.page, totalPages: data.totalPages, total: data.total });
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    search(initial, 'newest', 1);
  }, []);

  const set = (key) => (e) => setFilters({ ...filters, [key]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    search(filters, sort, 1);
  };

  const changeSort = (value) => {
    setSort(value);
    search(filters, value, 1);
  };

  const goToPage = (next) => search(filters, sort, next);

  return (
    <section>
      <div className="hero">
        <h1>Find your next nest.</h1>
        <p className="muted">Homestays, havelis, villas and hostels across India.</p>
        <form className="search-bar card" onSubmit={submit}>
          <input placeholder="Where to? (e.g. Jaipur)" value={filters.city} onChange={set('city')} />
          <select value={filters.type} onChange={set('type')}>
            <option value="">Any type</option>
            {STAY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <input type="number" min="1" placeholder="Guests" value={filters.guests} onChange={set('guests')} />
          <input type="number" min="0" placeholder="Max ₹/night" value={filters.maxPrice} onChange={set('maxPrice')} />
          <button className="btn">Search</button>
        </form>
      </div>

      <div className="results-bar">
        <p className="muted">{meta.total} stay{meta.total === 1 ? '' : 's'} found</p>
        <label className="muted small">
          Sort by{' '}
          <select value={sort} onChange={(e) => changeSort(e.target.value)}>
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </label>
      </div>

      {error && <p className="error">{error}</p>}
      {loading ? (
        <Loader />
      ) : listings.length === 0 ? (
        <p className="muted">No stays match your search.</p>
      ) : (
        <div className="grid">
          {listings.map((l) => <ListingCard key={l._id} listing={l} />)}
        </div>
      )}

      {meta.totalPages > 1 && (
        <div className="pagination">
          <button className="btn btn-ghost" disabled={meta.page <= 1} onClick={() => goToPage(meta.page - 1)}>
            Previous
          </button>
          <span className="muted">Page {meta.page} of {meta.totalPages}</span>
          <button className="btn btn-ghost" disabled={meta.page >= meta.totalPages} onClick={() => goToPage(meta.page + 1)}>
            Next
          </button>
        </div>
      )}
    </section>
  );
}
