# Review checklist

`createReviewChecklist(events)` returns a small checklist for humans reviewing agent proof.

The checklist intentionally answers product-review questions rather than replacing tests:

1. Were commands shown in plain language?
2. Were file changes named?
3. Did checks pass, or are failures explained?
4. Are approval requests visible?
5. Are blockers resolved?
6. Is completion proof present?

Use it in review UIs with `showReviewChecklist` on the React component, or render the returned items in your own interface.
