import { Component, Event, EventEmitter, Host, Prop, State, h } from '@stencil/core';
import { BedsApi, Bed, Configuration } from '../../api/hospital-wl';

@Component({
  tag: 'xmasiarikova-bed-list',
  shadow: true,
  styles: `
    :host { display: block; }
    .header { padding: 16px 16px 0; }
    h2 { margin: 0 0 12px; font-size: 1.25rem; font-weight: 500; }
    .stats { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 8px; }
    .stat-chip {
      display: flex; align-items: center; gap: 6px;
      background: var(--md-sys-color-surface-variant, #e7e0ec);
      border-radius: 8px; padding: 6px 12px; font-size: 0.85rem;
    }
    .stat-chip md-icon { font-size: 18px; }
    .stat-chip.occupied { background: #fde8e8; }
    .stat-chip.free { background: #e8f5e9; }
    .stat-chip.oos { background: #fff3e0; }
    .error { color: var(--md-sys-color-error, red); padding: 16px; }
  `
})
export class XmasiarikovaBedList {
  @Event({ eventName: "bed-clicked" }) bedClicked: EventEmitter<string>;
  @Prop() apiBase: string;
  @Prop() wardId: string;
  @State() errorMessage: string;

  beds: Bed[];

  private statusLabel(status: string): string {
    switch (status) {
      case 'free': return 'Voľné';
      case 'occupied': return 'Obsadené';
      case 'out-of-service': return 'Mimo prevádzky';
      default: return status;
    }
  }

  private async getBedsAsync(): Promise<Bed[]> {
    try {
      const configuration = new Configuration({
        basePath: this.apiBase,
      });

      const bedsApi = new BedsApi(configuration);
      const response = await bedsApi.getBedsRaw({ wardId: this.wardId });
      if (response.raw.status < 299) {
        return await response.value();
      } else {
        this.errorMessage = `Cannot retrieve beds: ${response.raw.statusText}`;
      }
    } catch (err: any) {
      this.errorMessage = `Cannot retrieve beds: ${err.message || "unknown"}`;
    }
    return [];
  }

  async componentWillLoad() {
    this.beds = await this.getBedsAsync();
  }

  render() {
    const total = this.beds?.length ?? 0;
    const occupied = this.beds?.filter(b => b.status === 'occupied').length ?? 0;
    const free = this.beds?.filter(b => b.status === 'free').length ?? 0;
    const oos = this.beds?.filter(b => b.status === 'out-of-service').length ?? 0;

    return (
      <Host>
        <div class="header">
          <h2>Lôžka oddelenia</h2>
          {!this.errorMessage && total > 0 && (
            <div class="stats">
              <div class="stat-chip occupied">
                <md-icon>person</md-icon>
                Obsadené: {occupied}/{total}
              </div>
              <div class="stat-chip free">
                <md-icon>bed</md-icon>
                Voľné: {free}/{total}
              </div>
              <div class="stat-chip oos">
                <md-icon>block</md-icon>
                Mimo prevádzky: {oos}/{total}
              </div>
            </div>
          )}
        </div>
        {this.errorMessage
          ? <div class="error">{this.errorMessage}</div>
          : <md-list>
              {this.beds.map(bed =>
                [
                  <md-list-item onClick={() => this.bedClicked.emit(bed.id)}>
                    <div slot="headline">Lôžko {bed.number}</div>
                    <div slot="supporting-text">{this.statusLabel(bed.status)}{bed.patientId ? ` – ${bed.patientId}` : ''}</div>
                    <md-icon slot="start">{bed.status === 'free' ? 'bed' : bed.status === 'occupied' ? 'person' : 'block'}</md-icon>
                  </md-list-item>,
                  <md-divider></md-divider>
                ]
              )}
            </md-list>
        }
        <md-filled-icon-button class="add-button"
          onclick={() => this.bedClicked.emit("@new")}>
          <md-icon>add</md-icon>
        </md-filled-icon-button>
      </Host>
    );
  }
}
