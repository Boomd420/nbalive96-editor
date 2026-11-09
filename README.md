# NBA Live '96 Browser Roster Editor

A client-side static web application for viewing, editing, and recalculating checksums for classic NBA Live '96 binary roster files.

## Features
- Pure client-side execution via `ArrayBuffer`, `DataView`, and `Uint8Array`.
- Safe little-endian reading and writing of player records, ratings, and jersey numbers.
- Automatic 32-bit checksum recalculation and patching.
- Export modified `.bin` roster files directly from your browser.

## Running Locally
Simply open `index.html` in any modern web browser.

## Deployment
Hosted live via GitHub Pages.
