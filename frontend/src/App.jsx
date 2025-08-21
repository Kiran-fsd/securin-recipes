// src/App.jsx
import { useEffect, useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000/api";

const pageSizeOptions = [15, 25, 50];

const initSearch = {
  title: "",
  cuisine: "",
  calories: "",
  rating: "",
  total_time: "",
};

export default function App() {
  // list & paging
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(pageSizeOptions[0]);
  const [data, setData] = useState({ total: 0, items: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // filters
  const [search, setSearch] = useState(initSearch);
  const [cuisines, setCuisines] = useState([]);

  // drawer
  const [drawerItem, setDrawerItem] = useState(null);

  // build URL for plain list endpoint
  const listUrl = useMemo(() => {
    const u = new URL(`${API_BASE}/recipes`);
    u.searchParams.set("page", page);
    u.searchParams.set("limit", pageSize);
    return u.toString();
  }, [page, pageSize]);

  // load list
  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(listUrl);
        const json = await res.json();
        if (!active) return;
        setData({
          total: json.total ?? 0,
          items: Array.isArray(json.data) ? json.data : [],
        });
      } catch (e) {
        if (!active) return;
        setError("Failed to load recipes.");
        setData({ total: 0, items: [] });
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [listUrl]);

  // cuisines (for dropdown)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/recipes/cuisines`);
        const json = await res.json();
        if (Array.isArray(json.cuisines)) setCuisines(json.cuisines);
      } catch {}
    })();
  }, []);

  const totalPages = Math.max(
    1,
    Math.ceil((data.total || 0) / (pageSize || 1))
  );

  // build /search URL from current filters
  const buildSearchUrl = () => {
    const u = new URL(`${API_BASE}/recipes/search`);
    if (search.title.trim()) u.searchParams.set("title", search.title.trim());
    if (search.cuisine.trim())
      u.searchParams.set("cuisine", search.cuisine.trim());
    if (search.calories) u.searchParams.set("calories", `<=${search.calories}`);
    if (search.rating) u.searchParams.set("rating", `>=${search.rating}`);
    if (search.total_time)
      u.searchParams.set("total_time", `<=${search.total_time}`);
    return u.toString();
  };

  // run /search and replace list content
  const runSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(buildSearchUrl());
      const json = await res.json();
      setData({
        total: json.data?.length ?? 0,
        items: json.data ?? [],
      });
      setPage(1);
    } catch (e2) {
      setError("Search failed.");
    } finally {
      setLoading(false);
    }
  };

  const resetSearch = () => {
    setSearch(initSearch);
    setPage(1);
    // trigger list reload by nudging page (toggle to same page keeps memo stable)
    setTimeout(() => setPage((p) => (p === 1 ? 2 : 1)), 0);
    setTimeout(() => setPage(1), 0);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">Securin Recipes</h1>
          <a
            href={API_BASE}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-gray-500"
            title="Backend base"
          >
            Backend: {API_BASE}
          </a>
        </div>

        {/* search form */}
        <form
          onSubmit={runSearch}
          className="grid grid-cols-5 gap-3 items-end mb-4"
        >
          <div className="col-span-1">
            <label className="sr-only">Title</label>
            <input
              value={search.title}
              onChange={(e) =>
                setSearch((s) => ({ ...s, title: e.target.value }))
              }
              placeholder="Title contains..."
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            />
          </div>

          <div className="col-span-1">
            <label className="sr-only">Cuisine</label>
            <select
              value={search.cuisine}
              onChange={(e) =>
                setSearch((s) => ({ ...s, cuisine: e.target.value }))
              }
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">Cuisine (any)</option>
              {cuisines.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-1">
            <label className="sr-only">Calories ≤</label>
            <input
              value={search.calories}
              onChange={(e) =>
                setSearch((s) => ({ ...s, calories: e.target.value }))
              }
              placeholder="Calories ≤"
              type="number"
              min="0"
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            />
          </div>

          <div className="col-span-1">
            <label className="sr-only">Rating ≥</label>
            <input
              value={search.rating}
              onChange={(e) =>
                setSearch((s) => ({ ...s, rating: e.target.value }))
              }
              placeholder="Rating ≥"
              type="number"
              min="0"
              step="0.1"
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            />
          </div>

          <div className="col-span-1">
            <label className="sr-only">Total time ≤</label>
            <input
              value={search.total_time}
              onChange={(e) =>
                setSearch((s) => ({ ...s, total_time: e.target.value }))
              }
              placeholder="Total time ≤ (mins)"
              type="number"
              min="0"
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            />
          </div>

          <div className="col-span-5 flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm"
            >
              Search
            </button>
            <button
              type="button"
              onClick={resetSearch}
              className="px-4 py-2 rounded-md bg-gray-200 text-sm"
            >
              Reset
            </button>
          </div>
        </form>

        {/* status row */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <div>{data.total} results</div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span>Per page</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="rounded-md border border-gray-300 bg-white px-2 py-1"
              >
                {pageSizeOptions.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="px-2 py-1 rounded border border-gray-300 disabled:opacity-50"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </button>
              <span>
                Page {page} / {totalPages}
              </span>
              <button
                className="px-2 py-1 rounded border border-gray-300 disabled:opacity-50"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* list */}
        {error && (
          <div className="mb-3 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-800">
            {error}
          </div>
        )}

        {!loading && data.items.length === 0 && (
          <div className="rounded-lg border border-gray-200 bg-white px-4 py-6 text-sm text-gray-500">
            No recipes found. Try adjusting your filters.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.items.map((r) => (
            <button
              key={r._id}
              onClick={() => setDrawerItem(r)}
              className="text-left rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm hover:shadow transition"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium truncate" title={r.title}>
                    {r.title}
                  </h3>
                  <p className="text-xs text-gray-500">{r.cuisine}</p>
                </div>
                <div className="text-[10px] text-gray-500">
                  <div className="flex items-center gap-1 justify-end">
                    <span>★</span>
                    <span>{r.rating ?? "-"}</span>
                  </div>
                  <div className="text-right">Total {r.total_time ?? "-"} min</div>
                </div>
              </div>
              {r.description && (
                <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                  {r.description}
                </p>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* drawer */}
      {drawerItem && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setDrawerItem(null)}
          />
          <div className="absolute right-0 top-0 h-full w-full sm:w-[440px] bg-white shadow-xl overflow-y-auto">
            <div className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-semibold leading-tight">
                    {drawerItem.title}
                  </h2>
                  <p className="text-sm text-gray-500">{drawerItem.cuisine}</p>
                </div>
                <button
                  className="text-sm text-rose-600"
                  onClick={() => setDrawerItem(null)}
                >
                  Close ✕
                </button>
              </div>

              {/* description */}
              {drawerItem.description && (
                <div className="mt-4">
                  <h3 className="font-semibold">Description</h3>
                  <p className="text-sm text-gray-700 mt-1">
                    {drawerItem.description}
                  </p>
                </div>
              )}

              {/* time */}
              <div className="mt-4">
                <h3 className="font-semibold">Time</h3>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <Info label="Total" value={`${drawerItem.total_time ?? "-"} min`} />
                  <Info label="Cook" value={`${drawerItem.cook_time ?? "-"} min`} />
                  <Info label="Prep" value={`${drawerItem.prep_time ?? "-"} min`} />
                </div>
              </div>

              {/* nutrition */}
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Nutrition</h3>
                {drawerItem.nutrients ? (
                  <div className="grid grid-cols-2 gap-2">
                    <Row
                      k="Calories"
                      v={
                        drawerItem.nutrients.calories != null
                          ? `${drawerItem.nutrients.calories} kcal`
                          : "—"
                      }
                    />
                    <Row
                      k="Carbohydrate"
                      v={
                        drawerItem.nutrients.carbohydrateContent != null
                          ? `${drawerItem.nutrients.carbohydrateContent} g`
                          : "—"
                      }
                    />
                    <Row
                      k="Cholesterol"
                      v={
                        drawerItem.nutrients.cholesterolContent != null
                          ? `${drawerItem.nutrients.cholesterolContent} mg`
                          : "—"
                      }
                    />
                    <Row
                      k="Fiber"
                      v={
                        drawerItem.nutrients.fiberContent != null
                          ? `${drawerItem.nutrients.fiberContent} g`
                          : "—"
                      }
                    />
                    <Row
                      k="Protein"
                      v={
                        drawerItem.nutrients.proteinContent != null
                          ? `${drawerItem.nutrients.proteinContent} g`
                          : "—"
                      }
                    />
                    <Row
                      k="Saturated Fat"
                      v={
                        drawerItem.nutrients.saturatedFatContent != null
                          ? `${drawerItem.nutrients.saturatedFatContent} g`
                          : "—"
                      }
                    />
                    <Row
                      k="Sodium"
                      v={
                        drawerItem.nutrients.sodiumContent != null
                          ? `${drawerItem.nutrients.sodiumContent} mg`
                          : "—"
                      }
                    />
                    <Row
                      k="Sugar"
                      v={
                        drawerItem.nutrients.sugarContent != null
                          ? `${drawerItem.nutrients.sugarContent} g`
                          : "—"
                      }
                    />
                    <Row
                      k="Fat"
                      v={
                        drawerItem.nutrients.fatContent != null
                          ? `${drawerItem.nutrients.fatContent} g`
                          : "—"
                      }
                    />
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    No nutrition info available.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* small UI helpers */
function Info({ label, value }) {
  return (
    <div className="rounded-lg border px-3 py-2">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

function Row({ k, v }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-600">{k}</span>
      <span className="font-medium">{v}</span>
    </div>
  );
}
