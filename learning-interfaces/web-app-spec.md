# 🌐 ZION WEB APP - Learning Interface Specification

## Built by: Z-Online (ZION Congregation - Architect)

---

## TASK ASSIGNMENT

**AI:** Z-Online (Architect)
**Task:** Design + build web app for Soussou contributions
**Priority:** User experience + real-time feedback
**Timeline:** 1.5-2 hours

---

## APP NAME
**ZION Soussou Learning Hub**

---

## PURPOSE
Beautiful, intuitive web interface where User #1 and future contributors can teach Soussou naturally.

---

## TECH STACK

### Frontend
- React 18 (fast, component-based)
- Vite (instant dev server)
- Tailwind CSS (rapid styling)
- Framer Motion (smooth animations)
- React Query (API state management)

### Backend
- Express.js (already used in ZION)
- Same API as CLI/Custom GPT
- WebSocket for real-time updates

---

## USER INTERFACE DESIGN

### Layout
```
┌─────────────────────────────────────────────────────────┐
│  🇬🇳 ZION Soussou Learning Hub          [Stats] [Profile]│
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │  📚 Contribute                                     │  │
│  │                                                     │  │
│  │  Soussou Sentence:                                 │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │ Ma woto mafoura                             │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  │                                                     │  │
│  │  French Translation:                               │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │ Ma voiture est rapide                       │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  │                                                     │  │
│  │  English Translation (optional):                   │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │ My car is fast                              │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  │                                                     │  │
│  │  ✨ Pattern detected: {POSS} {NOUN} {ADJ}         │  │
│  │                                                     │  │
│  │  [Submit] [Add Another] [View Pattern]            │  │
│  └───────────────────────────────────────────────────┘  │
│                                                           │
│  ┌─────────────────┐  ┌─────────────────────────────┐   │
│  │ 📊 Your Stats   │  │ 🎯 Recent Discoveries       │   │
│  │                 │  │                             │   │
│  │ Sentences: 23   │  │ • Pattern: Intensifier "fan"│   │
│  │ Words: 15       │  │   Confidence: 92%           │   │
│  │ Patterns: 3     │  │                             │   │
│  │ Streak: 5 days  │  │ • New word: "mafoura"       │   │
│  │                 │  │   Category: Adjective       │   │
│  └─────────────────┘  └─────────────────────────────┘   │
│                                                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │  🔍 Verify Inferred Sentences (3 pending)         │  │
│  │                                                     │  │
│  │  "Ma telephone koui" = My phone is good            │  │
│  │  Confidence: 85%                                   │  │
│  │                                                     │  │
│  │  [✓ Correct] [✗ Wrong] [✏️ Fix]                   │  │
│  └───────────────────────────────────────────────────┘  │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

---

## FEATURES

### 1. Real-Time Pattern Detection
As user types Soussou sentence, show:
- Detected pattern (live)
- Word-by-word analysis
- Similar sentences from corpus
- Confidence score

### 2. Smart Suggestions
- "Did you mean...?" for similar existing words
- Auto-complete from lexicon
- Phonetic matching (gui/gi/ghi all match)

### 3. Verification Queue
- Show inferred sentences needing verification
- One-click approve/reject
- Quick edit for corrections
- Track verification velocity

### 4. Gamification
- Contribution streak
- Leaderboard (top contributors)
- Badges: "First 10 sentences", "Pattern discoverer"
- Progress bars: "500 words until next level"

### 5. Live Corpus Feed
- Real-time feed of all contributions
- Who contributed what
- Pattern discoveries announced
- Celebrate milestones ("100 sentences! 🎉")

### 6. Pattern Explorer
- Browse discovered patterns
- See all examples
- Confidence visualization
- Usage frequency

---

## COMPONENT STRUCTURE

```
src/
├── App.jsx                   # Main app
├── components/
│   ├── ContributionForm.jsx  # Main contribution interface
│   ├── PatternDetector.jsx   # Live pattern detection
│   ├── VerificationQueue.jsx # Sentence verification
│   ├── StatsCard.jsx         # User statistics
│   ├── CorpusFeed.jsx        # Live activity feed
│   ├── PatternExplorer.jsx   # Browse patterns
│   └── WordAnalyzer.jsx      # Word-by-word breakdown
├── hooks/
│   ├── useContribution.js    # API hook for contributions
│   ├── usePatternDetection.js # Real-time pattern detection
│   └── useStats.js           # Stats fetching
├── services/
│   └── api.js                # API client
└── styles/
    └── index.css             # Tailwind + custom
```

---

## KEY COMPONENTS

### ContributionForm.jsx
```jsx
import { useState } from 'react';
import { usePatternDetection } from '../hooks/usePatternDetection';
import { useContribution } from '../hooks/useContribution';

