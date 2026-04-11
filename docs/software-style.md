# Software Style Memo

This project should stay a minimal Node.js + TypeScript CLI.

## Fixed Points

- The primary consumers are AI agents and programs
- Prefer machine readability over human-oriented formatting
- Prefer structures that simplify downstream automation
- Keep the project small enough to understand as a whole
- Keep dependencies minimal to preserve clarity and reproducibility
- Use English as the default language
- TODOs may be written in Japanese
- Write README in bilingual form: English first, then a separator line, then Japanese

## Design Shape

- Keep the core behavior in a single CLI
- Accept input through command-line arguments
- Return output as generated files
- Keep options minimal
- Prefer straightforward synchronous behavior
- Prefer Node standard APIs over external libraries

## Why This Shape

- Avoid framework overhead for a small CLI
- Make the output easy for AI agents and scripts to consume without recursive parsing
- Reduce implementation cost on the reader side
- Keep software-specific details in `docs/architecture.md`
