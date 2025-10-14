## Extra texts for options capture plugin

Show extra texts defined in the data store extra-texts-for-options-capture-plugin/extraTexts

Define a property by plugin field using as key the same that alias field

### How to use

1. Install plugin `.zip` file
2. Download and install the Tracker configurator app from the _App management application_ or from the [App hub](https://apps.dhis2.org/app/85d156b7-6e3f-43f0-be57-395449393f7d).
3. Follow the instructions in the Tracker configurator app to configure the plugin.
4. Open the Capture app and create or edit the configured entity.

### Configuration

The plugin requires configuration in two places:

#### 1. Tracker Plugin Configurator

In the Tracker Plugin Configurator app, map a field to a **unique identifier string** (field alias):

1. Open the Tracker Plugin Configurator app
2. Select the program/tracker you want to configure
3. Add the plugin above an specific field
4. In Plugin Settings -> Attributes, map the field to a unique string identifier (e.g., `"myFieldId"`, `"pregnancyStatus"`, etc.)

This field alias will be used as the key to match with the data store configuration.

#### 2. Data Store Configuration

Create an entry in the DHIS2 data store with the namespace `extra-texts-for-options-capture-plugin` and key `extraTexts`.

The data store structure is a JSON object where:

-   **Keys** are the field aliases defined in the Tracker Plugin Configurator
-   **Values** are arrays of extra texts to display for that field

Each extra text can be:

-   A **direct string** (the text to display)
-   A **reference to a constant** using the format `{ "code": "CONSTANT_CODE" }`. Using constants will allow for multi-language support and reusable text snippets across fields.

**Example configuration:**

```json
{
    "myFieldId": [
        "This is a direct text message",
        "Bold prefix: Regular text",
        { "code": "MY_FIELD_FROM_CONSTANTS_CODE" }
    ],
    "pregnancyStatus": [{ "code": "PREGNANCY_OPTION" }, { "code": "PREGNANCY_OTHEROPTION" }]
}
```

### Development

1. `yarn install`
2. `yarn start`
3. Configure the plugin in Tracker Plugin Configurator with "Add Local Plugin" -> url: `http://localhost:3000/plugin.html`.

### Bulk Import from Excel

For administrators who need to configure multiple fields at once, you can use the import command to bulk import configuration from an Excel file. This automates the creation of constants, configuration of the plugin data store and configuration of the capture plugins.

**Quick example:**

```bash
yarn run import ./data/config.xlsx \
  --dhis2-url http://localhost:8080 \
  --dhis2-auth admin:district \
  --push
```

📖 **For detailed documentation, Excel file format, and more examples, see [IMPORT.md](./IMPORT.md)**

### Generate a release

1. `yarn install`
2. Update `version` in `package.json` if required
3. `yarn build`

The output will be the `build/bundle/extra-texts-for-options-capture-plugin-{version}.zip` file, ready to upload in App Management -> Manual Install.
