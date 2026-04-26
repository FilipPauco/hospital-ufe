import { Component, Host, Prop, State, h, EventEmitter, Event } from '@stencil/core';
import { VisitsApi, BedsApi, Bed, Visit, Configuration } from '../../api/hospital-wl';

@Component({
  tag: 'xpaucof-visit-editor',
  shadow: true,
  styles: `
    :host { display: block; }
    form { display: flex; flex-direction: column; gap: 16px; padding: 16px; }
    .actions { display: flex; flex-wrap: wrap; gap: 8px; padding-top: 8px; }
    .error { color: var(--md-sys-color-error, red); padding: 16px; }
  `
})
export class XpaucofVisitEditor {
  @Prop() visitId?: string;
  @Prop() wardId?: string;
  @Prop() apiBase?: string;

  @Event({ eventName: "editor-closed" }) editorClosed!: EventEmitter<string>;
  @State() private entry: Visit = {
    id: "@new",
    patientId: "",
    bedId: "",
    date: new Date().toISOString().split('T')[0],
    time: "08:00",
    doctors: [],
    clinicalNotes: "",
  };
  @State() private beds: Bed[] = [];
  @State() private errorMessage: string = "";
  @State() private isValid: boolean = false;

  private formElement?: HTMLFormElement;

  async componentWillLoad() {
    await Promise.all([
      this.getBedsAsync(),
      this.getVisitAsync(),
    ]);
  }

  private async getBedsAsync(): Promise<void> {
    if (!this.wardId) {
      this.errorMessage = "Missing wardId";
      return;
    }
    try {
      const configuration = new Configuration({ basePath: this.apiBase });
      const bedsApi = new BedsApi(configuration);
      const response = await bedsApi.getBedsRaw({ wardId: this.wardId });

      if (response.raw.status < 299) {
        this.beds = await response.value();
      } else {
        this.errorMessage = `Cannot retrieve beds: ${response.raw.statusText}`;
      }
    } catch (err: any) {
      this.errorMessage = `Cannot retrieve beds: ${err.message || "unknown"}`;
    }
  }

  private async getVisitAsync(): Promise<Visit | undefined> {
    if (this.visitId === "@new") {
      this.isValid = false;
      this.entry = {
        id: "@new",
        patientId: "",
        bedId: "",
        date: new Date().toISOString().split('T')[0],
        time: "08:00",
        doctors: [],
        clinicalNotes: "",
      };
      return this.entry;
    }

    if (!this.visitId) {
      this.isValid = false;
      return undefined;
    }
    try {
      const configuration = new Configuration({
        basePath: this.apiBase,
      });

      const visitsApi = new VisitsApi(configuration);
      if (!this.wardId || !this.visitId) {
        this.errorMessage = "Missing wardId or visitId";
        return undefined;
      }
      const response = await visitsApi.getVisitRaw({ wardId: this.wardId, visitId: this.visitId });

      if (response.raw.status < 299) {
        this.entry = await response.value();
        this.isValid = true;
      } else {
        this.errorMessage = `Cannot retrieve visit: ${response.raw.statusText}`;
      }
    } catch (err: any) {
      this.errorMessage = `Cannot retrieve visit: ${err.message || "unknown"}`;
    }
    return undefined;
  }

  private handleInputEvent(ev: InputEvent): string {
    const target = ev.target as HTMLInputElement | HTMLSelectElement;
    this.isValid = this.formElement?.reportValidity() ?? false;
    return target?.value ?? "";
  }

  private getBedLabel(bed: Bed): string {
    const status = bed.status ?? "unknown";
    return `${bed.number} (${status})`;
  }

  private async deleteVisit() {
    if (!this.wardId || !this.visitId) {
      this.errorMessage = "Missing wardId or visitId";
      return;
    }
    try {
      const configuration = new Configuration({ basePath: this.apiBase });
      const visitsApi = new VisitsApi(configuration);
      const response = await visitsApi.deleteVisitRaw({ wardId: this.wardId, visitId: this.visitId });
      if (response.raw.status < 299) {
        this.editorClosed.emit("deleted");
      } else {
        this.errorMessage = `Cannot delete visit: ${response.raw.statusText}`;
      }
    } catch (err: any) {
      this.errorMessage = `Cannot delete visit: ${err.message || "unknown"}`;
    }
  }

