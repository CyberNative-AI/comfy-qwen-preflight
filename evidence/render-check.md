# Render check

Loopback static serve. design-measure.mjs (company QUALITY mechanical check) and focus-ring.mjs, 2026-09-30.

## Empty state
```

390x844
| check | result |
| --- | --- |
| horizontal overflow | ok (scrollWidth 390 / clientWidth 390) |
| sibling gaps (>=4px floor) | ok of 9 pairs |
| heading gaps (>=4px floor) | ok of 2 pairs |
| sibling gap differs from pattern | ok |
| heading gap differs from pattern | ok |
| navigation text rhythm (gap ±2px; row start ±1px) | ok of 0 navs |
| shared shell/content left edge (±1px) | ok of 2 wraps |
| reading/tap regions | main, header.site-header, footer.site-footer |
| reading text below 16px (>=40 chars) | ok |
| text runs exempted (structural/short) | 3 |
| tap targets below 48px (company bar) | ok |
| font-not-loaded | 0 |
| text-clipped | 0 |

1440x900
| check | result |
| --- | --- |
| horizontal overflow | ok (scrollWidth 1440 / clientWidth 1440) |
| sibling gaps (>=4px floor) | ok of 9 pairs |
| heading gaps (>=4px floor) | ok of 2 pairs |
| sibling gap differs from pattern | ok |
| heading gap differs from pattern | ok |
| navigation text rhythm (gap ±2px; row start ±1px) | ok of 0 navs |
| shared shell/content left edge (±1px) | ok of 2 wraps |
| reading/tap regions | main, header.site-header, footer.site-footer |
| reading text below 16px (>=40 chars) | not checked |
| text runs exempted (structural/short) | not checked |
| tap targets below 48px (company bar) | not checked |
| font-not-loaded | 0 |
| text-clipped | 0 |

MECHANICAL LAYOUT PASS: no flags; full technical and creative verdicts remain separate
```
## Result state (official Image Edit example run on load)
```

390x844
| check | result |
| --- | --- |
| horizontal overflow | ok (scrollWidth 390 / clientWidth 390) |
| sibling gaps (>=4px floor) | ok of 9 pairs |
| heading gaps (>=4px floor) | ok of 2 pairs |
| sibling gap differs from pattern | ok |
| heading gap differs from pattern | ok |
| navigation text rhythm (gap ±2px; row start ±1px) | ok of 0 navs |
| shared shell/content left edge (±1px) | ok of 2 wraps |
| reading/tap regions | main, header.site-header, footer.site-footer |
| reading text below 16px (>=40 chars) | ok |
| text runs exempted (structural/short) | 3 |
| tap targets below 48px (company bar) | ok |
| font-not-loaded | 0 |
| text-clipped | 0 |

1440x900
| check | result |
| --- | --- |
| horizontal overflow | ok (scrollWidth 1440 / clientWidth 1440) |
| sibling gaps (>=4px floor) | ok of 9 pairs |
| heading gaps (>=4px floor) | ok of 2 pairs |
| sibling gap differs from pattern | ok |
| heading gap differs from pattern | ok |
| navigation text rhythm (gap ±2px; row start ±1px) | ok of 0 navs |
| shared shell/content left edge (±1px) | ok of 2 wraps |
| reading/tap regions | main, header.site-header, footer.site-footer |
| reading text below 16px (>=40 chars) | not checked |
| text runs exempted (structural/short) | not checked |
| tap targets below 48px (company bar) | not checked |
| font-not-loaded | 0 |
| text-clipped | 0 |

MECHANICAL LAYOUT PASS: no flags; full technical and creative verdicts remain separate
```
## Focus ring
32 stops across both states and both viewports, 0 flagged (5.41:1 on paper, 5.95:1 on panel).
