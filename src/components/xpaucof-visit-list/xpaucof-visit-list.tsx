import { Component, Event, EventEmitter, Host, Prop, State, h } from '@stencil/core';
import { VisitsApi, BedsApi, Bed, Visit, Configuration } from '../../api/hospital-wl';

@Component({
  tag: 'xpaucof-visit-list',
  shadow: true,
  styles: `
    :host { display: block; }
    .header { padding: 16px 16px 0; }
    h2 { margin: 0 0 4px; font-size: 1.25rem; font-weight: 500; }
    .error { color: var(--md-sys-color-error, red); padding: 16px; }
  `
})
export class XpaucofVisitList {
  @Event({ eventName: "visit-clicked" }) visitClicked!: EventEmitter<string>;
  @Prop() apiBase?: string;
  @Prop() wardId?: string;
  @State() private errorMessage: string = "";
  @State() private beds: Bed[] = [];
  @State() private visits: Visit[] = [];

  private getBedDisplayName(bedId: string): string {
    const bed = this.beds.find((b) => b.id === bedId);
    return bed?.number ?? "Neznáme lôžko";
  }

  private async getVisitsAsync(): Promise<Visit[]> {
    if (!this.wardId) {
      this.errorMessage = "Missing wardId";
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
      this.errorMessage = `Cannot retrieve visits: ${err.message || "unknown"}`;
    }
    return [];
  }

  private async getBedsAsync(): Promise<Bed[]> {
    if (!this.wardId) {
      this.errorMessage = "Missing wardId";
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
      this.errorMessage = `Cannot retrieve beds: ${err.message || "unknown"}`;
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
    return (
      <Host>
        <div class="header">
          <h2>Vizity pacientov</h2>
        </div>
        {this.errorMessage
          ? <div class="error">{this.errorMessage}</div>
          : <md-list>
              {this.visits.map(visit =>
                [
                  <md-list-item onClick={() => this.visitClicked.emit(visit.id)}>
                    <div slot="headline">{visit.patientId}</div>
                    <div slot="supporting-text">{visit.date} {visit.time} | Lôžko: {this.getBedDisplayName(visit.bedId)}</div>
                    <md-icon slot="start">event</md-icon>
                  </md-list-item>,
                  <md-divider></md-divider>
                ]
              )}
            </md-list>
        }
        <md-filled-icon-button class="add-button"
          onclick={() => this.visitClicked.emit("@new")}>
          <md-icon>add</md-icon>
        </md-filled-icon-button>
      </Host>
    );
  }
}
