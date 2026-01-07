# Sonarr Organizer Extension

> Browser extension to automatically organize and rename all series in Sonarr with one click

A Chrome/Edge browser extension that automates the process of organizing series in Sonarr. It automatically opens each series, clicks "Preview Rename", and executes "Organize".

## Installation

### Development Setup (for developers)

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/sonarr-organizer-extension.git
   cd sonarr-organizer-extension
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the Tailwind CSS:
   ```bash
   npm run build:css
   ```

   Or use watch mode during development:
   ```bash
   npm run watch:css
   ```

### Install Extension in Chrome/Edge

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `sonarr-automation-extension` folder

## Usage

1. Navigate to your Sonarr instance home page (the root `/` page showing all series in poster view)
   - **IMPORTANT:** The series index is at the root URL `/`, NOT at `/series`
2. Click the extension icon in the Chrome toolbar
3. Click "Start Automation"
4. The extension will now automatically:
   - Iterate through all series
   - Open each series page
   - Click "Preview Rename"
   - Click "Organize"
   - Wait for the operation to complete
   - Move to the next series

## Important Notes

- Make sure you're on the Sonarr series index page before starting automation
- Do not close the browser tab during automation
- Progress is logged in the browser console (F12 > Console tab)
- The automation uses chrome.storage to track progress, so it will continue even if the page refreshes

## Features

- ✅ Automatically iterates through all series
- ✅ Waits for modals and buttons to load
- ✅ Shows progress in the console and popup
- ✅ Auto-continues after page reload
- ✅ Automatically closes modals after completion
- ✅ Debug logging for troubleshooting
- ✅ Modern, styled UI with Tailwind CSS

## Troubleshooting

If the extension doesn't work:
1. Open Chrome Developer Console (F12)
2. Check the Console tab for error messages
3. Verify you're on the correct Sonarr page (home page showing all series)
4. Reload the extension at `chrome://extensions/`
5. Try again

You can also click "Show Debug Info" in the extension popup to see detailed logs.

## Technical Details

The extension consists of:
- `manifest.json` - Extension configuration (Manifest V3)
- `background.js` - Background service worker
- `content.js` - Content script that runs on Sonarr pages
- `popup.html/js` - UI for starting the automation
- `output.css` - Generated Tailwind CSS styling (built with `npm run build:css`)

## Security

This extension:
- Only works on pages where you explicitly start the automation
- Makes no external connections
- Only stores temporary data in chrome.storage.local
- Is fully open source

## License

MIT License - see LICENSE file for details

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
