import { Component, Event, EventEmitter, Host, Prop, State, h } from '@stencil/core';
import { VisitsApi, BedsApi, Bed, BedDepartmentEnum, Visit, Configuration } from '../../api/hospital-wl';

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
    .filters {
      margin-top: 10px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 10px;
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
    .supporting {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .meta,
    .doctors,
    .notes {
      font-size: 0.82rem;
      color: var(--md-sys-color-on-surface-variant);
      line-height: 1.25;
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
  @State() private selectedDepartment: BedDepartmentEnum | 'all' = 'all';
  @State() private selectedBedId: string | 'all' = 'all';

  private normalizeDepartment(department?: string): string {
    const allowed = ['interne', 'chirurgicke', 'urgentny-prijem', 'novorodenecke', 'urazove'];
    return allowed.includes(department ?? '') ? (department as string) : 'interne';
  }

  private getBedById(bedId: string): Bed | undefined {
    return this.beds.find((b) => b.id === bedId);
  }

  private getBedDisplayName(bedId: string): string {
    return this.getBedById(bedId)?.number ?? 'Neznáme lôžko';
  }

  private getDepartmentDisplayName(bedId: string): string {
    const department = this.normalizeDepartment(this.getBedById(bedId)?.department);
    const labels: Record<string, string> = {
      interne: 'Interné',
      chirurgicke: 'Chirurgické',
      'urgentny-prijem': 'Urgentný príjem',
      novorodenecke: 'Novorodenecké',
      urazove: 'Úrazové',
    };
    return labels[department] ?? 'Interné';
  }

  private getAvailableBedsForFilter(): Bed[] {
    if (this.selectedDepartment === 'all') {
      return this.beds;
    }
    return this.beds.filter((bed) => this.normalizeDepartment(bed.department) === this.selectedDepartment);
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
    const availableBeds = this.getAvailableBedsForFilter();
    const filteredVisits = this.visits.filter((visit) => {
      const bed = this.getBedById(visit.bedId);
      const departmentMatch = this.selectedDepartment === 'all' ||
        this.normalizeDepartment(bed?.department) === this.selectedDepartment;
      const bedMatch = this.selectedBedId === 'all' || visit.bedId === this.selectedBedId;
      return departmentMatch && bedMatch;
    });

    const total = filteredVisits.length;

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

            {!this.errorMessage && (
              <div class="filters">
                <md-filled-select label="Filtrovať podľa oddelenia"
                  value={this.selectedDepartment}
                  onchange={(ev: Event) => {
                    this.selectedDepartment = (ev.target as HTMLSelectElement).value as BedDepartmentEnum | 'all';
                    if (this.selectedBedId !== 'all' &&
                        !this.getAvailableBedsForFilter().some((bed) => bed.id === this.selectedBedId)) {
                      this.selectedBedId = 'all';
                    }
                  }}>
                  <md-select-option value="all">
                    <div slot="headline">Všetky oddelenia</div>
                  </md-select-option>
                  <md-select-option value={BedDepartmentEnum.Interne}>
                    <div slot="headline">Interné</div>
                  </md-select-option>
                  <md-select-option value={BedDepartmentEnum.Chirurgicke}>
                    <div slot="headline">Chirurgické</div>
                  </md-select-option>
                  <md-select-option value={BedDepartmentEnum.UrgentnyPrijem}>
                    <div slot="headline">Urgentný príjem</div>
                  </md-select-option>
                  <md-select-option value={BedDepartmentEnum.Novorodenecke}>
                    <div slot="headline">Novorodenecké</div>
                  </md-select-option>
                  <md-select-option value={BedDepartmentEnum.Urazove}>
                    <div slot="headline">Úrazové</div>
                  </md-select-option>
                </md-filled-select>

                <md-filled-select label="Filtrovať podľa lôžka"
                  value={this.selectedBedId}
                  onchange={(ev: Event) => {
                    this.selectedBedId = (ev.target as HTMLSelectElement).value || 'all';
                  }}>
                  <md-select-option value="all">
                    <div slot="headline">Všetky lôžka</div>
                  </md-select-option>
                  {availableBeds.map((bed) => (
                    <md-select-option value={bed.id}>
                      <div slot="headline">Lôžko {bed.number}</div>
                    </md-select-option>
                  ))}
                </md-filled-select>
              </div>
            )}
          </div>
          {this.errorMessage
            ? <div class="error">{this.errorMessage}</div>
            : total === 0
              ? <div class="empty">Zatiaľ neexistujú vizity pre zvolený filter.</div>
              : <md-list>
                  {filteredVisits.map((visit) =>
                    [
                      <md-list-item type="button" onClick={() => this.visitClicked.emit(visit.id)}>
                        <div slot="headline">{visit.patientId}</div>
                        <div slot="supporting-text" class="supporting">
                          <div class="meta">{visit.date} {visit.time} | Oddelenie: {this.getDepartmentDisplayName(visit.bedId)} | Lôžko: {this.getBedDisplayName(visit.bedId)}</div>
                          <div class="doctors">Lekári: {(visit.doctors && visit.doctors.length > 0) ? visit.doctors.join(', ') : 'nezadané'}</div>
                          <div class="notes">Klinické poznámky: {visit.clinicalNotes?.trim() ? visit.clinicalNotes : 'nezadané'}</div>
                        </div>
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
