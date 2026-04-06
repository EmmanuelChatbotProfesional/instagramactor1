# 📸 Instagram Highlights Scraper

Scrape Instagram highlights from any public account. Extract highlight titles, cover images, user information, and metadata. Supports multiple accounts in a single run!

## ✨ Features

- 🔍 Scrape highlights from any public Instagram account
- 📌 Extract highlight titles and cover images
- 👥 Multiple accounts support in a single run
- 🔄 Auto retry logic with exponential backoff for reliability
- 📊 Clean dataset with organized views

---

## 📥 Input

| Field | Type | Description | Default |
|---|---|---|---|
| `usernames` | `string[]` | Instagram usernames (without @ symbol) | *(required)* |
| `maxRetries` | `integer` | Retries per username if request fails | `3` |
| `delayBetweenRequestsMs` | `integer` | Delay in ms between requests | `1500` |

### Example Input

```json
{
  "usernames": ["instagram", "cristiano", "leomessi"],
  "maxRetries": 3,
  "delayBetweenRequestsMs": 1500
}
```

---

## 📤 Output

Each highlight entry contains:

| Field | Description |
|---|---|
| `highlightId` | Unique highlight identifier (e.g. `highlight:18223279177302854`) |
| `highlightTitle` | Title of the highlight |
| `userId` | User's Instagram ID |
| `username` | Instagram username |
| `coverImageUrl` | Direct cover image URL |
| `coverImageUrlWrapped` | Wrapped cover image URL (for proxies) |
| `latestReelMedia` | Timestamp of the latest story in the highlight |
| `mediaCount` | Number of stories inside the highlight |
| `scrapedAt` | ISO timestamp of when the data was scraped |

### Example Output

```json
{
  "highlightId": "highlight:18223279177302854",
  "highlightTitle": "CFO Podcast",
  "userId": "25025320",
  "username": "instagram",
  "coverImageUrl": "https://scontent-iev1-1.cdninstagram.com/...",
  "coverImageUrlWrapped": "/api/instagram/get?url=...",
  "latestReelMedia": 1714000000,
  "mediaCount": 12,
  "scrapedAt": "2025-04-06T10:00:00.000Z"
}
```

---

## 📊 Dataset Views

- **✨ Highlights Overview** — Overview of all scraped highlights with titles, IDs, and cover images
- **🖼️ Cover Media** — Detailed cover image data with both direct and wrapped URLs

---

## 🚀 Usage

1. Go to the Actor's input page
2. Enter one or more Instagram usernames (without @)
3. Click **Start** and wait for the results
4. Download the data in JSON, CSV, or Excel format

---

## ⚠️ Limitations

- Only works with **public accounts**
- Private account highlights cannot be accessed
- Rate limits may apply when scraping many accounts at once — use `delayBetweenRequestsMs` to slow down if needed

---

## 💡 Tips

- Start with a small number of accounts to test
- The account must have **active highlights** for data to be available
- Increase `delayBetweenRequestsMs` (e.g. to `3000`) if you are getting rate-limited
- Use `maxRetries` to handle transient errors automatically

---

## 🏷️ Tags

`instagram highlights scraper` `instagram highlights downloader` `instagram highlights viewer` `download instagram highlights` `instagram highlights extractor` `instagram highlights api` `instagram highlights batch` `instagram highlights apify actor`
