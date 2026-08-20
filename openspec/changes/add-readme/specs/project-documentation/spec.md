## ADDED Requirements

### Requirement: README in Japanese and English
The repository SHALL include a `README.md` (English) and a `README.ja.md` (Japanese), each describing the project's purpose, installation instructions, main features, and developer setup (build/test/lint commands). Each file SHALL link to the other language's version.

#### Scenario: Visitor reads the English README
- **WHEN** a visitor opens `README.md` at the repository root
- **THEN** they find the project's purpose, installation instructions, main features, developer setup commands, and a link to `README.ja.md`

#### Scenario: Visitor reads the Japanese README
- **WHEN** a visitor opens `README.ja.md`
- **THEN** they find the same content in Japanese, and a link to `README.md`

### Requirement: Installation instructions reference the actual distribution URL
The README SHALL instruct users to install the userscript via the `stable` branch's built userscript URL, matching the URL configured in `src/header.ts` and produced by the deploy workflow.

#### Scenario: Installation link matches the distributed userscript
- **WHEN** a user follows the installation instructions in either README
- **THEN** the referenced URL is `https://raw.githubusercontent.com/kuchida1981/demaecan-no-ghosts/stable/demaecan-no-ghosts.user.js`
