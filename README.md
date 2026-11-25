# Better Peepel

A Chrome extension that adds your remaining holidays, in days, above Peepel's calendar.

![Holiday summary showing 19 days remaining in a local preview](docs/preview.jpg)

*Preview uses synthetic data.*

## Install

**[Download the latest extension ZIP](https://github.com/ianjaku/better-peepel/releases/latest/download/peepel-in-days.zip)**

1. Unzip the download and move the `peepel-in-days` folder somewhere you will keep it, such as Documents.
2. Open `chrome://extensions` and enable **Developer mode**.
3. Click **Load unpacked** and select the `peepel-in-days` folder.
4. Open or refresh [Peepel's leave page](https://selfservice.peepel.io/leave).

The ZIP contains only the extension. No Git, build or npm install needed. Keep the extracted folder after installing; Chrome loads the extension from there.

## Use

The summary appears automatically in **Mijn Verlof**. It defaults to **8 hours per day**. Change this under **How this is calculated**.

To update, download the latest ZIP and replace the files inside your installed extension folder. Keep the same folder, click **Reload** for the extension in `chrome://extensions`, then refresh Peepel.

## How it works

Reads the displayed balances and calculates **remaining days = (allowance − used) ÷ hours per day**. Balances already in days stay as they are. Includes holidays, ADV and freely bookable public holidays; excludes remote work, sickness and types without an allowance.

Updates when the page changes. Runs locally, makes no network requests and stores only your day-length setting. Peepel markup changes may require an extension update.

## Development

`npm ci` → `npm test`. Optional: `npm run preview` serves synthetic sample data at `http://127.0.0.1:4173/leave`; `npm run package` creates an extension ZIP.

To install from a checkout, load the repo's `extension` folder as an unpacked extension.
