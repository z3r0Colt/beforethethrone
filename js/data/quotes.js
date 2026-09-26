/*
 * Short quotations on prayer from Reformed and Puritan writers, shown in the
 * "From the Puritans" card on Today.
 *
 * Rules for this list:
 *  - Public-domain authors and works only (published before 1929).
 *  - Verbatim only. Each quote is one or two whole sentences, never trimmed
 *    mid-sentence, never paraphrased or modernized. Spelling and punctuation
 *    follow the named edition.
 *  - Every entry was checked word for word against two independent full-text
 *    copies of the work (not quote aggregators). A line whose wording differs
 *    between editions, or that could not be matched in a full text of a
 *    pre-1929 printing, is left out, even when it is well known. A short list
 *    is better than a wrong one.
 *
 * Evidence for every entry below (J. C. Ryle, Practical Religion, London,
 * 1878, chapter IV, "Prayer"):
 *  1. Transcription of Project Gutenberg ebook #38162 (Practical Religion,
 *     1878), chapter IV "Prayer":
 *     https://github.com/BenjaminPoole/ecumenical-christian-library/blob/f0a698bbb4fe51dbae6bf1d801d9c2f5b2337ce3/evangelical/jc-ryle/practical-religion/pr-04-prayer.html
 *     (Gutenberg original: https://www.gutenberg.org/ebooks/38162)
 *  2. OCR of a 19th-century American Tract Society printing of the same paper
 *     as a tract, "A Call to Prayer," by "Rev. J. C. Ryle, Rector of
 *     Helmingham, Suffolk" (150 Nassau-Street, New York; library stamp 1925),
 *     from the American Tract Society corpus used at George Mason University:
 *     https://github.com/ClioGMU/clio2-text/blob/HEAD/ats/pts_caltoprayer_1753_21.txt
 *  Each quote below appears word for word in both (allowing only OCR noise in
 *  the tract scan). Lines where the tract and the book differ were dropped.
 *
 * Self-contained data module: no imports.
 */

const RYLE = { author: 'J. C. Ryle', source: 'Practical Religion', year: 1878 };

export const QUOTES = [
  { ...RYLE, text: 'Prayer is the simplest act in all religion. It is simply speaking to God.' },
  { ...RYLE, text: 'Faith is to the soul what life is to the body. Prayer is to faith what breath is to life.' },
  { ...RYLE, text: 'Whatever else you make a business of, make a business of prayer.' },
  { ...RYLE, text: 'We should believe that nothing is too small to be named before God.' },
  { ...RYLE, text: 'Praying and sinning will never live together in the same heart. Prayer will consume sin, or sin will choke prayer.' },
  { ...RYLE, text: 'While you are speaking, Jesus is listening.' },
  { ...RYLE, text: 'At the very least, speak with God in the morning, before you speak with the world; and speak with God at night, after you have done with the world.' },
  { ...RYLE, text: 'He loves me best who loves me in his prayers.' },
  { ...RYLE, text: 'Faith is to prayer what the feather is to the arrow: without it prayer will not hit the mark.' },
  { ...RYLE, text: 'I believe we are very poor judges of the goodness of our prayers, and that the prayer which pleases us least often pleases God most.' },
  { ...RYLE, text: 'Tell me what a man’s prayers are, and I will soon tell you the state of his soul.' },
];

const DAY_MS = 86400000;
const EPOCH = Date.UTC(2024, 0, 7); // a fixed Lord's Day, the same epoch catechism.js uses

/**
 * The quote for a given LOCAL calendar day. It stays the same all day and
 * moves to the next quote at local midnight. Accepts a Date or a 'YYYY-MM-DD'
 * key. Returns a quote object, or null when the list is empty.
 */
export function quoteOfTheDay(date = new Date()) {
  if (!QUOTES.length) return null;
  let d = date;
  if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
    const [y, m, day] = d.split('-').map(Number);
    d = new Date(y, m - 1, day);
  } else if (!(d instanceof Date)) {
    d = new Date(d);
  }
  if (Number.isNaN(d.getTime())) d = new Date();
  const today = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const days = Math.round((today - EPOCH) / DAY_MS);
  const i = ((days % QUOTES.length) + QUOTES.length) % QUOTES.length;
  return QUOTES[i];
}
