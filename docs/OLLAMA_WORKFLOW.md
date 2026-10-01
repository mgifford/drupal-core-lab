# OLLAMA_WORKFLOW.md

## Goal

Reduce costs and increase privacy by shifting summarization and text-generation tasks to a local Ollama LLM, while keeping code and environment operations in VS Code and DDEV.

## What can be shifted to Ollama

- Summarizing Drupal.org issues or other web content
- Generating plain-language explanations or checklists
- Drafting or rewording documentation and policy text
- Brainstorming accessibility or usability test steps
- Creating evidence templates or boilerplate markdown

## What should remain in VS Code/agent

- Codebase exploration, search, and editing
- Running terminal commands (ddev, drush, git, etc.)
- Automated evidence capture (screenshots, logs)
- Integration with local Drupal/DDEV environment
- File creation, commit, and version control

## Example workflow

1. **Summarize an issue:**
   - Copy the issue text or URL.
   - Use a local script or VS Code extension to send the text to Ollama at `http://localhost:11434/`.
   - Paste the summary or checklist back into your working markdown file.

2. **Draft documentation:**
   - Use Ollama to generate or reword policy/process docs.
   - Review and edit in VS Code before committing.

3. **Keep code and environment tasks local:**
   - Use VS Code and DDEV for all code, config, and environment changes.

## Sample curl command for Ollama

```
curl -X POST http://localhost:11434/api/generate \
  -d '{"model": "llama2", "prompt": "Summarize this Drupal issue: ..."}'
```

Replace `llama2` with your preferred local model.

## Optional: VS Code integration

- Use an Ollama VS Code extension or a custom script to send selected text to Ollama and insert the result.
- Example extensions: "Ollama Chat", "Ollama VSCode" (search the marketplace).

## Notes

- Always review Ollama output for accuracy and clarity before using in documentation or commits.
- For sensitive or private data, local LLMs provide better privacy than cloud models.
- For code or environment changes, continue using your current agent and VS Code tools.

---

_This workflow helps you balance privacy, cost, and productivity by using local LLMs for text, and VS Code/DDEV for code and environment tasks._
