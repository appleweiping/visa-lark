/**
 * SQLite persistence (better-sqlite3, prepared statements). Single-tenant.
 *
 * Tables (DESIGN.md §8 subset relevant to the control plane):
 *   observation(id, monitor_id, facility_id, date, observed_at)
 *     — time-series of seen availability → heatmap / release-pattern model.
 *   event_log(id, kind, payload_json, created_at)
 *     — relay/notify audit trail. NEVER stores channel secrets or visa creds.
 *
 * This plane holds ZERO visa credentials. There is no session/password table.
 */
import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import type { ObservationRecord } from "./heatmap.js";

export interface ObservationRow {
  id: number;
  monitorId: string;
  facilityId: string;
  date: string;
  observedAt: number;
}

export interface EventLogRow {
  id: number;
  kind: string;
  payloadJson: string;
  createdAt: number;
}

export class Store {
  private db: Database.Database;
  private stmtInsertObs: Database.Statement;
  private stmtInsertEvent: Database.Statement;

  constructor(dbPath: string) {
    if (dbPath !== ":memory:") {
      mkdirSync(dirname(dbPath), { recursive: true });
    }
    this.db = new Database(dbPath);
    this.db.pragma("journal_mode = WAL");
    this.db.pragma("foreign_keys = ON");
    this.migrate();

    this.stmtInsertObs = this.db.prepare(
      `INSERT INTO observation (monitor_id, facility_id, date, observed_at)
       VALUES (@monitorId, @facilityId, @date, @observedAt)`,
    );
    this.stmtInsertEvent = this.db.prepare(
      `INSERT INTO event_log (kind, payload_json, created_at)
       VALUES (@kind, @payloadJson, @createdAt)`,
    );
  }

  private migrate(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS observation (
        id           INTEGER PRIMARY KEY AUTOINCREMENT,
        monitor_id   TEXT    NOT NULL,
        facility_id  TEXT    NOT NULL,
        date         TEXT    NOT NULL,
        observed_at  INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_obs_monitor  ON observation (monitor_id);
      CREATE INDEX IF NOT EXISTS idx_obs_facility ON observation (facility_id);
      CREATE INDEX IF NOT EXISTS idx_obs_at       ON observation (observed_at);

      CREATE TABLE IF NOT EXISTS event_log (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        kind        TEXT    NOT NULL,
        payload_json TEXT   NOT NULL,
        created_at  INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_event_kind ON event_log (kind);
    `);
  }

  /** Insert a batch of observations in one transaction. Returns rows written. */
  insertObservations(
    monitorId: string,
    dates: { date: string; facilityId: string }[],
    observedAt: number,
  ): number {
    const tx = this.db.transaction(
      (rows: { date: string; facilityId: string }[]) => {
        for (const r of rows) {
          this.stmtInsertObs.run({
            monitorId,
            facilityId: r.facilityId,
            date: r.date,
            observedAt,
          });
        }
        return rows.length;
      },
    );
    return tx(dates);
  }

  /** Query observation history, optionally filtered. Newest first. */
  queryObservations(filter: {
    monitorId?: string;
    facilityId?: string;
    limit?: number;
  }): ObservationRow[] {
    const clauses: string[] = [];
    const params: Record<string, unknown> = {};
    if (filter.monitorId) {
      clauses.push("monitor_id = @monitorId");
      params.monitorId = filter.monitorId;
    }
    if (filter.facilityId) {
      clauses.push("facility_id = @facilityId");
      params.facilityId = filter.facilityId;
    }
    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    params.limit = Math.min(Math.max(filter.limit ?? 1000, 1), 10000);
    const stmt = this.db.prepare(
      `SELECT id, monitor_id AS monitorId, facility_id AS facilityId,
              date, observed_at AS observedAt
       FROM observation ${where}
       ORDER BY observed_at DESC
       LIMIT @limit`,
    );
    return stmt.all(params) as ObservationRow[];
  }

  /** Load observations as heatmap records (ascending), optionally per facility. */
  loadForHeatmap(facilityId?: string): ObservationRecord[] {
    const where = facilityId ? "WHERE facility_id = @facilityId" : "";
    const stmt = this.db.prepare(
      `SELECT monitor_id AS monitorId, facility_id AS facilityId,
              date, observed_at AS observedAt
       FROM observation ${where}
       ORDER BY observed_at ASC`,
    );
    return stmt.all(facilityId ? { facilityId } : {}) as ObservationRecord[];
  }

  /** Append an audit event. payload is JSON-stringified; never include secrets. */
  logEvent(kind: string, payload: unknown, createdAt: number = Date.now()): void {
    this.stmtInsertEvent.run({
      kind,
      payloadJson: JSON.stringify(payload ?? {}),
      createdAt,
    });
  }

  recentEvents(limit = 100): EventLogRow[] {
    const stmt = this.db.prepare(
      `SELECT id, kind, payload_json AS payloadJson, created_at AS createdAt
       FROM event_log ORDER BY created_at DESC LIMIT ?`,
    );
    return stmt.all(Math.min(Math.max(limit, 1), 1000)) as EventLogRow[];
  }

  close(): void {
    this.db.close();
  }
}
