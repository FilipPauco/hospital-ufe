# xpaucof-visit-editor



<!-- Auto Generated Below -->


## Properties

| Property  | Attribute  | Description | Type     | Default     |
| --------- | ---------- | ----------- | -------- | ----------- |
| `apiBase` | `api-base` |             | `string` | `undefined` |
| `visitId` | `visit-id` |             | `string` | `undefined` |
| `wardId`  | `ward-id`  |             | `string` | `undefined` |


## Events

| Event           | Description | Type                  |
| --------------- | ----------- | --------------------- |
| `editor-closed` |             | `CustomEvent<string>` |


## Dependencies

### Used by

 - [xpaucof-hospital-app](../xpaucof-hospital-app)
 - [xpaucof-visit-app](../xpaucof-visit-app)

### Graph
```mermaid
graph TD;
  xpaucof-hospital-app --> xpaucof-visit-editor
  xpaucof-visit-app --> xpaucof-visit-editor
  style xpaucof-visit-editor fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
