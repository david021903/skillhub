# skillbook CLI — Exact Contract (Blueprint)

Binary: `skillbook` (alias `sb`)

## Global Flags
- `--config <path>` (default: `~/.config/skillbook/config.toml`)
- `--json` machine-readable output
- `--quiet` / `--verbose`
- `--api <url>` override API base URL
- `--token <token>` override auth token

## Exit Codes
0 success • 1 generic • 2 bad args/validation • 3 auth • 4 network • 5 server • 6 conflict • 7 not found

## Config File (TOML)
`~/.config/skillbook/config.toml`
```toml
api_base = "https://api.skillbook.example.com"
git_base = "https://git.skillbook.example.com"
token = "sb_pat_xxx"
default_owner = "trendhype"
editor = "code"
```

## Commands (behavior)
- `skillbook auth login --email <email>`
- `skillbook auth logout`

- `skillbook repo create <owner>/<repo> [--private] [--desc "..."] [--topic <t>]...`
- `skillbook repo fork <owner>/<repo> --to <newOwner>/<newRepo>`
- `skillbook repo clone <owner>/<repo> [--branch <b>]`

- `skillbook skill init`
- `skillbook skill validate [--path <dir>] [--strict] [--format text|json]`
- `skillbook skill pack [--path <dir>] [--out <file.tgz>]`

- `skillbook pr create --repo <owner>/<repo> --base <branch> --head <branch> --title "..." [--body "..."]`
- `skillbook pr list --repo <owner>/<repo> [--state open|closed|merged]`
- `skillbook pr view --repo <owner>/<repo> --number <n>`
- `skillbook pr checks --repo <owner>/<repo> --number <n>`

- `skillbook publish --repo <owner>/<repo> --version <semver> [--commit <sha>] [--notes "..."]`
- `skillbook publish status --repo <owner>/<repo> --version <semver>`
- `skillbook publish yank --repo <owner>/<repo> --version <semver>`
- `skillbook publish unyank --repo <owner>/<repo> --version <semver>`

- `skillbook webhook add --owner <user|org|repo:owner/repo> --url <https://...> --events push,pull_request,publish`
- `skillbook webhook list --owner ...`
- `skillbook webhook delete --id <webhook_id>`

## JSON Output Shape
Success:
```json
{ "ok": true, "data": { }, "warnings": [], "meta": { "request_id": "..." } }
```
Error:
```json
{ "ok": false, "error": { "code": "AUTH_REQUIRED", "message": "...", "details": {} } }
```
