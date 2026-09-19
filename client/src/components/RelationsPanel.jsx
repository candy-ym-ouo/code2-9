function relationTone(value) {
  if (value >= 70) return 'friendly';
  if (value >= 45) return 'neutral';
  if (value >= 20) return 'strained';
  return 'hostile';
}

function formatDelta(value) {
  return `${value > 0 ? '+' : ''}${value}`;
}

export default function RelationsPanel({ game, relationChanges = [] }) {
  const islandMap = new Map(game.islands.map((island) => [island.id, island]));
  const letterMap = new Map(game.letters.map((letter) => [letter.id, letter]));

  // 优先展示当前方案的预演变化；没有预演变化时回退到最近一次结算快照。
  // 快照直接读取存档中的 lastReport，刷新页面或重复结算都不会改写它。
  const previewChanges = Array.isArray(relationChanges) && relationChanges.length > 0
    ? relationChanges
    : null;
  const snapshot = game.lastReport;
  const snapshotChanges = !previewChanges && Array.isArray(snapshot?.relationChanges) && snapshot.relationChanges.length > 0
    ? snapshot.relationChanges
    : null;
  const displayedChanges = previewChanges ?? snapshotChanges ?? [];
  const sourceLabel = previewChanges
    ? '变化来源：当前调度方案预演'
    : snapshotChanges
      ? `变化来源：第 ${snapshot.day} 日结算快照`
      : null;
  const changes = new Map(displayedChanges.map((change) => [change.key, change]));

  return (
    <section className="panel relations-panel" aria-labelledby="relations-title">
      <div className="panel-heading compact">
        <div>
          <p className="eyebrow">外交电报</p>
          <h2 id="relations-title">岛屿关系</h2>
        </div>
        <span className="relation-average">均值 {game.averageRelation}</span>
      </div>
      <div className="relation-list">
        {Object.entries(game.relations).map(([key, value]) => {
          const [firstId, secondId] = key.split(':');
          const change = changes.get(key);
          const isLimited = change && change.requestedDelta !== undefined && change.requestedDelta !== change.delta;
          const sources = Array.isArray(change?.sources) ? change.sources : [];
          const reasons = Array.isArray(change?.reasons) ? change.reasons : [];
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
                  <em className={change.delta > 0 ? 'positive' : change.delta < 0 ? 'negative' : ''} tabIndex={0}>
                    {formatDelta(change.delta)}{isLimited ? '*' : ''}
                    <span className="relation-tip" role="tooltip">
                      {sources.map((source) => {
                        const letter = letterMap.get(source.letterId);
                        return (
                          <span className="relation-tip-line" key={source.letterId}>
                            <code>{source.letterId}</code>
                            <span>{letter?.subject ? `${letter.subject} · ` : ''}{source.note}</span>
                            <b className={source.delta > 0 ? 'positive' : source.delta < 0 ? 'negative' : ''}>
                              {formatDelta(source.delta)}
                            </b>
                          </span>
                        );
                      })}
                      {sources.length === 0 && reasons.map((reason) => (
                        <span className="relation-tip-line" key={reason}>
                          <span>{reason}</span>
                        </span>
                      ))}
                      {isLimited && (
                        <span className="relation-tip-limit">
                          请求变化 {formatDelta(change.requestedDelta)}，触及 −100 ~ 100 上下限，实际结算 {formatDelta(change.delta)}
                        </span>
                      )}
                    </span>
                  </em>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="relation-footnote">
        {sourceLabel && <span className="relation-source">{sourceLabel}</span>}
        <span>关系值范围 −100 ~ 100；标 * 的变化已触及上下限，按实际变化结算。悬停变化值可追溯来源邮件。</span>
      </div>
    </section>
  );
}
