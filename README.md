# Before the Throne

> Let us then with confidence draw near to the throne of grace, that we may receive mercy and find grace to help in time of need.
> (Hebrews 4:16 ESV)

A prayer app for Reformed Presbyterians. It works on any phone or computer, installs to your home screen like a regular app, and keeps working with no signal. Everything you write stays on your own device.

## What it does

**Today.** A greeting, a call to prayer, the requests due today, a verse of the day, five psalms to pray through the Psalter each month, a Shorter Catechism question of the day, and a short word on prayer from J. C. Ryle. On the Lord's Day it reminds you of the Sabbath.

**Guided prayer.** Pray through your requests by one of four patterns.

- *The Lord's Prayer*, petition by petition, with the Shorter Catechism's teaching on each (Q. 100 to 107). Your requests fall under the petition they belong to.
- *ACTS*, which moves through adoration, confession, thanksgiving, and supplication.
- *Matthew Henry's Method*, after his *A Method for Prayer* (1710).
- *My List*, straight through today's requests.

Each step has Scripture from the ESV and short prompts. Check off each request as you pray. The screen stays awake while you pray, and your place is kept if you get interrupted.

**Requests.** Sort requests by category (My Soul, Family, The Church, Friends & Neighbors, The Lost, Missions & the Nations, The Persecuted Church, Rulers & Nation, Other, and your own). Pray for each one daily, on certain days, or in a rotation that brings up a few each day, those waiting longest first. You can attach a Scripture promise you are pleading.

**Ebenezer.** When the Lord answers, mark the request answered and write how. It moves to your Ebenezer, a record of "stones of help" (1 Samuel 7:12) to look back on.

**Journal.** A simple prayer journal, with drafts saved as you type.

**Learn.** The whole Westminster Shorter Catechism with a practice mode, Westminster Confession chapter 21 on worship and prayer, the Larger Catechism on prayer (Q. 178 to 196), and short teaching pages on prayer.

**Reminders.** A web app cannot ring an alarm by itself when it is closed, so the app makes a calendar file with your prayer times (and a Saturday evening reminder to prepare for the Lord's Day). Open it once and your phone's calendar does the reminding.

**Backups.** Export everything to a file and import it on another device.

## Put it on your phone

Once the site is published (see below), open its address on your phone.

- **iPhone:** open it in Safari, tap the Share button, then **Add to Home Screen**.
- **Android:** open it in Chrome, then tap **Install app** (or use the menu and choose **Add to Home screen**). You can also use the Install button in the app's Settings.

## Publish with GitHub Pages

The repository includes a workflow that tests the app and publishes it.

1. In the repository on GitHub, go to **Settings**, then **Pages**, and set **Source** to **GitHub Actions**.
2. Merge this work into `main`. The workflow tests the app and publishes it at `https://<your-username>.github.io/beforethethrone/`. Every later push to `main` publishes again.
3. If a run failed because Pages was not yet turned on, open the **Actions** tab, choose **Test and deploy to GitHub Pages**, and click **Run workflow**.

## Run it on a computer

It is a plain static site with no build step. Any static file server works.

```sh
npm install        # only needed for the test tools
npm run serve      # then open http://localhost:8080
```

## Tests

```sh
npm test           # unit tests (Node's built-in test runner)
npm run test:e2e   # browser tests with Playwright
```

The unit tests also guard the content. They check that every quoted verse exists, that the app stays within the ESV's quotation limit, that the catechism has all 107 questions, and that the service worker caches every file.

## How it is built

- Plain HTML, CSS, and JavaScript modules. No frameworks and no runtime dependencies.
- Data lives in `localStorage` on the device. Nothing is ever sent to a server.
- A service worker caches every file so the app works offline. When a new version is published, the app offers to reload.
- A strict Content Security Policy allows only the app's own files.

```
index.html, manifest.webmanifest, sw.js
css/base.css            shared design system
css/views/*.css         styles for each screen
js/app.js               startup, routes, updates
js/store.js             saved state and all changes to it
js/schedule.js          which requests are due today
js/data/*.js            Scripture, catechism, confession, prayer guides, quotes
js/views/*.js           the screens
tests/unit, tests/e2e   tests
```

When you change any file the app uses, bump the version in both `js/version.js` and `sw.js` so installed copies pick up the update. A test checks that the two match and that `sw.js` lists every file.

## Sources and permissions

Scripture quotations are from the ESV® Bible (The Holy Bible, English Standard Version®), © 2001 by Crossway, a publishing ministry of Good News Publishers. Used by permission. All rights reserved. The app quotes well under 500 verses, within Crossway's permission terms. Longer readings, such as the psalms of the day, link to [esv.org](https://www.esv.org/) instead of being copied.

The Westminster Confession of Faith and Catechisms (1640s) are in the public domain. The text comes from the [Creeds.json](https://github.com/NonlinearFruit/Creeds.json) project.

The quotations from J. C. Ryle come from his *Practical Religion* (1878), which is in the public domain.

*Soli Deo Gloria.*
