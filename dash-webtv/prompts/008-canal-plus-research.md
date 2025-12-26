# Canal+ Content Research for Guinea Market

<objective>
Research and document reliable Canal+ and premium African content streams for DASH WebTV Guinea market entry. Find working sources, understand the landscape, and create actionable integration plan.
</objective>

<context>
- DASH WebTV is a Netflix-style streaming platform targeting West Africa (Guinea first)
- Current content: 155K+ items (81K free IPTV + 74K StarShare VOD)
- Canal+ is THE premium content provider in Francophone Africa
- Guinea market needs: Canal+ Afrique, SuperSport, beIN Sports, Trace Africa
- Backend: Railway (Node.js), Frontend: Vercel (vanilla JS)
- Free IPTV sources already integrated: iptv-org, PlutoTV, Free-TV
</context>

<research_tasks>
1. **Canal+ Stream Landscape**
   - Search for Canal+ Afrique IPTV streams (legal gray area sources)
   - Find existing GitHub repos with Canal+ playlists
   - Check iptv-org for Canal+ channels status
   - Document which Canal+ channels are commonly available

2. **Premium African Sports**
   - SuperSport Africa streams
   - beIN Sports MENA (French commentary)
   - African football leagues coverage
   - FIFA+ free content (already identified)

3. **Francophone Entertainment**
   - Trace Africa, Trace Urban
   - TV5Monde (free, legal)
   - France 24 Afrique (free, legal)
   - A+ (Canal+ Africa entertainment)
   - Novelas TV (popular in Guinea)

4. **Technical Feasibility**
   - Stream format analysis (HLS vs MPEG-TS)
   - Geographic restrictions (what works from Malaysia/Guinea)
   - Proxy requirements
   - Stream stability assessment

5. **Alternative Approaches**
   - Official Canal+ API possibilities
   - Reseller/white-label options
   - Partnership opportunities
   - Legal streaming aggregators
</research_tasks>

<output_requirements>
Create a comprehensive report at `/home/dash/zion-github/dash-webtv/docs/CANAL_PLUS_RESEARCH_REPORT.md` with:

1. **Executive Summary** - Key findings in 5 bullet points
2. **Working Sources Found** - Table with URL, channels, format, stability rating
3. **Integration Recommendations** - Prioritized list of what to add
4. **Technical Notes** - Format handling, proxy needs, geographic issues
5. **Risk Assessment** - Legal/stability risks for each source
6. **Action Items** - Concrete next steps with priority levels

Format all stream URLs in a way that can be directly added to the backend.
</output_requirements>

<tools_to_use>
- WebSearch for finding IPTV repositories and discussions
- WebFetch for checking GitHub repos and playlist files
- Grep/Glob if checking existing codebase for related code
- Write for creating the final report
</tools_to_use>

<success_criteria>
1. Report created at specified path
2. At least 5 potentially working Canal+ related sources documented
3. Technical format for each source identified
4. Clear priority ranking for integration
5. Risk assessment included
</success_criteria>

<constraints>
- DO NOT modify any existing code - research only
- DO NOT expose provider credentials in the report
- Focus on sources that work from residential IPs
- Prioritize stability over quantity
</constraints>
