# BBterminal — Complete Application Documentation

A Bloomberg-style intelligence dashboard for free financial data, built with OpenBB Platform, React, TypeScript, and Vite. Runs entirely on your local machine with no API keys required out of the box.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Prerequisites](#prerequisites)
5. [Installation & Setup](#installation--setup)
6. [Running the Application](#running-the-application)
7. [How to Use BBterminal](#how-to-use-bbterminal)
8. [Terminal Functions Reference](#terminal-functions-reference)
9. [Source Code Walkthrough](#source-code-walkthrough)
10. [Data Flow & API Layer](#data-flow--api-layer)
11. [Intelligence Engine (Signals)](#intelligence-engine-signals)
12. [Workspace & State Management](#workspace--state-management)
13. [Design System](#design-system)
14. [Shell Scripts Reference](#shell-scripts-reference)
15. [Configuration Files](#configuration-files)
16. [Security Notes](#security-notes)
17. [Known Limitations](#known-limitations)
18. [Ideas for Improvement](#ideas-for-improvement)

---

## Architecture Overview

```
Browser (React SPA)
    |
    | http://localhost:5173
    |
Vite Dev Server (port 5173)
    |
    | /api/* proxy
    |
OpenBB Platform API (port 6900)
    |
    | REST calls
    |
Data Providers (Yahoo Finance, FRED, etc.)
```

The application consists of two servers running locally:

- **Frontend**: A Vite-powered React single-page application on port 5173. Handles all UI rendering, user interaction, and client-side state.
- **Backend**: The OpenBB Platform API (FastAPI/Uvicorn) on port 6900. Provides a unified REST API that aggregates financial data from 50+ data providers.

Vite proxies all `/api/*` requests to the OpenBB backend, so the browser only communicates with one origin. Both servers are bound to `127.0.0.1` (localhost only) and are never exposed to the network.

---

## Tech Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| React | 18.3.1 | UI component library |
| TypeScript | 5.6.3 | Type-safe JavaScript |
| Vite | 5.4.x | Build tool and dev server |
| Tailwind CSS | 3.4.14 | Utility-first CSS framework |
| TanStack React Query | 5.59.0 | Server state management, caching, and polling |
| Zustand | 5.0.0 | Client-side state management (workspace/tabs) |
| TradingView Lightweight Charts | 4.2.0 | Candlestick and volume charting |
| Lucide React | 0.454.0 | Icon library |
| clsx + tailwind-merge | — | Conditional CSS class utilities |

### Backend

| Technology | Purpose |
|---|---|
| OpenBB Platform | Financial data aggregation API (FastAPI-based) |
| Python 3.10–3.12 | Runtime for OpenBB |
| Uvicorn | ASGI server |
| Yahoo Finance (yfinance) | Default data provider (no API key needed) |
| Federal Reserve (FRED) | Treasury yield curve data |

---

## Project Structure

```
BB-Terminal/
├── install.sh                      # One-line remote installer
├── setup.sh                        # Local setup: creates venv, installs deps
├── start.sh                        # Launches both servers + opens browser
├── stop.sh                         # Kills both servers
├── README.md                       # Project README
├── DOCUMENTATION.md                # This file
├── .gitignore                      # Git ignore rules
│
└── app/                            # React frontend application
    ├── index.html                  # HTML entry point
    ├── package.json                # Node.js dependencies
    ├── package-lock.json           # Dependency lockfile
    ├── tsconfig.json               # TypeScript configuration
    ├── vite.config.ts              # Vite build + proxy configuration
    ├── tailwind.config.js          # Custom terminal color theme
    ├── postcss.config.js           # PostCSS plugins
    │
    └── src/
        ├── main.tsx                # React entry: QueryClient + StrictMode
        ├── App.tsx                 # Root component: routing + screen map
        ├── index.css               # Global styles, panel system, scrollbars
        │
        ├── components/             # Shared UI components
        │   ├── CommandBar.tsx      # Command input with autocomplete + history
        │   ├── QuickBar.tsx        # Quick-access function buttons
        │   ├── WorkspaceTabs.tsx   # Tab bar with close buttons
        │   ├── FunctionPanel.tsx   # Wrapper panel for function screens
        │   └── StatusBar.tsx       # Footer: API status, clock, provider
        │
        ├── functions/              # 18 function screens
        │   ├── CC.tsx              # Command Center (morning dashboard)
        │   ├── INTEL.tsx           # Stock Intelligence scorecard
        │   ├── HELP.tsx            # Function directory / help
        │   ├── DES.tsx             # Security Description (company profile)
        │   ├── GP.tsx              # Candlestick chart (TradingView)
        │   ├── QR.tsx              # Live quote recap
        │   ├── HP.tsx              # Historical prices table
        │   ├── FA.tsx              # Financial Analysis (income statement)
        │   ├── KEY.tsx             # Key ratios & metrics
        │   ├── DVD.tsx             # Dividend history
        │   ├── EE.tsx              # Analyst estimates & targets
        │   ├── NI.tsx              # Company news headlines
        │   ├── OMON.tsx            # Options chain monitor
        │   ├── WEI.tsx             # World equity indices
        │   ├── MOV.tsx             # Market movers (gainers/losers/active)
        │   ├── CRYPTO.tsx          # Cryptocurrency prices + sparklines
        │   ├── FXC.tsx             # FX currency pair cards
        │   └── CURV.tsx            # US Treasury yield curve
        │
        ├── lib/                    # Utility libraries
        │   ├── api.ts              # API client: fetch wrappers + TypeScript types
        │   ├── signals.ts          # Rule engine: signal classifiers + tally
        │   ├── functions.ts        # Function definitions + command parser
        │   ├── format.ts           # Number/date formatting helpers
        │   └── cn.ts               # Tailwind class name merge utility
        │
        └── store/
            └── workspaceStore.ts   # Zustand store: tabs, active symbol
```

---

## Prerequisites

Before running BBterminal, ensure you have:

| Requirement | Version | Check | Install |
|---|---|---|---|
| **Git** | Any | `git --version` | `xcode-select --install` (macOS) |
| **Python** | 3.10, 3.11, or 3.12 | `python3 --version` | `brew install python@3.12` (macOS) |
| **Node.js** | 18+ | `node --version` | `brew install node` (macOS) |
| **npm** | (comes with Node) | `npm --version` | Included with Node.js |

> **Note**: Python 3.13+ is NOT supported by OpenBB Platform at this time. Use 3.10–3.12.

---

## Installation & Setup

### Option 1: One-Line Installer (Remote)

```bash
curl -fsSL https://raw.githubusercontent.com/vaughanf1/BB-Terminal/main/install.sh | bash
```

This will:
1. Check prerequisites (git, Python, Node)
2. Clone the repository to `~/BB-Terminal`
3. Run `setup.sh` automatically
4. Launch the application

You can customize the install directory:
```bash
INSTALL_DIR=~/my-folder curl -fsSL https://raw.githubusercontent.com/vaughanf1/BB-Terminal/main/install.sh | bash
```

Or skip auto-launch:
```bash
SKIP_LAUNCH=1 curl -fsSL ... | bash
```

### Option 2: Manual Setup (Local)

```bash
git clone https://github.com/vaughanf1/BB-Terminal.git
cd BB-Terminal
./setup.sh
```

`setup.sh` does the following:
1. Verifies Python 3.10–3.12, Node 18+, and npm are available
2. Creates a Python virtual environment at `.venv/`
3. Upgrades pip and installs `openbb[all]` + `openbb-cli` inside the venv
4. Runs `npm install` inside the `app/` directory

Nothing is installed globally. Everything stays inside the project directory.

---

## Running the Application

### Start

```bash
./start.sh
```

This will:
1. Check that setup has been completed (`.venv/bin/openbb-api` and `app/node_modules/` exist)
2. Start the OpenBB API on port 6900 (if not already running)
3. Wait for the API to respond (up to 60 seconds)
4. Start the Vite dev server on port 5173 (if not already running)
5. Wait for the UI to respond (up to 30 seconds)
6. Open `http://localhost:5173/` in your default browser

The script is idempotent — if servers are already running, it leaves them alone.

### Stop

```bash
./stop.sh
```

Kills all processes on ports 6900 and 5173. Uses graceful `kill` first, then `kill -9` if the process doesn't respond.

### Logs

- API log: `/tmp/bbterminal-api.log`
- UI log: `/tmp/bbterminal-ui.log`

---

## How to Use BBterminal

### The Command Bar

The command bar at the top of the screen is the primary input. Type a command and press **Enter** or click **\<GO\>**.

**Command formats:**

| Input | Result |
|---|---|
| `AAPL` | Opens INTEL (intelligence scorecard) for Apple |
| `AAPL DES` | Opens DES (company description) for Apple |
| `DES AAPL` | Same as above (order doesn't matter) |
| `CC` | Opens Command Center (no symbol needed) |
| `WEI` | Opens World Equity Indices |
| `GP` | Opens chart for the currently active symbol |
| `HELP` | Shows the function directory |

**Keyboard shortcuts:**
- **/** — Focus the command bar from anywhere
- **Up/Down arrows** — Navigate command history (last 20 commands)
- **Tab** — Autocomplete function codes
- **Enter** — Execute command

### Context Symbol

The "CTX" indicator in the command bar shows the currently active symbol. When you type a function code without a symbol (e.g., just `GP`), it uses the context symbol. The context updates whenever you open a symbol-specific function.

### Tabs

Every command opens in a new tab. Click tabs to switch between views. Click the **X** to close a tab. The Command Center (CC) tab always remains as a fallback if you close everything.

### Quick Bar

The row of buttons below the command bar provides one-click access to the most common functions. Symbol-specific buttons use the current context symbol.

### Status Bar

The footer shows:
- **OpenBB status**: Green dot = API is live, Red = API is down
- **Provider**: The active data provider (yfinance by default)
- **Tab count**: Number of open tabs
- **Date and time**: Local clock, updates every second

---

## Terminal Functions Reference

### System Functions

| Code | Name | Symbol? | Description |
|---|---|---|---|
| **CC** | Command Center | No | Morning dashboard: US indices with 14-day sparklines, yield curve snapshot (2s-10s and 3m-10y spreads), FX & crypto rates, top gainers/losers tables, and market headlines from SPY news feed. Auto-refreshes every 60s. |
| **HELP** | Function Directory | No | Lists all available functions organized by group (System, Security, Markets, Macro) with descriptions. Click any function to open it. |

### Security Functions (require a ticker symbol)

| Code | Name | Description |
|---|---|---|
| **INTEL** | Stock Intelligence | Full scorecard with rule-based signals across 5 categories: Technical (50d/200d MA, 52-week range), Valuation (P/E, forward P/E, EV/EBITDA), Fundamentals (revenue/earnings growth, margins, D/E), Analysts (recommendation, price target upside), and Dividend (yield, payout ratio). Produces a verdict: Bullish, Bearish, Mixed, or Sparse. Also shows business description, revenue trend bar chart, and latest headlines. Quote refreshes every 5 seconds. |
| **DES** | Security Description | Company profile with name, exchange, sector, industry, employees, HQ address, phone, website. Plus live price, market cap, shares outstanding/float, beta, dividend yield, 52-week range, moving averages. |
| **GP** | Graph / Chart | Interactive candlestick chart with volume histogram using TradingView Lightweight Charts. Range selector: 1M, 3M, 6M, 1Y, 3Y, 5Y. Green/red candles, amber crosshair, auto-resizing. |
| **QR** | Quote Recap | Live quote refreshing every 3 seconds. Shows last price, change, open, previous close, day high/low, bid/ask with sizes, volume, average volume, 52-week high/low, 50d/200d moving averages. |
| **HP** | Historical Prices | OHLCV data table sorted newest-first. Range selector: 1M, 3M, 6M, 1Y, 5Y. Shows daily change percentage with color coding. Row count displayed. |
| **FA** | Financial Analysis | Income statement for the last 5 fiscal years. Line items: Revenue, COGS, Gross Profit, R&D, SG&A, Operating Income, Pre-Tax Income, Net Income, Basic EPS, Diluted EPS. Key rows highlighted in amber. |
| **KEY** | Key Ratios & Metrics | Organized into 5 groups: Valuation (Market Cap, EV, P/E, P/E Forward, PEG, EV/EBITDA, P/B, Book Value), Growth (Revenue, Earnings), Profitability (Gross/Op/Net Margins, ROA, ROE), Balance Sheet (Current Ratio, Quick Ratio, D/E), Dividend (Yield, Payout). |
| **DVD** | Dividend History | Two-panel view: full dividend payment history (ex-date + amount) and annual totals per share. Sorted newest-first. |
| **EE** | Analyst Estimates | Consensus recommendation (Strong Buy / Buy / Hold / Sell) with rating score out of 5, analyst count, current price vs. target consensus/median/high/low, and implied upside percentage. |
| **NI** | News — Company | Up to 50 recent headlines for the symbol. Each shows timestamp, title, summary (if available), and source. Click to open the article in a new tab. |
| **OMON** | Options Monitor | Full options chain with calls on the left, strike in the center, puts on the right. Columns: OI, Volume, IV, Bid, Ask. Expiration date selector (up to 14 dates). In-the-money rows highlighted. |

### Market Functions (no symbol needed)

| Code | Name | Description |
|---|---|---|
| **WEI** | World Equity Indices | 16 global indices across Americas (S&P 500, Dow, NASDAQ, Russell 2000, TSX, Bovespa), EMEA (FTSE 100, DAX, CAC 40, Euro Stoxx 50, IBEX 35), and Asia-Pac (Nikkei, Hang Seng, ASX, KOSPI, TAIEX). Shows last price, daily change, percentage change, and volume. Refreshes every 60s. |
| **MOV** | Market Movers | Three sub-tabs: Top Gainers, Top Losers, Most Active. Each shows up to 100 rows with symbol, name, price, change, change %, volume, market cap, and forward P/E. Click any row to open DES. |
| **CRYPTO** | Crypto Monitor | 12 cryptocurrencies: BTC, ETH, SOL, BNB, XRP, ADA, DOGE, AVAX, LINK, LTC, MATIC, DOT. Shows price, 24h change, volume, and a 14-day sparkline chart. Refreshes every 60s. |
| **FXC** | FX Cross Rates | 12 major FX pairs: EUR/USD, GBP/USD, USD/JPY, USD/CHF, USD/CAD, AUD/USD, NZD/USD, EUR/GBP, EUR/JPY, GBP/JPY, USD/CNY, USD/MXN. Each displayed as a card with rate, daily change %, and 10-day sparkline. |

### Macro Functions (no symbol needed)

| Code | Name | Description |
|---|---|---|
| **CURV** | US Yield Curve | Treasury par yield curve with 11 tenors (1M through 30Y). Shows today's rates, 1-week-ago, and 1-month-ago in a comparison table. SVG chart with three overlaid curves. Displays 2s-10s and 3m-10y spreads in basis points. Data from Federal Reserve via OpenBB. Refreshes hourly. |

---

## Source Code Walkthrough

### Entry Point (`main.tsx`)

Creates a React Query `QueryClient` with default options:
- `staleTime: 5000` — data is considered fresh for 5 seconds
- `refetchOnWindowFocus: false` — no refetch when switching tabs
- `retry: 1` — one retry on failure

Renders the `App` component inside `React.StrictMode` and `QueryClientProvider`.

### App Component (`App.tsx`)

Maintains a map of function codes to React components (`SCREENS`). Reads the active tab from the Zustand workspace store, looks up the corresponding screen component, and renders it inside a `FunctionPanel` wrapper.

Layout (top to bottom):
1. `CommandBar` — command input
2. `QuickBar` — quick-access buttons
3. `WorkspaceTabs` — tab bar
4. `FunctionPanel` + active screen — main content area
5. `StatusBar` — footer

### API Client (`lib/api.ts`)

A single `get<T>()` function handles all API requests:
- Constructs the URL: `/api/v1/{path}?{params}`
- Uses `URLSearchParams` for safe query parameter encoding
- Parses JSON response and extracts `body.results`
- On error, creates an `ApiError` with status code, message, and optional `needsKey` (for missing API key detection)

Exports 16 fetcher functions, each calling a specific OpenBB endpoint:
- `fetchQuote`, `fetchHistorical`, `fetchProfile`, `fetchIncome`, `fetchMetrics`
- `fetchDividends`, `fetchConsensus`, `fetchNewsCompany`, `fetchOptions`
- `fetchGainers`, `fetchLosers`, `fetchMostActive`
- `fetchIndexHistorical`, `fetchTreasuryRates`, `fetchFxHistorical`, `fetchCryptoHistorical`
- `searchSymbols`

### Command Parser (`lib/functions.ts`)

Defines all 18 function codes with metadata:
- `code` — short identifier (e.g., "INTEL")
- `name` — human-readable name
- `needsSymbol` — whether a ticker is required
- `group` — category (Security, Markets, Macro, System)
- `summary` — one-line description

The `parseCommand()` function handles free-form input:
- Single token: if it's a known function code, use it; otherwise treat it as a symbol and default to INTEL
- Two tokens: try `SYMBOL FUNC` order first, then `FUNC SYMBOL`
- Symbol-requiring functions fall back to the active context symbol
- Returns `null` for unrecognized commands

### Format Utilities (`lib/format.ts`)

- `fmtPrice(v, digits)` — locale-formatted price with specified decimals
- `fmtInt(v)` — locale-formatted integer
- `fmtVolume(v)` — abbreviated large numbers (1.23T, 4.56B, 7.89M, 1.23K)
- `fmtPct(v, digits)` — percentage with sign (+1.23%)
- `fmtPctFromDecimal(v, digits)` — converts decimal (0.05) to percentage (+5.00%)
- `fmtDate(iso)` — short date (e.g., "May 03, 26")
- `fmtTime(iso)` — date with time (e.g., "May 3, 02:30 PM")
- `dirClass(v)` — returns "up", "down", or "flat"

All functions return "—" for null/undefined/NaN inputs.

---

## Data Flow & API Layer

### Polling Strategy

Each function screen sets its own polling interval via TanStack React Query's `refetchInterval`:

| Function | Interval | Notes |
|---|---|---|
| QR (Quote Recap) | 3 seconds | Fastest refresh for live quotes |
| INTEL (quote part) | 5 seconds | Quote within the scorecard |
| CC (indices, FX) | 60 seconds | Dashboard overview |
| CC (movers) | 120 seconds | Gainers/losers refresh |
| WEI, MOV, CRYPTO, FXC | 60 seconds | Market data |
| CURV, CC (yield curve) | 3,600 seconds (1 hour) | Yield curve data changes infrequently |

### Caching

React Query's `staleTime` prevents redundant requests:
- Default: 5 seconds (set in `main.tsx`)
- Some screens override: GP, NI, OMON use 60 seconds
- INTEL suggestion search uses 60 seconds

Opening the same function/symbol combination reuses cached data if still fresh.

### API Endpoints Used

All requests go through `GET /api/v1/{endpoint}` with query parameters:

| Endpoint | Provider | Used By |
|---|---|---|
| `/equity/price/quote` | yfinance | QR, INTEL, DES, CC, StatusBar |
| `/equity/price/historical` | yfinance | GP, HP |
| `/equity/profile` | yfinance | DES, INTEL |
| `/equity/fundamental/income` | yfinance | FA, INTEL |
| `/equity/fundamental/metrics` | yfinance | KEY, INTEL |
| `/equity/fundamental/dividends` | yfinance | DVD |
| `/equity/estimates/consensus` | yfinance | EE, INTEL |
| `/news/company` | yfinance | NI, INTEL, CC |
| `/equity/discovery/gainers` | yfinance | MOV, CC |
| `/equity/discovery/losers` | yfinance | MOV, CC |
| `/equity/discovery/active` | yfinance | MOV |
| `/derivatives/options/chains` | yfinance | OMON |
| `/index/price/historical` | yfinance | WEI, CC |
| `/fixedincome/government/treasury_rates` | federal_reserve | CURV, CC |
| `/currency/price/historical` | yfinance | FXC, CC |
| `/crypto/price/historical` | yfinance | CRYPTO, CC |
| `/equity/search` | sec | INTEL (suggestions) |

---

## Intelligence Engine (Signals)

The `INTEL` function screen uses a rule-based signal engine defined in `lib/signals.ts`. This is NOT a prediction model — it applies fixed heuristic rules to classify data points as bullish, bearish, neutral, or n/a.

### Signal Categories

**Technical (3 signals):**
- `sigMA` — Price vs. 50-day and 200-day moving averages. Bull if >2% above, Bear if >2% below.
- `sig52w` — Position in 52-week range. At high = neutral, upper range = bull, lower range = bear.

**Valuation (3 signals):**
- `sigPE` — Trailing P/E ratio. <12 = bull (cheap), 12–22 = neutral, 22–40 = bear (rich), >40 = bear (very rich), negative = bear.
- `sigFwdPE` — Forward P/E with comparison to trailing. Improving earnings trajectory = bull.
- `sigEvEbitda` — EV/EBITDA multiple. <10 = bull, 10–18 = neutral, >18 = bear.

**Fundamentals (5 signals):**
- `sigGrowth` — Revenue and earnings growth (YoY). >15% = bull (accelerating), 5–15% = bull, 0–5% = neutral, negative = bear.
- `sigMargin` — Operating and gross margins. Thresholds differ by type (e.g., operating: >18% = strong, 8–18% = average).
- `sigDebtEquity` — Debt-to-equity ratio. <0.5 = bull (low leverage), 0.5–1.5 = neutral, >1.5 = bear.

**Analyst (2 signals):**
- `sigAnalystRec` — Consensus recommendation and score (1–5 scale, 1 = strong buy).
- `sigAnalystUpside` — Implied upside to consensus target price. >15% = bull, 0–15% = neutral, negative = bear.

**Dividend (1 signal):**
- `sigDividend` — Dividend yield and payout ratio. Payout >90% = bear (stretched), 60–90% = neutral, <60% = bull (healthy).

### Verdict Logic

The `tally()` function counts bullish, bearish, neutral, and n/a signals:

- **Sparse**: Fewer than 3 informative signals (too little data)
- **Bullish**: `bull - bear >= max(2, 40% of informative signals)`
- **Bearish**: `bear - bull >= max(2, 40% of informative signals)`
- **Mixed**: Everything else

The INTEL screen clearly labels this as "RULE-BASED · NOT INVESTMENT ADVICE".

---

## Workspace & State Management

### Zustand Store (`workspaceStore.ts`)

Client-side state is managed by a single Zustand store, persisted to `localStorage` under the key `bbterminal-workspace`.

**State:**
- `tabs` — Array of open tabs, each with `id`, `code` (function), and optional `symbol`
- `activeTabId` — Currently visible tab
- `activeSymbol` — Context symbol (used by symbol-requiring functions when no symbol is specified)

**Actions:**
- `openTab(code, symbol)` — Opens a new tab or switches to existing one. Tab IDs are `CODE:SYMBOL` (e.g., `INTEL:AAPL`)
- `closeTab(id)` — Removes a tab. If all tabs are closed, reopens Command Center as fallback
- `setActiveTab(id)` — Switches the visible tab
- `setActiveSymbol(s)` — Updates the context symbol

**Persistence:** Only tab layout and active symbol are persisted. No financial data, credentials, or sensitive information is stored.

---

## Design System

### Color Palette

The application uses a custom Bloomberg-inspired amber-on-black theme defined in `tailwind.config.js`:

| Token | Hex | Usage |
|---|---|---|
| `term-bg` | `#0a0a0a` | Main background |
| `term-bg2` | `#111111` | Secondary background |
| `term-panel` | `#141414` | Panel background |
| `term-panel2` | `#1a1a1a` | Panel header background |
| `term-border` | `#2a2a2a` | Primary borders |
| `term-borderSoft` | `#1f1f1f` | Subtle borders |
| `term-amber` | `#ff8c00` | Primary accent (Bloomberg orange) |
| `term-amberDim` | `#a55f00` | Dimmed amber |
| `term-amberBright` | `#ffaa33` | Bright amber (user input, symbols) |
| `term-amberSubtle` | `rgba(255,140,0,0.08)` | Hover/highlight background |
| `term-green` | `#22ee22` | Positive/up values |
| `term-red` | `#ff3b3b` | Negative/down values |
| `term-cyan` | `#22ccee` | Links |
| `term-muted` | `#6e6e6e` | Secondary text |
| `term-text` | `#d0d0d0` | Primary text |
| `term-heading` | `#f0f0f0` | Heading text |

### Typography

- **Primary font**: JetBrains Mono (loaded from Google Fonts)
- **Fallbacks**: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, monospace
- **Base font size**: 13px
- **Tabular numerals**: All numeric values use `font-variant-numeric: tabular-nums` for aligned columns

### CSS Component Classes (defined in `index.css`)

| Class | Purpose |
|---|---|
| `.panel` | Container with dark background and border |
| `.panel-header` | Amber header bar for panels |
| `.sub-header` | Muted uppercase micro text |
| `.num` | Tabular numeral display |
| `.up` | Green text for positive values |
| `.down` | Red text for negative values |
| `.amber` | Amber text |
| `.grid-data th/td` | Table styling with sticky headers and hover |
| `.scroll-thin` | Custom slim scrollbar |
| `.caret` | Blinking amber cursor animation |

---

## Shell Scripts Reference

### `install.sh`

**Purpose**: One-line remote installer for first-time users.

**Flow:**
1. Prints ASCII art banner
2. Checks for git, Python 3.10–3.12, Node.js 18+
3. Clones the repo with `--depth 1` (shallow) to `$INSTALL_DIR` (default: `~/BB-Terminal`)
4. Runs `setup.sh`
5. Runs `start.sh` (unless `SKIP_LAUNCH=1`)

**Environment variables:**
- `INSTALL_DIR` — custom install path (default: `~/BB-Terminal`)
- `SKIP_LAUNCH` — set to `1` to skip auto-launch after install

### `setup.sh`

**Purpose**: One-time local setup.

**Flow:**
1. Checks Python 3.10–3.12, Node, npm
2. Creates Python venv at `.venv/`
3. Upgrades pip and installs `openbb[all]` and `openbb-cli`
4. Runs `npm install` in `app/`

### `start.sh`

**Purpose**: Launch both servers and open browser.

**Flow:**
1. Verifies setup has been run (checks for `.venv/bin/openbb-api` and `app/node_modules/`)
2. Checks if port 6900 is in use; if not, starts OpenBB API in background
3. Polls `http://127.0.0.1:6900/openapi.json` until it responds (up to 60s)
4. Checks if port 5173 is in use; if not, starts Vite dev server in background
5. Polls `http://127.0.0.1:5173/` until it responds (up to 30s)
6. Opens the browser with `open` (macOS) or `xdg-open` (Linux)

**Idempotent**: Safe to run multiple times. If a server is already running, it's left alone.

### `stop.sh`

**Purpose**: Stop both servers.

**Flow:**
1. For ports 6900 and 5173:
   - Find PIDs with `lsof`
   - Send `kill` (graceful)
   - Wait 1 second
   - If still running, send `kill -9` (force)

---

## Configuration Files

### `vite.config.ts`

```typescript
{
  plugins: [react()],
  resolve: { alias: { "@": "src/" } },     // @ import alias
  server: {
    port: 5173,
    strictPort: true,                        // fail if port is taken
    host: "127.0.0.1",                       // bind to IPv4 localhost
    proxy: {
      "/api": {
        target: "http://127.0.0.1:6900",     // forward to OpenBB
        changeOrigin: true,
      },
    },
  },
}
```

### `tsconfig.json`

- Target: ES2022
- Strict mode: enabled
- JSX: react-jsx
- Path alias: `@/*` maps to `src/*`

### `tailwind.config.js`

Custom terminal color theme (see Design System section above). Scans `index.html` and all `.ts/.tsx` files in `src/`.

### `.gitignore`

Excludes:
- Python artifacts: `.venv/`, `__pycache__/`, `*.pyc`
- Node artifacts: `node_modules/`, `dist/`, `.vite/`
- Secrets: `.env`, `.env.local`, `*.key`, `*.pem`, `user_settings.json`
- OS files: `.DS_Store`, `Thumbs.db`
- Editor files: `.vscode/`, `.idea/`
- Screenshots and private notes

---

## Security Notes

- **No hardcoded secrets**: No API keys, tokens, or passwords in source code
- **No XSS vectors**: All content rendered through React JSX (auto-escaping). No `innerHTML` or `dangerouslySetInnerHTML`
- **No eval()**: No `eval`, `new Function()`, or string-based `setTimeout`
- **No command injection**: No shell execution in any TypeScript/JavaScript code
- **No database**: No SQL, no injection risk
- **Localhost only**: Both servers bind to `127.0.0.1`, not `0.0.0.0`
- **No logging**: Zero `console.log` statements in production code
- **Safe URL encoding**: All API parameters go through `URLSearchParams`
- **TypeScript strict mode**: Catches type errors at compile time
- **Comprehensive .gitignore**: Secrets and sensitive files are excluded from version control

### Advisory Notes

- The OpenBB API runs without authentication. This is by design for a single-user local tool but would need auth if ever exposed to a network.
- External URLs from news feeds are rendered as `<a href>` without URL scheme validation. The risk is negligible since data comes from the trusted OpenBB API, but a `safeHref()` helper could be added for defense-in-depth.
- The `vite` and `esbuild` dev dependencies have known moderate vulnerabilities that only affect the development server, not production builds. Run `npm audit fix` to update.

---

## Known Limitations

1. **Data is polled, not streamed**: Prices update at fixed intervals (3–60 seconds depending on the screen), not in real-time. This is a limitation of the yfinance data source.

2. **Yahoo Finance coverage**: The default provider (yfinance) does not cover all securities. Mutual funds, OTC stocks, and some international securities may return no data. The INTEL screen handles this with a "No Data" fallback and SEC-based ticker suggestions.

3. **Single data provider**: Most functions are hardcoded to `provider: "yfinance"`. The Treasury curve uses `federal_reserve`. Other OpenBB providers (FMP, Polygon, TradingEconomics, etc.) require API keys configured in `~/.openbb_platform/user_settings.json`.

4. **No intraday charts**: The GP chart only supports daily and weekly intervals. No 1-minute, 5-minute, or hourly candles.

5. **Options data freshness**: Options chains from yfinance are delayed and may not reflect real-time bid/ask spreads.

6. **No portfolio tracking**: There is no watchlist, portfolio, or alert system.

7. **Browser-only**: The application requires a browser. There is no native desktop or mobile app.

8. **Heavy initial install**: `openbb[all]` installs every data provider extension, which is a large download. Most users only need yfinance.

9. **No offline mode**: The application requires an internet connection to fetch data and Google Fonts.

---

## Ideas for Improvement

### New Features

- **Watchlist / Portfolio**: Let users save a list of symbols and track performance against a custom portfolio
- **Alerts & Notifications**: Set price alerts or signal-based triggers (e.g., notify when INTEL verdict flips to Bearish)
- **Intraday Charts**: Add 1m, 5m, 15m, 1h interval support for GP charts (requires a data provider with intraday data)
- **Earnings Calendar**: Add an economic/earnings calendar screen showing upcoming earnings dates
- **Sector Heatmap**: Visual heatmap of S&P 500 sectors by daily performance
- **ETF Screener**: Screen ETFs by category, expense ratio, AUM, and performance
- **Technical Indicators**: Add overlay indicators on charts (RSI, MACD, Bollinger Bands, SMA/EMA)
- **Multiple Data Providers**: UI to switch between data providers per function (e.g., use Polygon for options, FMP for fundamentals)
- **Export to CSV/PDF**: Let users export tables and charts for reports
- **Dark/Light Theme Toggle**: While the terminal aesthetic is core to the identity, a lighter theme could improve accessibility
- **Keyboard-First Navigation**: Vim-like keybindings for power users (j/k for row navigation, / for search within tables)
- **Comparative Analysis**: Side-by-side comparison of two or more stocks on the same screen

### Technical Improvements

- **Production Build**: Add `vite build` output with static file serving (currently runs as dev server only)
- **Lighter Install Option**: Offer `openbb` without the `[all]` extras for faster setup (just yfinance + FRED)
- **PWA / Service Worker**: Enable offline caching for the UI shell and recently viewed data
- **WebSocket Data**: Replace polling with WebSocket connections for real-time price updates (requires a compatible data provider)
- **Error Boundaries**: Add React error boundaries around each function screen so one crash doesn't take down the whole app
- **Testing**: Add unit tests for the signal engine (`signals.ts`) and command parser (`functions.ts`), plus integration tests for API response handling
- **Accessibility**: Add ARIA labels, keyboard navigation for data tables, and screen reader support
- **Mobile Responsive**: The grid layouts assume desktop-width screens. Add responsive breakpoints for tablet/mobile
- **Bundle Splitting**: Lazy-load function screens with `React.lazy()` to reduce initial bundle size
- **URL-Based Routing**: Add URL routing (e.g., `/AAPL/INTEL`) so users can bookmark and share specific views
- **Docker Support**: Add a `Dockerfile` and `docker-compose.yml` for containerized deployment
- **CI/CD Pipeline**: Add GitHub Actions for linting, type checking, and automated tests on PRs

### Signal Engine Enhancements

- **Sector-Relative Scoring**: Compare P/E, margins, and growth against sector median rather than absolute thresholds
- **Historical Signal Tracking**: Show how signals for a stock have changed over time
- **Weighted Scoring**: Allow different weights for different signal categories (e.g., weight fundamentals higher than technicals)
- **Custom Rules**: Let users define their own signal rules and thresholds
- **Backtesting**: Test signal accuracy against historical returns

---

*Generated for BBterminal — Bloomberg-style intelligence dashboard powered by OpenBB Platform.*
