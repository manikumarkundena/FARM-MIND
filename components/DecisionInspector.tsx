import type { ReplayStep } from "@/lib/replay";

interface DecisionInspectorProps {
  frame: ReplayStep | null;
}

export default function DecisionInspector({ frame }: DecisionInspectorProps) {
  if (!frame) {
    return (
      <aside className="decision-inspector">
        <div className="inspector-empty">Waiting for replay data...</div>
      </aside>
    );
  }

  const telemetry = frame.telemetry;
  const marketOrders = frame.market_orders ?? [];
  const marketPrice =
    telemetry?.target_crop && frame.market_prices
      ? frame.market_prices[telemetry.target_crop]
      : null;

  return (
    <aside className="decision-inspector">
      <div className="inspector-top">
        <div>
          <span className="inspector-kicker">DECISION TRACE</span>
          <h2>Why FARM-MIND acted</h2>
        </div>
        <span className="strategy-version">V1</span>
      </div>

      <div className="decision-action">
        <span>FARMER ACTION</span>
        <strong>{frame.action}</strong>
      </div>

      {marketOrders.length > 0 && (
        <div className="inspector-section">
          <span>MARKET ORDERS</span>
          <div className="market-orders">
            {marketOrders.map((order, index) => (
              <div key={`${order.join("-")}-${index}`} className="market-order">
                {order.map((part, i) => <span key={i}>{part}</span>)}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="inspector-grid">
        <div>
          <span>OBJECTIVE</span>
          <strong>{telemetry?.objective ?? "—"}</strong>
        </div>
        <div>
          <span>TARGET</span>
          <strong>
            {telemetry?.target_tile
              ? `[${telemetry.target_tile.join(", ")}]`
              : "—"}
          </strong>
        </div>
        <div>
          <span>CROP</span>
          <strong>{telemetry?.target_crop ?? "—"}</strong>
        </div>
        <div>
          <span>PRIORITY</span>
          <strong>{telemetry?.priority ?? "—"}</strong>
        </div>
      </div>

      <div className="decision-reason">
        <span>DECISION REASON</span>
        <p>{telemetry?.reason ?? "No telemetry recorded."}</p>
      </div>

      <div className="decision-metrics">
        <div>
          <span>EST. VALUE</span>
          <strong>
            {typeof telemetry?.expected_value === "number"
              ? `$${telemetry.expected_value.toLocaleString()}`
              : "—"}
          </strong>
        </div>
        <div>
          <span>{telemetry?.target_crop ? "MARKET PRICE" : "CAPITAL"}</span>
          <strong>
            {telemetry?.target_crop
              ? `$${marketPrice ?? "—"}`
              : `$${frame.p0_money.toLocaleString()}`}
          </strong>
        </div>
      </div>

      <div className="inspector-footer">
        <span>DECISION STEP</span>
        <strong>{telemetry?.decision_step ?? "—"}</strong>
        <span>ACTION STEP</span>
        <strong>{telemetry?.action_step ?? "—"}</strong>
      </div>
    </aside>
  );
}
