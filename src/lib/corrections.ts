// Correction semantics — precise pairing of error events with correction events.
//
// Model (event level, maintained by the typing engine):
//   - A character entry {expected, typed} is created on every printable input.
//   - Backspace removes the most recent entry (a "correction action").
//   - An entry that is wrong AND later removed  -> CORRECTED error.
//   - An entry that is wrong AND still present -> UNCORRECTED error.
//   - A backspace removing a correct entry     -> neutral correction action
//     (tracked separately so repeated backspacing cannot inflate error counts).
//
// Correction latency = elapsed ms between creating a wrong entry and the
// backspace that removes it.
//
// This module is pure TypeScript with no DOM dependency so it is unit-testable.

export interface CharEntry {
  expected: string;
  typed: string;
  time: number; // ms since test start
}

export interface CorrectionSummary {
  rawErrorEvents: number;
  correctedErrors: number;
  uncorrectedErrors: number;
  backspaceActions: number;
  productiveBackspaces: number; // removed a wrong character
  neutralBackspaces: number; // removed a correct character
  immediateCorrections: number; // wrong char followed directly by its backspace
  correctionLatencyMsAvg: number | null;
  correctionLatencyMsMax: number | null;
}

export class CorrectionTracker {
  private buffer: CharEntry[] = [];
  private rawErrorEvents = 0;
  private correctedErrors = 0;
  private latencies: number[] = [];
  private backspaceActions = 0;
  private productiveBackspaces = 0;
  private immediateCorrections = 0;
  private lastEventWasPush = false;

  /** Record a printable character attempt at position len(buffer). */
  push(expected: string, typed: string, time: number): void {
    if (typed !== expected) this.rawErrorEvents++;
    this.buffer.push({ expected, typed, time });
    this.lastEventWasPush = true;
  }

  /** Remove the most recent entry. Returns the removed entry, or null if empty. */
  backspace(time: number): CharEntry | null {
    const entry = this.buffer.pop();
    this.backspaceActions++;
    this.lastEventWasPush = false;
    if (!entry) return null;
    if (entry.typed !== entry.expected) {
      this.correctedErrors++;
      this.productiveBackspaces++;
      this.latencies.push(Math.max(0, time - entry.time));
    }
    return entry;
  }

  /** Whether the most recent input event was a push (used for immediacy). */
  wasLastEventAPush(): boolean {
    return this.lastEventWasPush;
  }

  noteImmediateCorrectionIfWrong(entry: CharEntry): void {
    if (entry && entry.typed !== entry.expected) this.immediateCorrections++;
  }

  get length(): number {
    return this.buffer.length;
  }

  finalEntries(): CharEntry[] {
    return this.buffer.slice();
  }

  summarize(): CorrectionSummary {
    return {
      rawErrorEvents: this.rawErrorEvents,
      correctedErrors: this.correctedErrors,
      uncorrectedErrors: this.finalEntries().filter((e) => e.typed !== e.expected).length,
      backspaceActions: this.backspaceActions,
      productiveBackspaces: this.productiveBackspaces,
      neutralBackspaces: this.backspaceActions - this.productiveBackspaces,
      immediateCorrections: this.immediateCorrections,
      correctionLatencyMsAvg: this.latencies.length
        ? Math.round(this.latencies.reduce((a, b) => a + b, 0) / this.latencies.length)
        : null,
      correctionLatencyMsMax: this.latencies.length ? Math.max(...this.latencies) : null,
    };
  }
}
