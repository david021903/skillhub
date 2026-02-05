import DocsLayout from "@/components/DocsLayout";

export default function CLISearch() {
  return (
    <DocsLayout
      title="Search & Browse"
      description="Find skills from the command line"
    >
      <h2>Searching for Skills</h2>
      <p>
        Search for skills by keyword, name, or description:
      </p>
      <div className="not-prose bg-muted/50 border rounded-lg p-4 my-4">
        <pre className="bg-[hsl(222,47%,8%)] text-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
{`shsc search "web scraping"

# Output:
# Found 8 skills matching "web scraping"
#
# 1. skillhub/web-scraper (v1.2.0) ⭐ 42
#    Scrape and extract data from websites
#
# 2. skillhub/html-parser (v1.0.0) ⭐ 28
#    Parse and extract data from HTML documents
#
# 3. beans8/advanced-scraper (v2.0.0) ⭐ 15
#    Advanced web scraping with JavaScript rendering`}
        </pre>
      </div>

      <h3>Limiting Results</h3>
      <div className="not-prose bg-muted/50 border rounded-lg p-4 my-4">
        <pre className="bg-[hsl(222,47%,8%)] text-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
{`# Show only the top 5 results
shsc search "automation" --limit 5`}
        </pre>
      </div>

      <h2>Browsing Popular Skills</h2>
      <p>
        Browse the most popular skills without a search query:
      </p>
      <div className="not-prose bg-muted/50 border rounded-lg p-4 my-4">
        <pre className="bg-[hsl(222,47%,8%)] text-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
{`shsc search browse

# Opens an interactive browser showing trending and popular skills`}
        </pre>
      </div>

      <h2>Tips for Finding Skills</h2>
      <ul>
        <li>Use specific keywords related to what you need</li>
        <li>Search by technology: <code>shsc search "python"</code></li>
        <li>Search by use case: <code>shsc search "data extraction"</code></li>
        <li>Search by tool: <code>shsc search "docker"</code></li>
      </ul>

      <div className="not-prose bg-primary/5 border border-primary/20 rounded-lg p-4 my-4">
        <p className="text-sm">
          <strong>💡 Tip:</strong> You can also browse skills on the web at{" "}
          <a href="https://skillhub.space/browse" className="text-primary hover:underline">
            skillhub.space/browse
          </a>{" "}
          for a richer visual experience with filtering and sorting options.
        </p>
      </div>
    </DocsLayout>
  );
}
