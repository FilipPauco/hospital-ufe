import { Component, Event, EventEmitter, Host, Prop, State, h } from '@stencil/core';
import { BedsApi, Bed, Configuration } from '../../api/hospital-wl';

@Component({
  tag: 'xmasiarikova-bed-list',
  shadow: true,
  styles: `
    :host {
      display: block;
      padding: 10px;
      background: var(--md-sys-color-surface);
      min-height: 100%;
      box-sizing: border-box;
    }
    .panel {
      border-radius: 12px;
      overflow: hidden;
      background: var(--md-sys-color-surface);
      border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 70%, transparent);
    }
    .header { padding: 14px 14px 8px; }
    .header-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }
    h2 { margin: 0; font-size: 1.15rem; font-weight: 600; }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 10px;
      margin-top: 12px;
    }
    .stat-card {
      border-radius: 10px;
      padding: 10px 12px;
      border: 1px solid transparent;
      display: flex;
      flex-direction: column;
      gap: 3px;
      min-height: 72px;
    }
    .stat-label {
      font-size: 0.82rem;
      font-weight: 600;
      opacity: 0.9;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .stat-value {
      font-size: 1.1rem;
      font-weight: 700;
      line-height: 1.2;
    }
    .stat-card.occupied {
      background: #fde7e9;
      border-color: #f4c8cf;
      color: #7b1d29;
    }
    .stat-card.free {
      background: #e9f8ee;
      border-color: #bde8ca;
      color: #1f5d32;
    }
    .stat-card.oos {
      background: #fff2df;
      border-color: #ffd9a9;
      color: #8f5518;
    }
    md-list { background: transparent; }
    md-list-item {
      cursor: pointer;
      transition: filter 0.15s ease-in-out;
      border-radius: 8px;
      margin: 2px 8px;
      --md-list-item-container-color: transparent;
    }
    md-list-item:hover {
      --md-list-item-container-color: var(--md-sys-color-surface-container-high);
      filter: saturate(0.9);
    }
    md-list-item:focus-within {
      --md-list-item-container-color: var(--md-sys-color-surface-container-high);
    }
    .empty,
    .error {
      padding: 18px 16px;
      color: var(--md-sys-color-on-surface-variant);
    }
    .error {
      color: var(--md-sys-color-error);
      background: var(--md-sys-color-error-container);
      border-radius: 12px;
      margin: 12px 16px 16px;
    }
    .add-button {
      border-radius: 9px;
      --md-filled-button-container-shape: 9px;
      white-space: nowrap;
    }
  `
})
export class XmasiarikovaBedList {
  @Event({ eventName: 'bed-clicked' }) bedClicked: EventEmitter<string>;
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
      this.errorMessage = `Cannot retrieve beds: ${err.message || 'unknown'}`;
    }
    return [];
  }

  async componentWillLoad() {
    this.beds = await this.getBedsAsync();
  }

  render() {
    const total = this.beds?.length ?? 0;
    const occupied = this.beds?.filter((b) => b.status === 'occupied').length ?? 0;
    const free = this.beds?.filter((b) => b.status === 'free').length ?? 0;
    const oos = this.beds?.filter((b) => b.status === 'out-of-service').length ?? 0;

    return (
      <Host>
        <div class="panel">
          <div class="header">
            <div class="header-top">
              <h2>Lôžka oddelenia</h2>
              <md-filled-button class="add-button"
                onclick={() => this.bedClicked.emit('@new')}>
                <md-icon slot="icon">add</md-icon>
                Pridaj lôžko
              </md-filled-button>
            </div>
            {!this.errorMessage && total > 0 && (
              <div class="stats">
                <div class="stat-card occupied">
                  <div class="stat-label">
                    <md-icon>person</md-icon>
                    Obsadené
                  </div>
                  <div class="stat-value">{occupied}/{total}</div>
                </div>
                <div class="stat-card free">
                  <div class="stat-label">
                    <md-icon>bed</md-icon>
                    Voľné
                  </div>
                  <div class="stat-value">{free}/{total}</div>
                </div>
                <div class="stat-card oos">
                  <div class="stat-label">
                    <md-icon>block</md-icon>
                    Mimo prevádzky
                  </div>
                  <div class="stat-value">{oos}/{total}</div>
                </div>
              </div>
            )}
          </div>
          {this.errorMessage
            ? <div class="error">{this.errorMessage}</div>
            : total === 0
              ? <div class="empty">Na oddelení zatiaľ nie sú evidované žiadne lôžka.</div>
              : <md-list>
                  {this.beds.map((bed) =>
                    [
                      <md-list-item type="button" onClick={() => this.bedClicked.emit(bed.id)}>
                        <div slot="headline">Lôžko {bed.number}</div>
                        <div slot="supporting-text">{this.statusLabel(bed.status)}{bed.patientId ? ` – ${bed.patientId}` : ''}</div>
                        <md-icon slot="start">{bed.status === 'free' ? 'bed' : bed.status === 'occupied' ? 'person' : 'block'}</md-icon>
                      </md-list-item>,
                      <md-divider></md-divider>
                    ]
                  )}
                </md-list>
          }
        </div>
      </Host>
    );
  }
}
