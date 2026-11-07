# Swiss Minimal Ledger CSS Primitives

## 1. Exposed Grid Frame (`ledger-frame`)

```css
.ledger-frame {
  display: grid;
  grid-template-columns: 390px 1fr;
  border: 1px solid var(--line-strong);
  background: var(--surface);
}
.panel-left {
  border-right: 1px solid var(--line);
  padding: 24px;
  background: var(--paper);
}
```

## 2. Tabular Financial Table

```css
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.86rem;
  font-variant-numeric: tabular-nums;
}
th {
  font-family: var(--mono);
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ink-muted);
  border-bottom: 1px solid var(--line-strong);
  padding: 8px 10px 8px 0;
}
th.num, td.num { text-align: right; }
```
