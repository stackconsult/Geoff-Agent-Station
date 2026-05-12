# Tolaria Runtime Smoke Tests

## Purpose
Manual acceptance testing to verify critical user journeys work end-to-end. These tests cannot be automated as they require human verification of UI behavior and UX quality.

---

## G1: Cold Start Test

**Purpose:** Verify app loads without vault (fresh install scenario)

### Steps
1. Clear localStorage: In browser DevTools → Application → Local Storage → Remove `tolaria_vault_path`
2. Reload app (Ctrl+R or Cmd+R)
3. Observe initial UI state

### Expected Results
- [ ] Professional VaultSelector UI displays (not blank screen)
- [ ] "Browse for Vault" button visible and clickable
- [ ] No error messages in console or UI
- [ ] No white screen or loading spinner stuck
- [ ] App is responsive to user interaction

### Result
- [ ] **PASS**
- [ ] **FAIL**

### Notes (if FAIL)
_______________________________________________


---

## G2: Vault Selection Test

**Purpose:** Verify vault detection and loading

### Steps
1. Click "Browse for Vault" button
2. Navigate to and select a valid Obsidian vault folder
3. Wait for notes to load

### Expected Results
- [ ] Native file picker opens successfully
- [ ] Notes populate in sidebar within 2 seconds
- [ ] Note count displays in status bar
- [ ] No loading spinner stuck indefinitely
- [ ] Folder tree structure visible

### Result
- [ ] **PASS**
- [ ] **FAIL**

### Notes (if FAIL)
_______________________________________________


---

## G3: Note Edit Test

**Purpose:** Verify note loading and editing

### Steps
1. Click any note in the sidebar
2. Wait for content to load in editor
3. Type a few characters in the editor
4. Wait 3 seconds

### Expected Results
- [ ] Note content loads correctly (not blank)
- [ ] Editor is editable (cursor visible, typing works)
- [ ] Sync indicator shows "syncing" then "saved"
- [ ] Last sync time updates in status bar
- [ ] No error messages during typing

### Result
- [ ] **PASS**
- [ ] **FAIL**

### Notes (if FAIL)
_______________________________________________


---

## G4: Save Test

**Purpose:** Verify save + backup cleanup

### Steps
1. Open an existing note
2. Make a small edit (add a character)
3. Press Ctrl+S (or Cmd+S)
4. Check file system for .bak files in vault

### Expected Results
- [ ] File saved (timestamp updated)
- [ ] No .bak files left in vault directory (cleanup works)
- [ ] Sync status shows "Synced"
- [ ] No error messages
- [ ] Editor remains responsive

### Result
- [ ] **PASS**
- [ ] **FAIL**

### Notes (if FAIL)
_______________________________________________


---

## G5: AI Offline Test

**Purpose:** Verify graceful error handling when Ollama is unavailable

### Steps
1. Ensure Ollama is NOT running (stop service if needed)
2. Open AI panel
3. Send a chat message

### Expected Results
- [ ] Error message displayed in AI panel (not silent failure)
- [ ] App remains responsive (not frozen or crashed)
- [ ] Can close AI panel
- [ ] Can continue editing notes
- [ ] No console errors that break app functionality

### Result
- [ ] **PASS**
- [ ] **FAIL**

### Notes (if FAIL)
_______________________________________________


---

## SIGN-OFF

### Tester Information
**Tester Name:** ___________  
**Date:** ___________  
**Version:** ___________ (git commit hash)

### Overall Result
- [ ] **ALL TESTS PASS** — Ready for deployment
- [ ] **1+ TESTS FAIL** — Do not deploy

### Blockers (if any)
List any issues that must be fixed before deployment:
_______________________________________________
_______________________________________________
_______________________________________________

### Approval
- [ ] **Approved for deployment**
- [ ] **Reject — fix blockers first**

**Signature:** ___________
