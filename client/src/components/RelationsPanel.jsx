import { useState } from 'react';
import { isRelationChangeClamped, RELATION_BOUNDS, RELATION_OUTCOME_LABELS } from '../utils.js';

function relationTone(value) {
  if (value >= 70) return 'friendly';
  if (value >= 45) return 'neutral';
  if (value >= 20) return 'strained';
  return 'hostile';
}

function formatDelta(delta) {
  return `${delta > 0 ? '+' : ''}${delta}`;
}

function sourcesFor(change, letterMap) {
  if (Array.isArray(change.sources) && change.sources.length > 0) {
    return change.sources.map((source) => {
      const letter = letterMap.get(source.letterId);
      return {
        letterId: source.letterId,
        delta: source.delta,
        label: `${letter ? `《${letter.subject}》` : ''}${RELATION_OUTCOME_LABELS[source.outcome] ?? source.outcome}`
      };
    });
  }
  // 旧存档没有结构化来源，回退到结算时记录的文字说明。
  return (change.reasons || []).map((reason) => {
    const letterId = reason.split(' ')[0];
    const letter = letterMap.get(letterId);
    const detail = reason.slice(letterId.length).trim();
    return {
      letterId,
      delta: null,
      label: letter ? `《${letter.subject}》${detail}` : reason
    };
  });
}

export default function RelationsPanel({ game, relationChanges = [], lastReport = null }) {
  const [activeKey, setActiveKey] = useState(null);
  const islandMap = new Map(game.islands.map((island) => [island.id, island]));
  const letterMap = new Map(game.letters.map((letter) => [letter.id, letter]));

  // 优先展示当前方案的预计变化；没有预计变化时回退到最近一次结算快照。
  // 快照来自服务端持久化的 lastReport，刷新或重复结算请求都不会改写它。
  const previewChanges = Array.isArray(relationChanges) ? relationChanges : [];
  const snapshotChanges = previewChanges.length === 0 && Array.isArray(lastReport?.relationChanges)
    ? lastReport.relationChanges
    : [];
  const activeChanges = previewChanges.length > 0 ? previewChanges : snapshotChanges;
  const mode = previewChanges.length > 0 ? 'preview' : snapshotChanges.length > 0 ? 'snapshot' : null;
  const modeLabel = mode === 'preview'
    ? `第 ${game.day} 日方案预计`
    : mode === 'snapshot'
      ? `第 ${lastReport.day} 日结算快照`
      : null;

  const changes = new Map(activeChanges.map((change) => [change.key, change]));
  const activeChange = activeKey ? changes.get(activeKey) : null;

  return (
    <section className="panel relations-panel" aria-labelledby="relations-title">
      <div className="panel-heading compact">
        <div>
          <p className="eyebrow">外交电报</p>
          <h2 id="relations-title">岛屿关系</h2>
        </div>
        <div className="relation-heading-meta">
          <span className="relation-average">均值 {game.averageRelation}</span>
          {modeLabel && <span className={`relation-mode ${mode}`}>{modeLabel}</span>}
        </div>
      </div>
      <div className="relation-list">
        {Object.entries(game.relations).map(([key, value]) => {
          const [firstId, secondId] = key.split(':');
          const change = changes.get(key);
          const isLimited = isRelationChangeClamped(change);
          const hoverTitle = change
            ? [
                `变化来源：${(change.reasons || []).join('；') || '无'}`,
                isLimited
                  ? `申请 ${formatDelta(change.requestedDelta)}，受上下限（${RELATION_BOUNDS.min} ~ ${RELATION_BOUNDS.max}）限制，实际 ${formatDelta(change.delta)}`
                  : null
              ].filter(Boolean).join('\n')
            : undefined;
          return (
            <div className="relation-row" key={key}>
              <div className="relation-label">
                <span>{islandMap.get(firstId)?.name}</span>
                <i>↔</i>
                <span>{islandMap.get(secondId)?.name}</span>
              </div>
              <div className="relation-value">
                <div className="relation-track">
                  <i className={relationTone(value)} style={{ width: `${Math.max(0, value)}%` }} />
                </div>
                <b>{value}</b>
                {change && (
                  <em
                    className={`relation-delta ${change.delta > 0 ? 'positive' : change.delta < 0 ? 'negative' : ''} ${isLimited ? 'clamped' : ''}`}
                    tabIndex={0}
                    onMouseEnter={() => setActiveKey(key)}
                    onMouseLeave={() => setActiveKey(null)}
                    onFocus={() => setActiveKey(key)}
                    onBlur={() => setActiveKey(null)}
                    title={hoverTitle}
                  >
                    {formatDelta(change.delta)}{isLimited ? '*' : ''}
                  </em>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="relation-footnote">
        {activeChange ? (
          <div className="relation-sources">
            <b>变化来源 · {modeLabel}</b>
            <ul>
              {sourcesFor(activeChange, letterMap).map((source, index) => (
                <li key={`${source.letterId}-${index}`}>
                  <code>{source.letterId}</code>
                  <span>{source.label}</span>
                  {source.delta !== null && (
                    <i className={source.delta > 0 ? 'positive' : source.delta < 0 ? 'negative' : ''}>
                      {formatDelta(source.delta)}
                    </i>
                  )}
                </li>
              ))}
            </ul>
            {isRelationChangeClamped(activeChange) && (
              <small>
                申请 {formatDelta(activeChange.requestedDelta)}，受上下限（{RELATION_BOUNDS.min} ~ {RELATION_BOUNDS.max}）限制，实际 {formatDelta(activeChange.delta)}
              </small>
            )}
          </div>
        ) : (
          <p>
            关系值范围 {RELATION_BOUNDS.min} ~ {RELATION_BOUNDS.max}，结算时超出部分会被截断并标 *。
            {mode ? '悬停或聚焦变化值可追溯来源邮件。' : '当日结算或调度方案产生的变化会显示在这里。'}
          </p>
        )}
      </div>
    </section>
  );
}
