# Salah Time – Prayer Blocker

Salah Time is a Chrome extension designed to help Muslims balance their digital life with their religious obligations. It provides timely reminders for the five daily prayers and introduces an innovative "Prayer Blocker" feature that pauses browser activity to encourage taking a break for Salah.

## Features

- **Prayer Times Integration**: Fetches accurate daily prayer times based on your specified location (City/Country) using the Aladhan API (`api.aladhan.com`).
- **Flexible Calculation Methods**: Supports multiple Islamic calculation methods (e.g., Umm Al-Qura, Muslim World League, ISNA) so you get accurate timings.
- **Approaching Prayer Warnings**: Displays a centered modal window 5 minutes before the prayer time to give you a head start for preparation.
- **Prayer Blocker Overlay**: When it's time for prayer, a persistent, non-dismissible full-screen overlay blocks browser activity. The overlay is removed only after confirming that you have completed your prayer.
- **Custom Task Reminders**: Set up customized full-screen blocking interfaces for personal task reminders, distinct from the prayer-time blocks.
- **Aesthetic and Thematic UI**: Designed with a clean, Muslim-inspired theme that provides a calming and focused experience.
- **Location Settings Persistence**: Automatically saves and applies your preferences (city, country, method, notifications) across sessions.

## Installation

To install this extension as an "unpacked extension" in Google Chrome:

1. Clone or download this repository to your local machine.
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Enable **"Developer mode"** by toggling the switch in the top right corner.
4. Click on the **"Load unpacked"** button.
5. Select the directory containing the extension files.
6. The "Salah Time – Prayer Blocker" extension will now appear in your list of extensions and is ready to use!

## Configuration

1. Click on the extension icon in your Chrome toolbar.
2. Navigate to the **Options** page.
3. Enter your **City** and **Country** (e.g., Casablanca, Morocco).
4. Select your preferred **Calculation Method**.
5. Save your settings. The "Today's Prayer Times Preview" section should immediately populate with the correct timings.

## Permissions Required

The extension requires the following permissions to function fully:
- `storage`: To save your preferences locally.
- `alarms`: To trigger warnings and block screens at the precise prayer times.
- `tabs` & `scripting`: To apply the blocker overlay across your active tabs.
- `geolocation`: To automatically detect your location for prayer time calculations.
- `notifications`: To display browser notifications if enabled.
- `host_permissions` (`<all_urls>`): To allow the blocking overlay to appear over any website you are currently viewing.

## Architecture

- `manifest.json`: The extension's configuration file.
- `background.js`: Service worker managing alarms, data fetching from the Aladhan API, and state.
- `content.js`: Handles displaying the blocker overlay and the 5-minute warning modal on web pages.
- `options.html` / `options.js`: The settings page UI and logic.
- `popup.html` / `popup.js`: The extension's toolbar popup.

## DEMO

![DEMO](assets/demo.gif)

## Prayer blocker screens

![DEMO](assets/1.jpeg)
![DEMO](assets/2.jpeg)