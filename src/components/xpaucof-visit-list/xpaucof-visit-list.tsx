import { Component, Event, EventEmitter, Host, Prop, State, h } from '@stencil/core';
import { VisitsApi, BedsApi, Bed, Visit, Configuration } from '../../api/hospital-wl';

@Component({
  tag: 'xpaucof-visit-list',
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
      color: #b42318;
      background: #fef3f2;
      border: 1px solid #fda29b;
      font-weight: 600;
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
export class XpaucofVisitList {
  @Event({ eventName: 'visit-clicked' }) visitClicked!: EventEmitter<string>;
  @Prop() apiBase?: string;
  @Prop() wardId?: string;
  @State() private errorMessage: string = '';
  @State() private beds: Bed[] = [];
  @State() private visits: Visit[] = [];

  private getBedDisplayName(bedId: string): string {
    const bed = this.beds.find((b) => b.id === bedId);
    return bed?.number ?? 'Neznáme lôžko';
  }

  private async getVisitsAsync(): Promise<Visit[]> {
    if (!this.wardId) {
      this.errorMessage = 'Missing wardId';
      return [];
    }
    try {
      const configuration = new Configuration({
        basePath: this.apiBase,
      });

      const visitsApi = new VisitsApi(configuration);
      const response = await visitsApi.getVisitsRaw({ wardId: this.wardId });
      if (response.raw.status < 299) {
        return await response.value();
      } else {
        this.errorMessage = `Cannot retrieve visits: ${response.raw.statusText}`;
      }
    } catch (err: any) {
      this.errorMessage = `Cannot retrieve visits: ${err.message || 'unknown'}`;
    }
    return [];
  }

  private async getBedsAsync(): Promise<Bed[]> {
    if (!this.wardId) {
      this.errorMessage = 'Missing wardId';
      return [];
    }
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
    const [visits, beds] = await Promise.all([
      this.getVisitsAsync(),
      this.getBedsAsync(),
    ]);
    this.visits = visits;
    this.beds = beds;
  }

  render() {
    const total = this.visits.length;

    return (
      <Host>
        <div class="panel">
          <div class="header">
            <div class="header-top">
              <h2>Vizity pacientov</h2>
              <md-filled-button class="add-button"
                onclick={() => this.visitClicked.emit('@new')}>
                <md-icon slot="icon">add</md-icon>
                Pridaj vizitu
              </md-filled-button>
            </div>
          </div>
          {this.errorMessage
            ? <div class="error">{this.errorMessage}</div>
            : total === 0
              ? <div class="empty">Zatiaľ nie sú naplánované žiadne vizity.</div>
              : <md-list>
                  {this.visits.map((visit) =>
                    [
                      <md-list-item type="button" onClick={() => this.visitClicked.emit(visit.id)}>
                        <div slot="headline">{visit.patientId}</div>
                        <div slot="supporting-text">{visit.date} {visit.time} | Lôžko: {this.getBedDisplayName(visit.bedId)}</div>
                        <md-icon slot="start">event</md-icon>
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
