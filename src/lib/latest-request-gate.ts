/** Prevents an older async response from replacing newer reconciled/realtime state. */
export class LatestRequestGate {
  private sequence = 0;

  begin(): number {
    this.sequence += 1;
    return this.sequence;
  }

  invalidate(): void {
    this.sequence += 1;
  }

  isCurrent(sequence: number): boolean {
    return sequence === this.sequence;
  }
}
