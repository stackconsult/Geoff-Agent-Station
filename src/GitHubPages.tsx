export default function GitHubPages() {
  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <h1 className="text-4xl font-bold mb-4">Tolaria</h1>
      <p className="text-xl text-slate-300 mb-8">
        Desktop application for vault management, note-taking, AI productivity, and automation.
      </p>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-slate-800 p-6 rounded-lg">
          <h2 className="text-2xl font-bold mb-2 text-indigo-400">Vault Management</h2>
          <p className="text-slate-300">Organize notes and documents with advanced search.</p>
        </div>
        <div className="bg-slate-800 p-6 rounded-lg">
          <h2 className="text-2xl font-bold mb-2 text-purple-400">AI-Powered</h2>
          <p className="text-slate-300">Local AI for summarization and content generation.</p>
        </div>
        <div className="bg-slate-800 p-6 rounded-lg">
          <h2 className="text-2xl font-bold mb-2 text-pink-400">Automation</h2>
          <p className="text-slate-300">Build custom workflows for productivity tasks.</p>
        </div>
        <div className="bg-slate-800 p-6 rounded-lg">
          <h2 className="text-2xl font-bold mb-2 text-cyan-400">Productivity</h2>
          <p className="text-slate-300">Time tracking, Pomodoro, clipboard history.</p>
        </div>
      </div>
      <div className="mt-8">
        <a href="https://github.com/stackconsult/Geoff-Agent-Station" className="text-indigo-400 hover:text-indigo-300">
          View on GitHub →
        </a>
      </div>
    </div>
  );
}
