const fs = require('fs');
let f = fs.readFileSync('src/App.tsx', 'utf8');

// Step 1: Remove early return and add Routes wrapper
const oldBlock = `  if (!localVaultPath) {
    return (
      <ClassErrorBoundary>
        <div className="h-screen w-screen bg-[var(--color-bg-primary)]">
          {isLoading && <LoadingSpinner />}
          {error && <ErrorDisplay error={error} onDismiss={handleDismissError} />}
          <VaultSelector onVaultSelect={handleVaultSelect} isLoading={isLoading} />
        </div>
      </ClassErrorBoundary>
    );
  }

  return (
    <ClassErrorBoundary>
      <div className="h-screen w-screen bg-[var(--color-bg-primary)]">`;

const newBlock = `  return (
    <ClassErrorBoundary>
      <Routes>
        <Route path="/dashboard" element={<MainDashboard />} />
        <Route path="/*" element={
          <div className="h-screen w-screen bg-[var(--color-bg-primary)]">`;

f = f.replace(oldBlock, newBlock);

// Step 2: Add VaultSelector conditional and close Routes
const oldClose = `      </div>
      <SettingsPanel`;

const newClose = `      </div>
          }
        />
      </Routes>
      <SettingsPanel`;

f = f.replace(oldClose, newClose);

fs.writeFileSync('src/App.tsx', f);
console.log('done');
