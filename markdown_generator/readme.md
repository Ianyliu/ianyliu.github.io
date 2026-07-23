# Optional content generators

These retained Academic Pages utilities convert TSV or BibTeX data into Jekyll
Markdown collection entries. They are not part of the normal website build.

Run the TSV scripts from this directory so their relative input and output paths
resolve correctly:

```bash
python -m pip install pandas
python publications.py
python talks.py
```

Review generated files before committing them. The scripts write directly to
`_publications/` and `_talks/`, so a duplicate filename will be overwritten.
The notebooks provide the same workflows with explanatory cells.



