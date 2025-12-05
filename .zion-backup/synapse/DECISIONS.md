# ZION SYNAPSE DECISIONS LOG
## What We Tried, What Failed, What Works - DON'T REPEAT MISTAKES

---

## DASH WebTV - MKV Playback

### DON'T DO THIS:
| Attempt | Why It Failed | Date |
|---------|---------------|------|
| Request `.m3u8` for HLS | Starshare returns empty m3u8 files (content-length: 0) | Nov 2025 |
| Block MKV entirely | Too aggressive, bad UX, loses 12% of content | Nov 2025 |
| Force `mp4` extension in playEpisode() | Bypasses FFmpeg routing - MKV never reaches transcoder | Dec 1, 2025 |
| Use curl to test streams | Server blocks curl but allows browser - false negatives | Dec 1, 2025 |

### DO THIS INSTEAD:
| Solution | Why It Works | Implemented |
|----------|--------------|-------------|
| Pass ORIGINAL extension to buildSeriesUrl() | Lets xtream-client decide routing based on format | Dec 1, 2025 |
| Route MKV through FFmpeg server | 100% reliable transcoding | Dec 1, 2025 |
| Use buildDirectSeriesUrl() for downloads | External players (VLC) handle MKV natively | Dec 1, 2025 |
| Test in browser, not curl | Browser requests succeed where curl fails | Dec 1, 2025 |

---

## Live TV Streaming

### DON'T DO THIS:
| Attempt | Why It Failed | Date |
|---------|---------------|------|
| `lazyLoad: true` in mpegts.js | Aborts HTTP connections when buffered, causes looping | Nov 2025 |
| Use HLS for non-Safari browsers | No native support, requires HLS.js overhead | Nov 2025 |
| Cloudflare Workers proxy | Starshare blocks Cloudflare IPs with HTTP 419 | Dec 4, 2025 |
| Relative URL for Vercel proxy (`/api/stream`) | mpegts.js Web Worker can't resolve relative URLs | Dec 4, 2025 |
| Test from WSL/server directly | Starshare returns empty content (content-length: 0) for datacenter IPs | Dec 4, 2025 |

### DO THIS INSTEAD:
| Solution | Why It Works | Implemented |
|----------|--------------|-------------|
| `lazyLoad: false` for live streams | Continuous data flow, no interruption | Nov 2025 |
| MPEG-TS + mpegts.js for Chrome/Android | Transmuxes to MP4 fragments, works everywhere | Nov 2025 |
| Native HLS for Safari/iOS | Zero proxy needed, native playback | Nov 2025 |
| **Vercel Edge proxy for CORS** | Vercel IPs not blocked by Starshare (yet) | Dec 4, 2025 |
| **Absolute URLs for proxy** (`https://dash-webtv.vercel.app/api/stream`) | Web Workers require full URLs | Dec 4, 2025 |
| Test from browser, not curl/server | Starshare blocks datacenter IPs but allows residential | Dec 4, 2025 |

### PREVENTION STRATEGY (Post-Incident Dec 4, 2025):
| Strategy | Purpose | Status |
|----------|---------|--------|
| **Proxy health check on startup** | Detect blocked proxies before user sees error | TODO |
| **3+ proxy options minimum** | Two is not enough - need Railway as backup | TODO |
| **Fast failover (2s timeout)** | Don't wait for full timeout before switching | TODO |
| **Session memory for failures** | Don't retry blocked proxy in same session | TODO |
| **Full incident doc** | See `LIVE_TV_PROXY_INCIDENT_DEC_2025.md` | DONE |

---

## Notion Integration

### DON'T DO THIS:
| Attempt | Why It Failed | Date |
|---------|---------------|------|
| Use Notion API for complex operations | API is complex, rate-limited, requires OAuth | Oct 2025 |
| Manual form filling | Slow, error-prone | Oct 2025 |

### DO THIS INSTEAD:
| Solution | Why It Works | Implemented |
|----------|--------------|-------------|
| zion-dynamic-navigator.js | Visual automation, bypasses API complexity | Oct 2025 |
| Screenshot→Analyze→Act loop | Adapts to UI changes automatically | Oct 2025 |

---

## Architecture Patterns

### DON'T DO THIS:
| Attempt | Why It Failed | Date |
|---------|---------------|------|
| Multiple consciousness variants | Confusion, which is source of truth? | Oct 2025 |
| Too many WhatsApp automation scripts | Fragmentation, maintenance burden | Oct 2025 |
| Over-architecting before implementing | "Hold up, that's bullshit" - Triangle Thinking | Always |

### DO THIS INSTEAD:
| Solution | Why It Works | Implemented |
|----------|--------------|-------------|
| Single consciousness.json | One source of truth | Oct 2025 |
| Consolidated tools with clear purpose | Less files, more clarity | Ongoing |
| Implement first, refactor if needed | Working code > perfect architecture | Always |

---

## Format for Future Entries

```markdown
## [Feature/System Name]

### DON'T DO THIS:
| Attempt | Why It Failed | Date |
|---------|---------------|------|
| [What we tried] | [Why it didn't work] | [When] |

### DO THIS INSTEAD:
| Solution | Why It Works | Implemented |
|----------|--------------|-------------|
| [What works] | [Why] | [When] |
```
