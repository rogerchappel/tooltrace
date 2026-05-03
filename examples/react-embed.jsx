import { ToolTrace } from 'tooltrace/react';
import 'tooltrace/styles.css';

export function ReviewPanel({ events, openInEditor }) {
  return (
    <ToolTrace
      events={events}
      mode="review"
      showReviewChecklist
      showProofSummary
      onOpenFile={openInEditor}
    />
  );
}
