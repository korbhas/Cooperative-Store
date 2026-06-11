<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->


Source Code Reference

Source code for dependencies is cached at ~/.opensrc/ for deeper understanding of implementation details.

See ~/.opensrc/sources.json for the list of available packages and their versions.

Use this source code when you need to understand how a package works internally, not just its types/interface.
Fetching Source Code

To just cache a package's source without doing anything else, use opensrc fetch:

opensrc fetch <package>
opensrc fetch pypi:<package> crates:<package> <owner>/<repo>

npx opensrc fetch <package> npx opensrc fetch pypi:<package> crates:<package> <owner>/<repo>

Reading Source Code

Use opensrc path inside other commands to search, read, or explore a package's source (fetches on cache miss):

rg "pattern" $(opensrc path <package>)
cat $(opensrc path <package>)/path/to/file
find $(opensrc path <package>) -name "*.ts"

rg "pattern" $(npx opensrc path <package>) cat $(npx opensrc path <package>)/path/to/file find $(npx opensrc path <package>) -name "*.ts"


Works with any registry:

rg "pattern" $(opensrc path pypi:<package>)
rg "pattern" $(opensrc path crates:<package>)
rg "pattern" $(opensrc path <owner>/<repo>)

