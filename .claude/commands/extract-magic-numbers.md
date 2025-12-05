# Extract Magic Numbers and Strings

Run detection script on a TypeScript file to find repeated magic numbers,
strings, and potential constants.

## Instructions

1. **Determine target file**: If user provided a file path, use it.
   Otherwise, ask which file to analyze.

2. **Run the detection script**: Execute the script using Bash tool:
   ```bash
   bun .claude/extract-magic-numbers.ts <file-path>
   ```

3. **Analyze the output**: Review each repeated value and determine:
   - Are the uses semantically related?
   - Does an existing constant already cover this?
   - Is extraction worthwhile?
   - What would be a meaningful constant name?

4. **Present findings**: For each value worth extracting, show:
   - The value and its usage locations
   - Whether to extract it or skip it (with reasoning)
   - Suggested constant name and location
   - Example of how to refactor

5. **Format output** clearly with sections for:
   - **Recommended extractions** (values that should become constants)
   - **Skip** (values that don't need extraction, with reasons)

## Guidelines

- Skip extractions for:
  - Unrelated uses (coincidental same value)
  - Values already in constants
  - Self-explanatory values in context
  - Discriminated union patterns

- Extract when:
  - Same value represents same concept across uses
  - Changes to the value would require multiple edits
  - The value's meaning isn't obvious from context

- Suggest names based on purpose, not value:
  - Good: `ANIMATION_DELAY_MS`, `ActionType.FOLD`
  - Bad: `ONE_THOUSAND`, `FOLD_STRING`

## If user wants to apply suggestions

Ask which suggestions to apply, then:
1. Create constants at appropriate scope (file-level or shared)
2. Replace all usages with constant references
3. Run tests to verify no breakage