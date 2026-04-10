import { Component, Host, Prop, State, h } from '@stencil/core';

declare global {
  interface Window { navigation: any; }
}

@Component({
  tag: 'xpaucof-visit-app',
  shadow: true,
})
export class XpaucofVisitApp {
  @State() private relativePath = "";
  @Prop() basePath: string = "";
  @Prop() apiBase: string;
  @Prop() wardId: string;

  componentWillLoad() {
    const baseUri = new URL(this.basePath, document.baseURI || "/").pathname;

    const toRelative = (path: string) => {
      if (path.startsWith(baseUri)) {
        this.relativePath = path.slice(baseUri.length);
      } else {
        this.relativePath = "";
      }
    }

    window.navigation?.addEventListener("navigate", (ev: Event) => {
      if ((ev as any).canIntercept) { (ev as any).intercept(); }
      let path = new URL((ev as any).destination.url).pathname;
      toRelative(path);
    });

    toRelative(location.pathname);
  }

  render() {
    let element = "list";
    let visitId = "@new";

    if (this.relativePath.startsWith("entry/")) {
      element = "editor";
      visitId = this.relativePath.split("/")[1];
    }

    const navigate = (path: string) => {
      const absolute = new URL(path, new URL(this.basePath, document.baseURI)).pathname;
      window.navigation.navigate(absolute);
    }

    return (
      <Host>
        {element === "editor"
          ? <xpaucof-visit-editor visit-id={visitId}
              ward-id={this.wardId} api-base={this.apiBase}
              oneditor-closed={() => navigate("./list")}>
            </xpaucof-visit-editor>
          : <xpaucof-visit-list ward-id={this.wardId} api-base={this.apiBase}
              onvisit-clicked={(ev: CustomEvent<string>) => navigate("./entry/" + ev.detail)}>
            </xpaucof-visit-list>
        }
      </Host>
    );
  }
}
