import { Component, Host, Prop, State, h } from '@stencil/core';

declare global {
  interface Window { navigation: any; }
}

@Component({
  tag: 'xmasiarikova-bed-app',
  shadow: true,
})
export class XmasiarikovaBedApp {
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
    let bedId = "@new";

    if (this.relativePath.startsWith("entry/")) {
      element = "editor";
      bedId = this.relativePath.split("/")[1];
    }

    const navigate = (path: string) => {
      const absolute = new URL(path, new URL(this.basePath, document.baseURI)).pathname;
      window.navigation.navigate(absolute);
    }

    return (
      <Host>
        {element === "editor"
          ? <xmasiarikova-bed-editor bed-id={bedId}
              ward-id={this.wardId} api-base={this.apiBase}
              oneditor-closed={() => navigate("./list")}>
            </xmasiarikova-bed-editor>
          : <xmasiarikova-bed-list ward-id={this.wardId} api-base={this.apiBase}
              onbed-clicked={(ev: CustomEvent<string>) => navigate("./entry/" + ev.detail)}>
            </xmasiarikova-bed-list>
        }
      </Host>
    );
  }
}
