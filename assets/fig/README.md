Generated artifacts. Read-only: edit the spec in hgplot, not the SVG.

| file | spec | regenerate |
|---|---|---|
| `chart.svg` | `hgplot: ir/samples/08-storage-gap.mjs` | `node ir/tools/site-svg/jtione-chart.mjs ir/samples/08-storage-gap.mjs <here>/chart.svg` |

The SVG is also inlined in `index.html`: an `<img src>` cannot inherit the
`--chart-*` CSS variables that make the figure follow the page theme. After
regenerating, paste it over the `<svg>` in the Research-theme `<figure>`.
