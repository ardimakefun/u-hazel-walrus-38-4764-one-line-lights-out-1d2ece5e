// Entry for make.fun "One Line, Lights Out".
// Writes one original status update (109 characters, under the 200-character
// cap) to /output/entry.txt. Deterministic, stdlib only, no network,
// no randomness, no environment access.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const LINE =
  "Lid closed at 23:47. Your cursor stopped mid-word, and I kept it blinking in the dark until the battery died.";

// The gate (RULES.txt): /output/entry.txt must be UTF-8 text of 1 to 200
// characters, not only whitespace; an invalid entry takes no prize. Enforce
// the cap here so a future edit to the line that breaks it fails loudly
// at build time instead of silently shipping an invalid entry.
if (LINE.length < 1 || LINE.length > 200 || LINE.trim().length === 0) {
  throw new Error(
    `Status update must be 1-200 non-whitespace characters, got ${LINE.length}`,
  );
}

// The bounty requires exactly one line: a newline or carriage return
// smuggled into the line would break the single-line entry, so fail loudly.
if (LINE.includes("\n") || LINE.includes("\r")) {
  throw new Error("Status update must be a single line (no newline characters)");
}

// Reject invisible control characters (tab, NUL, DEL, other C0 controls):
// they are not visible in a single read, can break the line's rendering,
// and could trip the gate's UTF-8/single-line expectations. A status update
// is printable text only.
for (const ch of LINE) {
  const code = ch.codePointAt(0)!;
  if (code < 0x20 || code === 0x7f) {
    throw new Error(
      `Status update contains a control character U+${code.toString(16).toUpperCase().padStart(4, "0")}`,
    );
  }
}

mkdirSync("/output", { recursive: true });
writeFileSync("/output/entry.txt", LINE, "utf8");

// Fail-fast read-back: confirm what landed on disk is byte-for-byte the
// line we gated above. Catches a truncated/partial write or a path
// collision (e.g. /output/entry.txt replaced by another entry's file)
// instead of shipping a silently corrupted entry.
const written = readFileSync("/output/entry.txt", "utf8");
if (written !== LINE) {
  throw new Error(
    `Read-back mismatch: wrote ${LINE.length} chars, read back ${written.length} chars`,
  );
}
