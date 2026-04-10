import { Component, Host, Prop, State, h, EventEmitter, Event } from '@stencil/core';
import { BedsApi, Bed, Configuration } from '../../api/hospital-wl';

@Component({
  tag: 'xmesiarikova-bed-editor',
  shadow: true,
})
export class XmesiarikováBedEditor {
  @Prop() bedId: string;
  @Prop() wardId: string;
  @Prop() apiBase: string;

  @Event({ eventName: "editor-closed" }) editorClosed: EventEmitter<string>;
  @State() entry: Bed;
  @State() errorMessage: string;
  @State() isValid: boolean;

  private formElement: HTMLFormElement;

  async componentWillLoad() {
    this.getBedAsync();
  }

  private async getBedAsync(): Promise<Bed> {
    if (this.bedId === "@new") {
      this.isValid = false;
      this.entry = {
        id: "@new",
        number: "",
        status: "free",
        patientId: "",
      };
      return this.entry;
    }

    if (!this.bedId) {
      this.isValid = false;
      return undefined;
    }
    try {
      const configuration = new Configuration({
        basePath: this.apiBase,
      });

      const bedsApi = new BedsApi(configuration);
      const response = await bedsApi.getBedRaw({ wardId: this.wardId, bedId: this.bedId });

      if (response.raw.status < 299) {
        this.entry = await response.value();
        this.isValid = true;
      } else {
        this.errorMessage = `Cannot retrieve bed: ${response.raw.statusText}`;
      }
    } catch (err: any) {
      this.errorMessage = `Cannot retrieve bed: ${err.message || "unknown"}`;
    }
    return undefined;
  }

  private handleInputEvent(ev: InputEvent): string {
    const target = ev.target as HTMLInputElement;
    this.isValid = this.formElement?.reportValidity() ?? false;
    return target?.value ?? "";
  }

  private async deleteBed() {
    try {
      const configuration = new Configuration({ basePath: this.apiBase });
      const bedsApi = new BedsApi(configuration);
      const response = await bedsApi.deleteBedRaw({ wardId: this.wardId, bedId: this.bedId });
      if (response.raw.status < 299) {
        this.editorClosed.emit("deleted");
      } else {
        this.errorMessage = `Cannot delete bed: ${response.raw.statusText}`;
      }
    } catch (err: any) {
      this.errorMessage = `Cannot delete bed: ${err.message || "unknown"}`;
    }
  }

  private async updateBed() {
    try {
      const configuration = new Configuration({ basePath: this.apiBase });
      const bedsApi = new BedsApi(configuration);
      let response;
      if (this.bedId === "@new") {
        response = await bedsApi.createBedRaw({ wardId: this.wardId, bed: this.entry });
      } else {
        response = await bedsApi.updateBedRaw({ wardId: this.wardId, bedId: this.bedId, bed: this.entry });
      }
      if (response.raw.status < 299) {
        this.editorClosed.emit("updated");
      } else {
        this.errorMessage = `Cannot save bed: ${response.raw.statusText}`;
      }
    } catch (err: any) {
      this.errorMessage = `Cannot save bed: ${err.message || "unknown"}`;
    }
  }

  render() {
    if (this.errorMessage) {
      return (
        <Host>
          <div class="error">{this.errorMessage}</div>
        </Host>
      );
    }
    return (
      <Host>
        <form ref={el => this.formElement = el}>
          <md-filled-text-field label="Číslo lôžka"
            required pattern=".*\S.*" value={this.entry?.number}
            oninput={(ev: InputEvent) => {
              if (this.entry) { this.entry.number = this.handleInputEvent(ev); }
            }}>
            <md-icon slot="leading-icon">bed</md-icon>
          </md-filled-text-field>

          <md-filled-select label="Stav"
            value={this.entry?.status}
            onchange={(ev: Event) => {
              if (this.entry) {
                this.entry.status = (ev.target as HTMLSelectElement).value as any;
                this.isValid = this.formElement?.reportValidity() ?? false;
              }
            }}>
            <md-select-option value="free">
              <div slot="headline">Voľné</div>
            </md-select-option>
            <md-select-option value="occupied">
              <div slot="headline">Obsadené</div>
            </md-select-option>
            <md-select-option value="out-of-service">
              <div slot="headline">Mimo prevádzky</div>
            </md-select-option>
          </md-filled-select>

          <md-filled-text-field label="ID pacienta"
            value={this.entry?.patientId}
            oninput={(ev: InputEvent) => {
              if (this.entry) { this.entry.patientId = this.handleInputEvent(ev); }
            }}>
            <md-icon slot="leading-icon">person</md-icon>
          </md-filled-text-field>

          <div class="actions">
            <md-filled-tonal-button
              disabled={!this.isValid}
              onclick={() => this.updateBed()}>
              <md-icon slot="icon">save</md-icon>
              Uložiť
            </md-filled-tonal-button>
            {this.bedId !== "@new" &&
              <md-outlined-button onclick={() => this.deleteBed()}>
                <md-icon slot="icon">delete</md-icon>
                Zmazať
              </md-outlined-button>
            }
            <md-outlined-button onclick={() => this.editorClosed.emit("cancel")}>
              <md-icon slot="icon">close</md-icon>
              Zatvoriť
            </md-outlined-button>
          </div>
        </form>
      </Host>
    );
  }
}
