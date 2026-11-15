const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Builds a createdAt range. "to" is inclusive of the whole day.
function dateRange(from, to) {
  if (!from && !to) return undefined;
  const range = {};
  if (from) range.$gte = new Date(from);
  if (to) {
    const end = new Date(to);
    if (/^\d{4}-\d{2}-\d{2}$/.test(to)) end.setUTCHours(23, 59, 59, 999);
    range.$lte = end;
  }
  return range;
}

const buildMeta = (page, limit, total) => ({
  page,
  limit,
  total,
  totalPages: Math.max(1, Math.ceil(total / limit)),
});

const SORTS = {
  newest: { createdAt: -1, _id: -1 },
  oldest: { createdAt: 1, _id: 1 },
  name_asc: { name: 1, _id: 1 },
  name_desc: { name: -1, _id: -1 },
};

// { age: null, name: "X" } -> { $set: { name: "X" }, $unset: { age: 1 } }
function toUpdateOps(body) {
  const $set = {};
  const $unset = {};
  for (const [key, value] of Object.entries(body)) {
    if (value === undefined) continue;
    if (value === null) $unset[key] = 1;
    else $set[key] = value;
  }
  return {
    ...(Object.keys($set).length ? { $set } : {}),
    ...(Object.keys($unset).length ? { $unset } : {}),
  };
}

module.exports = { escapeRegex, dateRange, buildMeta, SORTS, toUpdateOps };
