# IPTV Funnel - Guinea Market

**"DASH IPTV - Essai Gratuit 24H"** - First West Africa conquest target

## What This Is

IPTV subscription funnel for Guinea market. Built Oct 2024 during IPTV empire expansion phase.

**Value Proposition**:
- 10,000+ TV channels
- 60,000+ movies & series
- Netflix, Disney+, Sports, etc.
- Free 24h trial
- From 50,000 GNF/month

## Files

### Frontend
- **iptv-landing-page.html** (12KB) - Landing page in French
  - Beautiful gradient design (purple theme)
  - WhatsApp CTA integration
  - Mobile-responsive
  - Channel showcase

### Backend/Automation
- **iptv-whatsapp-blaster.js** (4.4KB) - WhatsApp campaign automation
- **send-iptv-now.js** (5.9KB) - Send IPTV offers via WhatsApp
- **fetch-50-customers-for-iptv.js** (2.6KB) - Target customer fetching from Notion
- **iptv-cli.js** (4.6KB) - CLI management tool

### Documentation
- **iptv-database-design.md** (5.2KB) - Complete database structure
  - Notion database schema
  - Customer properties
  - Subscription tracking
  - Integration with DASH-Base

## Database Strategy

**Separate IPTV-Base database** (recommended approach):
- Clean separation from Netflix subscriptions
- Links to existing customers via relations
- Properties: Username, Password, Account Type, Status, Expiration
- Account Types: Trial (24h), 1 Month, 3 Months, 6 Months
- Status tracking: Active, Expired, Suspended, Pending

## Current Status

**Built but not deployed**. Files ready for production deployment.

**Next Steps**:
1. Set up hosting for landing page
2. Create IPTV-Base in Notion
3. Configure WhatsApp automation
4. Launch free trial campaign
5. Target existing DASH-Base customers first

## Market Opportunity

**Guinea IPTV Market**:
- Growing demand for streaming
- Netflix customers already familiar with digital subscriptions
- Higher price point than Netflix (50k+ GNF vs 40k GNF)
- Includes sports, local channels, movies
- Recurring revenue model

**Conversion Strategy**:
- Offer to existing Netflix customers (45 total)
- Free 24h trial reduces friction
- WhatsApp-first communication
- Personal touch from DASH

## Integration with DASH-Base

IPTV complements Netflix subscriptions:
- **Cross-sell opportunity**: Offer IPTV to Netflix customers
- **Higher ARPU**: Some customers want both services
- **Diversification**: Multiple revenue streams
- **Customer retention**: More services = stickier customers

---

**Built**: October 2024
**Status**: Ready for deployment
**Target Market**: Guinea (first conquest)
**Owner**: DASH-Base
