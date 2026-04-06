# Plan

## Status
Phase 1 (Core MVP) is almost complete. Steps 1-6 from DESIGN.md have been mostly implemented (Auth, DB schema, Match CRUD, `/api/suggest` text input, checkout webhook).
Next phase involves implementing Steps 7-8 and 10 from DESIGN.md: Style profile extraction, Profile bio reviewer, and Screenshot/vision input path.

## Phases
### Phase 2: Iteration Features
- [ ] #1 Implement Style Profile Extraction (background process post-selection)
- [ ] #2 Implement Profile Bio Reviewer API and UI
- [ ] #3 Implement Screenshot/Vision input path in ConversationInput and `/api/suggest`

---

## Issues to create

```bash
gh issue create \
  --title "[Phase 2] Implement Style Profile Extraction (background process post-selection)" \
  --label "agent:jules,status:ready" \
  --body "## Task
Implement a background API route that extracts style signals from a chosen suggestion and updates the user's \`styleProfile\` field. Trigger this route asynchronously when a user selects a reply in the UI.

## Context
**Style profile update:** After user selects a reply, a background call sends the chosen text to a lightweight prompt that extracts style signals and merges them into \`user.styleProfile\`. Non-blocking.

## Affected-subtrees
app/api/style-profile/
components/SuggestionCard.tsx
components/MatchList.tsx

## Acceptance criteria
- [ ] A new POST route \`/api/style-profile\` is created that receives chosen text, asks Claude to infer style, and updates the user's \`styleProfile\`.
- [ ] The frontend triggers this POST route without blocking the user experience when they choose a suggestion.
- [ ] The user's \`styleProfile\` in the database is successfully updated with the merged JSON blob.
"
```

```bash
gh issue create \
  --title "[Phase 2] Implement Profile Bio Reviewer API and UI" \
  --label "agent:jules,status:ready" \
  --body "## Task
Implement the Profile Bio Reviewer. This includes creating an API route \`/api/profile/review\` and filling out \`components/ProfileReviewer.tsx\` and \`app/app/profile/page.tsx\` to allow a user to paste their dating app bio and get rewrite suggestions.

## Context
Profile review: paste your bio, get rewrite suggestions.
Step 8: Profile bio reviewer (separate prompt, same endpoint pattern).

## Affected-subtrees
app/app/profile/
app/api/profile/review/
components/ProfileReviewer.tsx

## Acceptance criteria
- [ ] A user can access the \`/app/profile\` page and see a text area for their bio.
- [ ] A new POST route \`/api/profile/review\` accepts bio text and uses Anthropic to generate rewrite suggestions.
- [ ] The UI displays the rewrite suggestions.
"
```

```bash
gh issue create \
  --title "[Phase 2] Implement Screenshot/Vision input path" \
  --label "agent:jules,status:ready" \
  --body "## Task
Enable uploading screenshots in the frontend so users can pass an image alongside or instead of text input to \`/api/suggest\`. Ensure the image is converted to base64 and sent correctly to the API.

## Context
Image handling: if \`imageBase64\` provided, pass as vision content block alongside the text prompt. Claude extracts the conversation natively. (The API side for handling imageBase64 is mostly stubbed out, but needs frontend integration and full testing).
Step 10: Screenshot/vision input path.

## Affected-subtrees
components/ConversationInput.tsx

## Acceptance criteria
- [ ] The image upload button in \`ConversationInput.tsx\` works and allows uploading an image file.
- [ ] The file is converted to a base64 string and sent in the \`imageBase64\` field to \`/api/suggest\`.
- [ ] Claude receives the image correctly and can generate suggestions based on the screenshot.
"
```
