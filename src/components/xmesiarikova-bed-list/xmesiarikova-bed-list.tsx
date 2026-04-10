import { Component, Event, EventEmitter, Host, Prop, State, h } from '@stencil/core';
import { BedsApi, Bed, Configuration } from '../../api/hospital-wl';

@Component({
  tag: 'xmesiarikova-bed-list',
  shadow: true,
})
export class XmesiarikováBedList {
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
    return (
      <Host>
        {this.errorMessage
          ? <div class="error">{this.errorMessage}</div>
          : <md-list>
              {this.beds.map(bed =>
                <md-list-item onClick={() => this.bedClicked.emit(bed.id)}>
                  <div slot="headline">Lôžko {bed.number}</div>
                  <div slot="supporting-text">{this.statusLabel(bed.status)}{bed.patientId ? ` – ${bed.patientId}` : ''}</div>
                  <md-icon slot="start">{bed.status === 'free' ? 'bed' : bed.status === 'occupied' ? 'person' : 'block'}</md-icon>
                </md-list-item>
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
