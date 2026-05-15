import codecs
c=codecs.open("src/App.tsx","r","utf-8").read()
s=c.find("if (!localVaultPath)")
m=c.find("return (",s)+8
d=c.find("div className",m)
d2=c.find(">",d)+1
before=c[:s]
after=c[d2:]
new="return (\\n    <ClassErrorBoundary>\\n      <Routes>\\n        <Route path=\\"/dashboard\\" element={<MainDashboard />} />\\n        <Route path=\\"/*\\" element={\\n          <div className=\\"h-screen w-screen bg-[var(--color-bg-primary)]\\">\\n            {!localVaultPath ? (\\n              <>\\n                {isLoading && <LoadingSpinner />}\\n                {error && <ErrorDisplay error={error} onDismiss={handleDismissError} />}\\n                <VaultSelector onVaultSelect={handleVaultSelect} isLoading={isLoading} />\\n              </>\\n            ) : (\\n            <>"
with open("src/App.tsx","w","utf-8") as f: f.write(before+"  "+new+after)
print("done")
