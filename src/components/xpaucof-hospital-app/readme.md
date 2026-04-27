# xpaucof-hospital-app



<!-- Auto Generated Below -->


## Properties

| Property       | Attribute        | Description | Type     | Default     |
| -------------- | ---------------- | ----------- | -------- | ----------- |
| `basePath`     | `base-path`      |             | `string` | `''`        |
| `bedApiBase`   | `bed-api-base`   |             | `string` | `undefined` |
| `visitApiBase` | `visit-api-base` |             | `string` | `undefined` |
| `wardId`       | `ward-id`        |             | `string` | `undefined` |


## Dependencies

### Depends on

- [xpaucof-visit-editor](../xpaucof-visit-editor)
- [xpaucof-visit-list](../xpaucof-visit-list)
- [xmasiarikova-bed-editor](../xmasiarikova-bed-editor)
- [xmasiarikova-bed-list](../xmasiarikova-bed-list)

### Graph
```mermaid
graph TD;
  xpaucof-hospital-app --> xpaucof-visit-editor
  xpaucof-hospital-app --> xpaucof-visit-list
  xpaucof-hospital-app --> xmasiarikova-bed-editor
  xpaucof-hospital-app --> xmasiarikova-bed-list
  style xpaucof-hospital-app fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