  private async updateVisit() {
    if (!this.wardId) {
      this.errorMessage = "Missing wardId";
      return;
    }
    try {
      const configuration = new Configuration({ basePath: this.apiBase });
      const visitsApi = new VisitsApi(configuration);
      let response;
      if (this.visitId === "@new") {
        response = await visitsApi.createVisitRaw({ wardId: this.wardId, visit: this.entry });
      } else {
        if (!this.visitId) {
          this.errorMessage = "Missing visitId";
          return;
        }
        response = await visitsApi.updateVisitRaw({ wardId: this.wardId, visitId: this.visitId, visit: this.entry });
      }
      if (response.raw.status < 299) {
        this.editorClosed.emit("updated");
      } else {
        this.errorMessage = `Cannot save visit: ${response.raw.statusText}`;
      }
    } catch (err: any) {
      this.errorMessage = `Cannot save visit: ${err.message || "unknown"}`;
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
        <form ref={el => this.formElement = el ?? undefined}>
          <md-filled-text-field label="ID pacienta"
            required pattern=".*\S.*" value={this.entry?.patientId}
            oninput={(ev: InputEvent) => {
              if (this.entry) { this.entry.patientId = this.handleInputEvent(ev); }
            }}>
            <md-icon slot="leading-icon">person</md-icon>
          </md-filled-text-field>

          <md-filled-select label="Lôžko" required
            value={this.entry?.bedId ?? ""}
            onchange={(ev: Event) => {
              if (this.entry) {
                this.entry.bedId = (ev.target as HTMLSelectElement).value;
                this.isValid = this.formElement?.reportValidity() ?? false;
              }
            }}>
            <md-select-option value="">
              <div slot="headline">Vyberte lôžko</div>
            </md-select-option>
            {this.beds.map((bed) => (
              <md-select-option value={bed.id}>
                <div slot="headline">{this.getBedLabel(bed)}</div>
              </md-select-option>
            ))}
          </md-filled-select>

          <md-filled-text-field label="Dátum"
            type="date" required value={this.entry?.date}
            oninput={(ev: InputEvent) => {
              if (this.entry) { this.entry.date = this.handleInputEvent(ev); }
            }}>
            <md-icon slot="leading-icon">calendar_today</md-icon>
          </md-filled-text-field>

          <md-filled-text-field label="Čas"
            type="time" required value={this.entry?.time}
            oninput={(ev: InputEvent) => {
              if (this.entry) { this.entry.time = this.handleInputEvent(ev); }
            }}>
            <md-icon slot="leading-icon">schedule</md-icon>
          </md-filled-text-field>

          <md-filled-text-field label="Lekári (oddelené čiarkou)"
            value={this.entry?.doctors?.join(", ")}
            oninput={(ev: InputEvent) => {
              if (this.entry) {
                this.entry.doctors = this.handleInputEvent(ev).split(",").map(s => s.trim()).filter(s => s);
              }
            }}>
            <md-icon slot="leading-icon">medical_services</md-icon>
          </md-filled-text-field>

          <md-filled-text-field label="Klinické poznámky"
            type="textarea" value={this.entry?.clinicalNotes}
            oninput={(ev: InputEvent) => {
              if (this.entry) { this.entry.clinicalNotes = this.handleInputEvent(ev); }
            }}>
            <md-icon slot="leading-icon">notes</md-icon>
          </md-filled-text-field>

          <div class="actions">
            <md-filled-tonal-button
              disabled={!this.isValid}
              onclick={() => this.updateVisit()}>
              <md-icon slot="icon">save</md-icon>
              Uložiť
            </md-filled-tonal-button>
            {this.visitId !== "@new" &&
              <md-outlined-button onclick={() => this.deleteVisit()}>
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
