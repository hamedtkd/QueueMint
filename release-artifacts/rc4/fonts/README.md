# Samim font files

Font binaries are intentionally not committed or bundled in the source archive.

If `samim-font-v4.0.5.zip` is in your Downloads folder:

```powershell
npm run font:install
```

Or provide an explicit path:

```powershell
npm run font:install -- -ZipPath "C:\\path\\to\\samim-font-v4.0.5.zip"
```

The helper copies only these files here:

- `Samim.woff2`
- `Samim-Medium.woff2`
- `Samim-Bold.woff2`

Then rebuild the extension with `npm run build`.
