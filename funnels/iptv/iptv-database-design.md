# IPTV-BASE DATABASE DESIGN

## 🎯 INTEGRATION STRATEGY

**Option 1: Separate Database (RECOMMENDED)**
- New Notion database: "IPTV-Base"
- Link to existing customer profiles via relation
- Keeps services separate, easier to manage
- Clean separation of concerns

**Option 2: Unified Database**
- Add "Service Type" property to existing DASH-Base
- Single view of all subscriptions
- More complex but unified

**GOING WITH OPTION 1** - Cleaner architecture

---

## 📊 IPTV-BASE DATABASE STRUCTURE

### Properties:

1. **Customer Name** (Title)
   - Type: Title
   - Example: "Diallo"

2. **Username** (Text)
   - Type: Text
   - IPTV login username
   - Example: "Diallo"

3. **Password** (Text)
   - Type: Text
   - IPTV login password
   - Example: "Diallo1231"

4. **Account Type** (Select)
   - Type: Select
   - Options: Trial (24h), 1 Month, 3 Months, 6 Months
   - Default: "1 Month"

5. **Status** (Select)
   - Type: Select
   - Options: Active, Expired, Suspended, Pending
   - Color coding: Green (Active), Red (Expired), Yellow (Suspended), Blue (Pending)

6. **Expiration Date** (Date)
   - Type: Date
   - Exact expiry date/time
   - Example: 2025-11-24 14:10:53

7. **Days Until Expiry** (Formula)
   - Type: Formula
   - `dateBetween(prop("Expiration Date"), now(), "days")`
   - Auto-calculates days remaining

8. **Created Date** (Created Time)
   - Type: Created time
   - Auto-populated

9. **Last Renewed** (Date)
   - Type: Date
   - Tracks renewal history

10. **Credits Used** (Number)
    - Type: Number
    - How many credits this account cost
    - Trial = 0, 1 Month = 1, etc.

11. **WhatsApp** (Phone)
    - Type: Phone
    - Customer contact
    - Example: +224 XXX XXX XXX

12. **Email** (Email)
    - Type: Email
    - Customer email (optional)

13. **Payment Status** (Select)
    - Type: Select
    - Options: Paid, Pending, Overdue
    - Color: Green, Yellow, Red

14. **Amount Paid** (Number)
    - Type: Number
    - In GNF
    - Example: 15000

15. **Connection URL** (URL)
    - Type: URL
    - Link to reseller panel user page

16. **Notes** (Text)
    - Type: Text
    - Any additional notes

17. **Alert Status** (Formula)
    - Type: Formula
    - Auto-determines alert level
    - `if(prop("Days Until Expiry") < 0, "⚠️ EXPIRED", if(prop("Days Until Expiry") <= 1, "🔴 URGENT", if(prop("Days Until Expiry") <= 3, "🟡 WARNING", if(prop("Days Until Expiry") <= 7, "🟢 UPCOMING", "✅ OK"))))`

18. **Netflix Customer** (Relation)
    - Type: Relation
    - Links to DASH-Base database
    - Shows if they're also a Netflix customer

---

## 📋 VIEWS

### 1. ALL CUSTOMERS (Main Table)
- Default view showing all customers
- Sorted by Expiration Date (ascending)

### 2. ACTIVE SUBSCRIPTIONS
- Filter: Status = "Active"
- Shows current paying customers

### 3. EXPIRING SOON (7 Days)
- Filter: Days Until Expiry <= 7 AND Status = "Active"
- Sorted by Expiration Date
- **CRITICAL FOR RENEWAL REMINDERS**

### 4. EXPIRED
- Filter: Status = "Expired" OR Days Until Expiry < 0
- Shows accounts needing renewal

### 5. TRIALS
- Filter: Account Type = "Trial (24h)"
- Track trial conversions

### 6. PAYMENT PENDING
- Filter: Payment Status = "Pending" OR "Overdue"
- Follow up on payments

### 7. DUAL CUSTOMERS (Netflix + IPTV)
- Filter: Netflix Customer is not empty
- Shows customers with both services

---

## 🔗 INTEGRATION WITH DASH-BASE

**Cross-Database Relations:**

1. Add to DASH-Base: "IPTV Subscription" (Relation)
   - Links to IPTV-Base
   - Shows if Netflix customer also has IPTV

2. Shows unified customer profile:
   - Name
   - Netflix status
   - IPTV status
   - Combined revenue
   - Total relationship value

---

## 📊 DASHBOARD METRICS

**Track:**
- Total IPTV customers
- Active subscriptions
- Credits remaining (48 currently)
- Monthly revenue (IPTV)
- Trial → Paid conversion rate
- Churn rate
- Average customer lifetime value

---

## 🤖 AUTOMATION TRIGGERS

**Based on database state:**

1. **7 Days Before Expiry**
   - WhatsApp: "Hey [Name], your IPTV renews in 7 days!"
   - Offer renewal options

2. **3 Days Before Expiry**
   - WhatsApp: "REMINDER: IPTV expires in 3 days"
   - Payment link/instructions

3. **1 Day Before Expiry**
   - WhatsApp: "URGENT: IPTV expires tomorrow!"
   - Final reminder

4. **On Expiration**
   - Update Status to "Expired"
   - WhatsApp: "Service expired, renew to continue"

5. **Trial Created**
   - WhatsApp: Send credentials immediately
   - Include setup instructions

6. **Payment Received**
   - Create/extend account in reseller panel
   - Update Notion database
   - WhatsApp: "Payment confirmed, service activated!"

---

## 💾 SAMPLE DATA STRUCTURE

```json
{
  "Customer Name": "Diallo",
  "Username": "Diallo",
  "Password": "Diallo1231",
  "Account Type": "1 Month",
  "Status": "Active",
  "Expiration Date": "2025-11-24T14:10:53",
  "Days Until Expiry": 29,
  "Created Date": "2025-10-24T14:10:53",
  "Last Renewed": "2025-10-24",
  "Credits Used": 1,
  "WhatsApp": "+224123456789",
  "Payment Status": "Paid",
  "Amount Paid": 15000,
  "Alert Status": "✅ OK",
  "Netflix Customer": "Diallo (relation to DASH-Base)"
}
```

---

*Designed by ZION for DASH Entertainment Services*
