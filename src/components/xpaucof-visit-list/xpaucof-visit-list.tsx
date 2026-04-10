import { Component, Event, EventEmitter, Host, Prop, State, h } from '@stencil/core';
import { VisitsApi, Visit, Configuration } from '../../api/hospital-wl';

@Component({
  tag: 'xpaucof-visit-list',
  shadow: true,
})
export class XpaucofVisitList {
  @Event({ eventName: "visit-clicked" }) visitClicked: EventEmitter<string>;
  @Prop() apiBase: string;
  @Prop() wardId: string;
  @State() errorMessage: string;

  visits: Visit[];

  private async getVisitsAsync(): Promise<Visit[]> {
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

  async componentWillLoad() {
    this.visits = await this.getVisitsAsync();
  }

  render() {
    return (
      <Host>
        {this.errorMessage
          ? <div class="error">{this.errorMessage}</div>
          : <md-list>
              {this.visits.map(visit =>
                <md-list-item onClick={() => this.visitClicked.emit(visit.id)}>
                  <div slot="headline">{visit.patientId}</div>
                  <div slot="supporting-text">{visit.date} {visit.time}</div>
                  <md-icon slot="start">event</md-icon>
                </md-list-item>
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