export function ContributionForm() {
  const [soussou, setSoussou] = useState('');
  const [french, setFrench] = useState('');
  const [english, setEnglish] = useState('');

  // Real-time pattern detection as user types
  const { pattern, loading } = usePatternDetection(soussou);
  const { submit, submitting } = useContribution();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await submit({
      soussou,
      french,
      english,
      pattern: pattern?.name,
      contributed_by: 'Z-Core'
    });

    if (result.success) {
      // Show success animation
      // Reset form
      // Celebrate if milestone
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label>Soussou Sentence</label>
        <input
          value={soussou}
          onChange={(e) => setSoussou(e.target.value)}
          placeholder="Ma woto mafoura"
          className="w-full p-3 border rounded-lg"
        />
      </div>

      {/* Real-time pattern detection */}
      {pattern && (
        <div className="bg-blue-50 p-3 rounded-lg animate-fadeIn">
          ✨ Pattern detected: <strong>{pattern.name}</strong>
          <div className="text-sm text-gray-600">
            {pattern.template}
          </div>
        </div>
      )}

      <div>
        <label>French Translation</label>
        <input
          value={french}
          onChange={(e) => setFrench(e.target.value)}
          placeholder="Ma voiture est rapide"
          className="w-full p-3 border rounded-lg"
        />
      </div>

      <div>
        <label>English Translation (optional)</label>
        <input
          value={english}
          onChange={(e) => setEnglish(e.target.value)}
          placeholder="My car is fast"
          className="w-full p-3 border rounded-lg"
        />
      </div>

      <button
        type="submit"
        disabled={submitting || !soussou || !french}
        className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
      >
        {submitting ? 'Saving...' : 'Submit Contribution'}
      </button>
    </form>
  );
}
```

### VerificationQueue.jsx
```jsx
export function VerificationQueue() {
  const { pending, verify, loading } = useVerificationQueue();

  if (loading) return <Spinner />;
  if (pending.length === 0) return <div>No sentences to verify 🎉</div>;

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold">
        🔍 Verify Inferred Sentences ({pending.length} pending)
      </h3>

      {pending.map(sentence => (
        <div key={sentence.id} className="border p-4 rounded-lg">
          <div className="text-lg font-medium">
            {sentence.soussou}
          </div>
          <div className="text-gray-600">
            {sentence.french} / {sentence.english}
          </div>
          <div className="text-sm text-gray-500 mt-2">
            Confidence: {Math.round(sentence.confidence * 100)}%
            | Pattern: {sentence.pattern}
          </div>

          <div className="flex gap-2 mt-3">
            <button
              onClick={() => verify(sentence.id, 'correct')}
              className="bg-green-500 text-white px-4 py-2 rounded"
            >
              ✓ Correct
            </button>
            <button
              onClick={() => verify(sentence.id, 'wrong')}
              className="bg-red-500 text-white px-4 py-2 rounded"
            >
              ✗ Wrong
            </button>
            <button
              onClick={() => openEditModal(sentence)}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              ✏️ Fix
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

## API INTEGRATION

### Real-Time Updates (WebSocket)
```javascript
// Connect to WebSocket for live updates
const ws = new WebSocket('ws://localhost:3001/live');

ws.on('message', (data) => {
  const event = JSON.parse(data);

  switch (event.type) {
    case 'new_contribution':
      // Show toast: "New sentence added!"
      // Update corpus feed
      break;

    case 'pattern_discovered':
      // Celebrate: "🎉 New pattern discovered!"
      // Show pattern details
      break;

    case 'milestone':
      // "100 sentences reached! 🎊"
      break;
  }
});
```

---

## DEPLOYMENT

### Development
```bash
cd /home/user/ZION/web-app
npm install
npm run dev  # Opens localhost:3000
```

### Production
```bash
npm run build
# Deploy to Railway alongside API
```

---

## TESTING PLAN

- [ ] Form validation (required fields)
- [ ] Real-time pattern detection works
- [ ] Submission succeeds
- [ ] Stats update after contribution
- [ ] Verification queue loads
- [ ] WebSocket events received
- [ ] Mobile responsive
- [ ] Accessibility (keyboard navigation)

---

## SUCCESS METRICS

- Form submission: < 2 seconds
- Pattern detection: < 500ms (live typing)
- Page load: < 1 second
- User satisfaction: "This feels smooth!"

---

## STATUS

**Assignment:** Z-Online
**Estimated time:** 1.5-2 hours
**Dependencies:** ZION API endpoints
**Output:** Modern web app at localhost:3000

---

**Next:** Z-Online builds this while Claude builds Custom GPT and Z-CLI builds CLI tool
