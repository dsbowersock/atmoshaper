# Report font

Noto Sans Regular is used only in locally generated Business Planner PDFs.
The application interface fonts are unchanged. The original font is redistributed
unmodified with its SIL Open Font License in `OFL.txt`.

Source: https://raw.githubusercontent.com/notofonts/noto-fonts/main/hinted/ttf/NotoSans/NotoSans-Regular.ttf

License: https://raw.githubusercontent.com/notofonts/noto-fonts/main/LICENSE

SHA-256: `B85C38ECEA8A7CFB39C24E395A4007474FA5A4FC864F6EE33309EB4948D232D5`

The PDF exporter checks glyph coverage and reports unsupported text without
silently replacing it. The browser print option retains the original HTML text
and can use system font fallback for scripts outside this font's coverage.
