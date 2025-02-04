import type { ReplayRecordingData } from '@sentry/types';

import type { AddEventResult, EventBuffer, RecordingEvent } from '../types';
import { timestampToMs } from '../util/timestampToMs';
import { WorkerHandler } from './WorkerHandler';

/**
 * Event buffer that uses a web worker to compress events.
 * Exported only for testing.
 */
export class EventBufferCompressionWorker implements EventBuffer {
  private _worker: WorkerHandler;
  private _earliestTimestamp: number | null;

  public constructor(worker: Worker) {
    this._worker = new WorkerHandler(worker);
    this._earliestTimestamp = null;
  }

  /** @inheritdoc */
  public get hasEvents(): boolean {
    return !!this._earliestTimestamp;
  }

  /**
   * Ensure the worker is ready (or not).
   * This will either resolve when the worker is ready, or reject if an error occured.
   */
  public ensureReady(): Promise<void> {
    return this._worker.ensureReady();
  }

  /**
   * Destroy the event buffer.
   */
  public destroy(): void {
    this._worker.destroy();
  }

  /**
   * Add an event to the event buffer.
   *
   * Returns true if event was successfuly received and processed by worker.
   */
  public async addEvent(event: RecordingEvent, isCheckout?: boolean): Promise<AddEventResult> {
    if (isCheckout) {
      // This event is a checkout, make sure worker buffer is cleared before
      // proceeding.
      await this._clear();
    }

    const timestamp = timestampToMs(event.timestamp);
    if (!this._earliestTimestamp || timestamp < this._earliestTimestamp) {
      this._earliestTimestamp = timestamp;
    }

    return this._sendEventToWorker(event);
  }

  /**
   * Finish the event buffer and return the compressed data.
   */
  public finish(): Promise<ReplayRecordingData> {
    return this._finishRequest();
  }

  /** @inheritdoc */
  public getEarliestTimestamp(): number | null {
    return this._earliestTimestamp;
  }

  /**
   * Send the event to the worker.
   */
  private _sendEventToWorker(event: RecordingEvent): Promise<AddEventResult> {
    return this._worker.postMessage<void>('addEvent', JSON.stringify(event));
  }

  /**
   * Finish the request and return the compressed data from the worker.
   */
  private async _finishRequest(): Promise<Uint8Array> {
    const response = await this._worker.postMessage<Uint8Array>('finish');

    this._earliestTimestamp = null;

    return response;
  }

  /** Clear any pending events from the worker. */
  private _clear(): Promise<void> {
    this._earliestTimestamp = null;
    return this._worker.postMessage('clear');
  }
}
