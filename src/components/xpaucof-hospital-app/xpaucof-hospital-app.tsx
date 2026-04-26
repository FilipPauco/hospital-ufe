import { Component, Host, Prop, State, h } from '@stencil/core';

// URL scheme:
//   <basePath>/xpaucof-visit       -> visit list
//   <basePath>/xpaucof-visit/<id>  -> visit editor
//   <basePath>/xmasiarikova-bed    -> bed list
//   <basePath>/xmasiarikova-bed/<id> -> bed editor

@Component({
  tag: 'xpaucof-hospital-app',
  shadow: true,
  styles: `
    :host {
      display: block;
      min-height: 100%;
      background: var(--md-sys-color-surface);
    }
    .shell {
      width: 100%;
      padding: 10px;
      box-sizing: border-box;
    }
    .frame {
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 75%, transparent);
      background: var(--md-sys-color-surface);
    }
    md-tabs {
      border-bottom: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 75%, transparent);
      background: var(--md-sys-color-surface-container-high);
    }
    .tab-content { padding: 0; min-height: 440px; }
  `
})
export class XpaucofHospitalApp {
  @State() private path = '';

  @Prop() visitApiBase: string;
  @Prop() bedApiBase: string;
  @Prop() wardId: string;
  @Prop() basePath: string = '';

  private baseUri = '';

  componentWillLoad() {
    this.baseUri = new URL(this.basePath, document.baseURI || '/').pathname;

    const toRelative = (fullPath: string) => {
      if (fullPath.startsWith(this.baseUri)) {
        this.path = fullPath.slice(this.baseUri.length).replace(/^\//, '');
      } else {
        this.path = '';
      }
    };

    window.navigation?.addEventListener('navigate', (ev: Event) => {
      if ((ev as any).canIntercept) { (ev as any).intercept(); }
      toRelative(new URL((ev as any).destination.url).pathname);
    });

    toRelative(location.pathname);
  }

  private navigate(rel: string) {
    const absolute = new URL(rel, new URL(this.basePath, document.baseURI)).pathname;
    window.navigation.navigate(absolute);
  }

  private get activeTab(): 'visits' | 'beds' {
    if (!this.path || this.path === '') {
      // default to visits when no path segment present
      return 'visits';
    }
    return this.path.startsWith('xmasiarikova-bed') ? 'beds' : 'visits';
  }

  render() {
    const tab = this.activeTab;
    const segments = this.path.split('/');

    // determine what to show inside each tab
    const visitId = tab === 'visits' && segments[0] === 'xpaucof-visit' && segments[1] ? segments[1] : null;
    const bedId   = tab === 'beds'   && segments[0] === 'xmasiarikova-bed' && segments[1] ? segments[1] : null;

    return (
      <Host>
        <div class="shell">
          <div class="frame">
            <md-tabs
              active-tab-index={tab === 'visits' ? 0 : 1}
              onchange={(ev: Event) => {
                const idx = (ev.target as any).activeTabIndex;
                this.navigate(idx === 0 ? './xpaucof-visit' : './xmasiarikova-bed');
              }}>
              <md-primary-tab>
                <md-icon slot="icon">event_note</md-icon>
                Vizity
              </md-primary-tab>
              <md-primary-tab>
                <md-icon slot="icon">bed</md-icon>
                Lôžka
              </md-primary-tab>
            </md-tabs>

            <div class="tab-content">
              {tab === 'visits' && (
                visitId
                  ? <xpaucof-visit-editor
                      visit-id={visitId}
                      ward-id={this.wardId}
                      api-base={this.visitApiBase}
                      oneditor-closed={() => this.navigate('./xpaucof-visit')}>
                    </xpaucof-visit-editor>
                  : <xpaucof-visit-list
                      ward-id={this.wardId}
                      api-base={this.visitApiBase}
                      onvisit-clicked={(ev: CustomEvent<string>) => this.navigate('./xpaucof-visit/' + ev.detail)}>
                    </xpaucof-visit-list>
              )}
              {tab === 'beds' && (
                bedId
                  ? <xmasiarikova-bed-editor
                      bed-id={bedId}
                      ward-id={this.wardId}
                      api-base={this.bedApiBase}
                      oneditor-closed={() => this.navigate('./xmasiarikova-bed')}>
                    </xmasiarikova-bed-editor>
                  : <xmasiarikova-bed-list
                      ward-id={this.wardId}
                      api-base={this.bedApiBase}
                      onbed-clicked={(ev: CustomEvent<string>) => this.navigate('./xmasiarikova-bed/' + ev.detail)}>
                    </xmasiarikova-bed-list>
              )}
            </div>
          </div>
        </div>
      </Host>
    );
  }
}
