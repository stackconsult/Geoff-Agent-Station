# G2-G5 Smoke Test Execution Guide

## Prerequisites
- Tolaria desktop app is running (MainWindowTitle: "Tolaria")
- App has been rebuilt with console logging (commit with logging)
- Ollama service is running (for G5 test, you'll need to stop it)

## Test Environment
- App executable: `C:\Users\Geoff Parsons\AppData\Local\dev-it\dev-it.exe`
- Console logging enabled in App.tsx and vaultStore.ts
- DevTools available for checking console logs

---

## G2: Vault Selection Test

**Purpose:** Verify vault detection and loading

### Steps
1. Launch Tolaria app if not already running
2. If vault path is already set in localStorage, clear it:
   - Open DevTools (F12)
   - Go to Application → Local Storage
   - Remove `tolaria_vault_path` key
   - Reload app (Ctrl+R)
3. Click "Browse for Vault" button
4. Navigate to a valid Obsidian vault folder
5. Select the vault folder
6. Wait for notes to load

### Expected Results
- [ ] Native file picker opens successfully
- [ ] Notes populate in sidebar within 2 seconds
- [ ] Note count displays in status bar
- [ ] No loading spinner stuck indefinitely
- [ ] Folder tree structure visible in sidebar

### Console Logs to Check
```
[App] No vault path found in localStorage, showing VaultSelector
[vaultStore] Loading notes from: <selected path>
[vaultStore] Loaded <n> notes
```

### Test Result
- [ ] **PASS**
- [ ] **FAIL**

### Notes (if FAIL)
_______________________________________________
Vault path: _________________________________
Error message: _____________________________
Console errors: ____________________________

---

## G3: Note Edit Test

**Purpose:** Verify note loading and editing

### Steps
1. Ensure vault is loaded (from G2)
2. Click any note in the sidebar
3. Wait for content to load in editor
4. Type a few characters in the editor
5. Wait 3 seconds

### Expected Results
- [ ] Note content loads correctly (not blank)
- [ ] Editor is editable (cursor visible, typing works)
- [ ] Sync indicator shows "syncing" then "saved" after typing
- [ ] Last sync time updates in status bar
- [ ] No error messages during typing

### Console Logs to Check
```
[App] Note selected: <note path>
[vaultStore] Loading note content from: <note path>
[editor] Content updated, sync status: syncing
[editor] Content updated, sync status: saved
```

### Test Result
- [ ] **PASS**
- [ ] **FAIL**

### Notes (if FAIL)
Note path: _________________________________
Error message: _____________________________
Editor behavior: __________________________

---

## G4: Save Test

**Purpose:** Verify save + backup cleanup

### Steps
1. Ensure vault is loaded and a note is open
2. Make a small edit (add a character)
3. Press Ctrl+S (or Cmd+S)
4. Check file system for .bak files in vault directory

### Expected Results
- [ ] File saved (timestamp updated in file system)
- [ ] No .bak files left in vault directory (cleanup works)
- [ ] Sync status shows "Synced" in status bar
- [ ] No error messages
- [ ] Editor remains responsive

### Console Logs to Check
```
[vaultStore] Saving note to: <note path>
[vaultStore] Note saved successfully
[vaultStore] Cleaning up backup files
```

### Manual Verification
- Open vault folder in File Explorer
- Check for any .bak files
- Verify note file timestamp is recent

### Test Result
- [ ] **PASS**
- [ ] **FAIL**

### Notes (if FAIL)
Note path: _________________________________
Save error: ______________________________
.bak files found: _________________________

---

## G5: AI Offline Test

**Purpose:** Verify graceful error handling when Ollama is unavailable

### Steps
1. Ensure Ollama is NOT running:
   - Open Task Manager
   - Find and stop ollama.exe process
   - Or run: `taskkill /F /IM ollama.exe`
2. In Tolaria, open AI panel (click AI button in status bar)
3. Type a chat message
4. Send the message

### Expected Results
- [ ] Error message displayed in AI panel (not silent failure)
- [ ] App remains responsive (not frozen or crashed)
- [ ] Can close AI panel
- [ ] Can continue editing notes
- [ ] No console errors that break app functionality

### Console Logs to Check
```
[AI] Attempting to connect to Ollama
[AI] Connection failed: <error message>
[AI] Error displayed to user
```

### Recovery
- Restart Ollama service after test
- Verify AI panel works again when Ollama is running

### Test Result
- [ ] **PASS**
- [ ] **FAIL**

### Notes (if FAIL)
Error message displayed: _________________
App behavior: __________________________
Console errors: __________________________

---

## Test Summary

### Overall Result
- [ ] **ALL TESTS PASS** — Ready for Phase 1.2 (CI verification)
- [ ] **1+ TESTS FAIL** — Fix blockers before proceeding

### Blockers (if any)
List any issues that must be fixed before proceeding to multi-dashboard architecture:
_______________________________________________
_______________________________________________
_______________________________________________

### Approval to Proceed
- [ ] **Approved for Phase 1.2** — CI pipeline verification
- [ ] **Reject — fix blockers first**

### Tester Information
**Tester Name:** ___________  
**Date:** ___________  
**App Version:** Current master branch (eceb960)

---

## After Testing

### If All Tests Pass
1. Update SMOKE_TESTS.md with test results
2. Mark G2-G5 as PASS
3. Proceed to Phase 1.2: Verify CI Pipeline

### If Tests Fail
1. Document failures in SMOKE_TESTS.md
2. Identify root cause
3. Fix issues
4. Rebuild and redeploy app
5. Retest failed tests
