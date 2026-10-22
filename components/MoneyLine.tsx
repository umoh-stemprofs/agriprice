import { formatNaira } from "@/lib/format";
import type { SellStatus } from "@/lib/sellWindow";

/**
 * The money line under a sell/hold sentence, in one place so the dashboard,
 * the crop detail page and the cost preview can never disagree:
 * - Hold: what waiting would earn.
 * - Sell now while waiting would lose: how much.
 * - Sell now but waiting would still earn a little: the extra sentence that
 *   keeps the badge and the number from contradicting each other.
 * Nothing is shown when there is no stock or no decision yet (NEED_DATA).
 */
export function MoneyLine({
  status,
  changeIfWaitKobo,
}: {
  status: SellStatus;
  changeIfWaitKobo: number;
}) {
  if (status === "NEED_DATA" || changeIfWaitKobo === 0) return null;

  if (status === "HOLD") {
    return <p className="font-medium">Could earn {formatNaira(changeIfWaitKobo)} more if you wait.</p>;
  }

  if (changeIfWaitKobo < 0) {
    return (
      <p className="font-medium">Waiting would lose {formatNaira(Math.abs(changeIfWaitKobo))}.</p>
    );
  }

  return (
    <p className="text-ink-muted">
      Waiting would earn about {formatNaira(changeIfWaitKobo)}, but less than your minimum gain.
    </p>
  );
}
