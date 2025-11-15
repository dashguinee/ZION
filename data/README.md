# Soussou Engine - Agent Output Data

**Purpose**: Storage for parallel agent processing outputs

## Coordination

**Web ZION** (claude.ai) produces:
- `vocabulary-raw.json` - All Soussou words/phrases extracted from filtered context
- `example-conversations.json` - Conversation examples with translations
- `cultural-guidelines.md` - DASH tone, authenticity rules, street talk patterns

**CLI ZION** (local) produces:
- `grammar-patterns.md` - SOAM word order, pronouns, verbs, negation
- `phonetic-rules.json` - Normalization rules for phonetic variants
- `web-resources.md` - Additional online Soussou/Pular resources (optional)

## Merge Process

After all agents complete, one instance runs **Lexicon Builder Agent** to merge all outputs into:
- `../soussou-lexicon-v0.1.json` - Unified lexicon (root directory)

## Timeline

- **Day 1 (Nov 15)**: Agent execution → outputs populate this directory
- **Day 2 (Nov 16)**: Merge into lexicon v0.1
- **Day 3 (Nov 17)**: Custom GPT build & testing

**Status**: Ready for parallel agent launch 🚀
