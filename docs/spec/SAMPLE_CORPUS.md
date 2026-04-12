# Sample Corpus: Public-Domain Demonstration

## Chosen Work

**Edgar Allan Poe — _The Tell-Tale Heart_ (1843).**

## Why This Work

- Very short and manageable for repository-first demos.
- Recognizable and clearly public-domain.
- Has distinct entities (narrator, old man, police officers).
- Has a compact but structured event progression useful for timeline modeling.

## Segmentation Strategy

The story is segmented into three manuscript units:

1. `01-opening-confession.md` — narrator voice and obsession setup.
2. `02-the-murder.md` — execution of the act.
3. `03-police-arrival.md` — aftermath and confession.

This segmentation is not a claim about original publication chaptering; it is a TRURL operational split for metadata and revision workflows.

## What This Corpus Tests

- Frontmatter presence and required fields in manuscript and bible files.
- Cross-references between manuscript IDs and story-bible IDs.
- Timeline linking from events back to manuscript units.
- Use of `notes/` and `revision/` for editorial work adjacent to canon text.

## Future Stress-Test Corpora

Larger projects can stress performance and schema limits, for example:

- _Moby-Dick_
- _Ivanhoe_
- _The King James Bible_

Those corpora should be added later once indexing and validation scale concerns are addressed.
