import { describe, expect, it, vi } from "vitest";
import { isTransientDbError, withDbRetry } from "./db";

/**
 * Slow-database resilience (final click-through).
 * A pool timeout (Prisma P2024) or a reset connection is retried once; a real
 * error is never retried and never swallowed. These tests use plain Errors,
 * so they need no database (step 0: nothing here depends on the day).
 */

function poolTimeout(): Error {
  return Object.assign(
    new Error(
      "Timed out fetching a new connection from the connection pool. More info: http://pris.ly/d/connection-pool",
    ),
    { code: "P2024" },
  );
}

describe("isTransientDbError", () => {
  it("accepts the Prisma pool timeout code", () => {
    expect(isTransientDbError(poolTimeout())).toBe(true);
  });

  it("accepts a reset-connection message", () => {
    const error = new Error(
      "Error { kind: Io, cause: Some(Os { code: 10054, kind: ConnectionReset, message: \"An existing connection was forcibly closed by the remote host.\" }) }",
    );
    expect(isTransientDbError(error)).toBe(true);
  });

  it("rejects anything that is not a connection problem", () => {
    expect(isTransientDbError(new Error("Unique constraint failed on the fields: (`email`)"))).toBe(false);
    expect(isTransientDbError("not an error")).toBe(false);
  });
});

describe("withDbRetry", () => {
  it("returns the first success without retrying", async () => {
    const run = vi.fn(async () => "ok");
    await expect(withDbRetry(run)).resolves.toBe("ok");
    expect(run).toHaveBeenCalledTimes(1);
  });

  it("retries once after a pool timeout and then succeeds", async () => {
    const run = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(poolTimeout())
      .mockResolvedValueOnce("second try");

    await expect(withDbRetry(run, 2, 1)).resolves.toBe("second try");
    expect(run).toHaveBeenCalledTimes(2);
  });

  it("gives up after the attempts and rethrows the pool timeout", async () => {
    const run = vi.fn<() => Promise<string>>().mockRejectedValue(poolTimeout());

    await expect(withDbRetry(run, 2, 1)).rejects.toThrow(/connection pool/i);
    expect(run).toHaveBeenCalledTimes(2);
  });

  it("never retries a real error", async () => {
    const run = vi.fn<() => Promise<string>>().mockRejectedValue(new Error("syntax error"));

    await expect(withDbRetry(run, 3, 1)).rejects.toThrow("syntax error");
    expect(run).toHaveBeenCalledTimes(1);
  });
});
