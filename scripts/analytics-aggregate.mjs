/** Vercel returns custom-data grouping names as literal slash-delimited keys. */
export function parseEpisodeAggregate(rows) {
  if (!Array.isArray(rows)) throw new Error('Invalid episode aggregate');
  return rows.map(row => {
    const episodeId = row?.['eventData/episode'];
    if (typeof episodeId !== 'string' || !/^[a-z0-9][a-z0-9-]{0,63}$/.test(episodeId)) {
      throw new Error('Unrecognized analytics episode aggregate; observation was not stored');
    }
    if (!Number.isSafeInteger(row.count) || row.count < 0) throw new Error('Invalid episode aggregate count');
    return { episodeId, count: row.count };
  });
}
