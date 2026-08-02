# Bank logo assets

Served at `/banks/<bank-id>.svg` and referenced from `Bank.logoUrl`, which the
API supplies as data. **No component ever builds one of these paths** — adding
a bank means adding its `logoUrl`, not editing a component.

## The files here are placeholders, not official logos

They are neutral coloured tiles bearing each bank's short code. They exist so
the pipeline — model → API → component → `next/image` → rendered logo — is
demonstrably working end to end, and so swapping in the real assets is a file
replacement with no code change.

**They are not the banks' marks and must not ship to production.**

## Replacing them

Drop the licensed asset at the same path and filename:

| Bank                | File             |
| ------------------- | ---------------- |
| IDFC FIRST Bank     | `idfc-first.svg` |
| HDFC Bank           | `hdfc.svg`       |
| Kotak Mahindra Bank | `kotak.svg`      |
| State Bank of India | `sbi.svg`        |
| ICICI Bank          | `icici.svg`      |
| Axis Bank           | `axis.svg`       |

Requirements for a replacement:

- **SVG preferred**, or a transparent-background PNG at 2× the largest slot
  (112 px) if vector is unavailable.
- **Any aspect ratio is safe.** The badge fits the logo with `object-contain`
  inside a circular slot, so wide wordmarks letterbox rather than distort.
- **Square-ish marks read best** at 32 px, which is the smallest slot in use.
- Keep the filename; the path is the contract.

Delete a file and the UI degrades to the two-letter monogram automatically —
that is the designed fallback, not a failure state.

## Licensing — needs confirmation before production

These are third-party trademarks. Displaying partner banks' marks normally
requires permission under the partnership agreement, and the terms often
constrain size, clear space, and colour treatment. This has **not** been
verified for this project. Someone with authority should confirm it before the
real assets are committed.

If permission is not available for a given bank, set that bank's `logoUrl` to
`null` and it will show the monogram — no code change required.
