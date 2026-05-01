import React from 'react';
import { createProofSummary, createTimeline } from './index.js';

const toneClass = {
  info: 'tooltrace-event--info',
  success: 'tooltrace-event--success',
  warning: 'tooltrace-event--warning',
  error: 'tooltrace-event--error',
  blocked: 'tooltrace-event--blocked',
  approval: 'tooltrace-event--approval',
};

export function ToolTrace({ events = [], mode = 'compact', showProofSummary = false, filters = {}, onOpenFile }) {
  const timeline = createTimeline(events, { includeRaw: false });
  const visibleGroups = timeline.groups
    .map((group) => ({
      ...group,
      events: group.events.filter((event) => !filters.category || event.category === filters.category),
    }))
    .filter((group) => group.events.length > 0);

  if (!events.length) {
    return React.createElement('section', { className: 'tooltrace tooltrace--empty', 'aria-label': 'ToolTrace activity timeline' },
      React.createElement('p', null, 'No agent activity yet.'));
  }

  return React.createElement('section', { className: `tooltrace tooltrace--${mode}`, 'aria-label': 'ToolTrace activity timeline' },
    visibleGroups.map((group) => React.createElement('article', { key: group.id, className: `tooltrace-group ${toneClass[group.severity]}`, tabIndex: 0 },
      React.createElement('header', { className: 'tooltrace-group__header' },
        React.createElement('h3', null, group.title),
        React.createElement('span', { 'aria-label': `Group severity ${group.severity}` }, group.severity)),
      React.createElement('ol', { className: 'tooltrace-events' },
        group.events.map((event) => React.createElement('li', { key: event.id, className: `tooltrace-event ${toneClass[event.severity]}`, tabIndex: 0 },
          React.createElement('div', { className: 'tooltrace-event__meta' },
            React.createElement('time', { dateTime: event.timestamp }, event.timestamp),
            React.createElement('strong', null, event.category)),
          React.createElement('div', { className: 'tooltrace-event__title' }, event.title),
          event.body ? React.createElement('p', { className: 'tooltrace-event__body' }, event.body) : null,
          event.file?.path && onOpenFile ? React.createElement('button', { type: 'button', onClick: () => onOpenFile(event.file.path) }, `Open ${event.file.path}`) : null))))),
    showProofSummary ? React.createElement('pre', { className: 'tooltrace-proof-summary' }, createProofSummary(timeline)) : null);
}

export function ToolTraceProofSummary({ events = [], format = 'markdown' }) {
  return React.createElement('pre', { className: 'tooltrace-proof-summary' }, createProofSummary(events, { format }));
}
