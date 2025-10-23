# Import Command

The import command allows you to bulk import extra texts configuration from an Excel file directly into your DHIS2 instance. This automates the creation of constants and configuration of the plugin data store and capture forms.

## Usage

```bash
yarn run import <input-file> --dhis2-url <url> --dhis2-auth <username:password> [options]
```

## Required Arguments

-   **`<input-file>`**: Path to the Excel file containing the configuration data

## Required Options

-   **`--dhis2-url`** or **`-u`**: DHIS2 base URL (e.g., `http://localhost:8080`)
    -   Can also be set via `DHIS2_URL` environment variable
-   **`--dhis2-auth`** or **`-a`**: DHIS2 authentication in format `USERNAME:PASSWORD`
    -   Can also be set via `DHIS2_AUTH` environment variable

## Optional Flags

-   **`--push`** or **`-p`**: Actually push changes to DHIS2. Without this flag, the command only simulates the process (dry run)
-   **`--output-dir`** or **`-o`**: Directory path to save the generated JSON files locally
-   **`--sharing`** or **`-s`**: Path to a JSON file containing sharing settings to apply to created constants. If not provided, constants will have default sharing settings. An example file is included in [sharing_example.json](./src/scripts/import/data/sharing_example.json)

## Excel File Format

The Excel file should contain one or more sheets, each representing a program. The sheet structure should follow this format:

### Sheet Naming Convention

-   Sheet name format: `{programId} - {Description}`
-   Example: `WSGALMQEcbh - Pregnancy Monitoring`

### Column Headers

| QuestionUID | Key                     | Response      | Audit Evidence    |
| ----------- | ----------------------- | ------------- | ----------------- |
| {DHIS2 ID}  | {CONSTANT_CODE}         | {Option text} | {Definition text} |
|             |                         | {Option text} | {Definition text} |
| {DHIS2 ID}  | {ANOTHER_CONSTANT_CODE} | {Option text} | {Definition text} |

### Column Descriptions

-   **QuestionUID**: DHIS2 ID of the question/field
-   **Key**: Constant code identifier (will be used as extraTexts configuration key)
-   **Response**: The concept/option text to display
-   **Audit Evidence**: The definition/evidence text for the option

### Rules

-   The first row for each question must include both `QuestionUID` and `Key`
-   Subsequent rows for the same question can omit `QuestionUID` and `Key` to add multiple options
-   Each sheet must have a valid DHIS2 program ID at the beginning of its name

### Example file

An example file is included in [example.xlsx](./src/scripts/import/data/example.xlsx)

## Examples

### 1. Dry run (simulation mode)

```bash
yarn run import src/scripts/import/data/example.xlsx \
  --dhis2-url http://localhost:8080 \
  --dhis2-auth admin:district
```

### 2. Push changes to DHIS2

```bash
yarn run import src/scripts/import/data/example.xlsx \
  --dhis2-url https://play.dhis2.org/demo \
  --dhis2-auth admin:district \
  --push
```

### 3. Save output files locally without pushing

```bash
yarn run import src/scripts/import/data/example.xlsx \
  --dhis2-url http://localhost:8080 \
  --dhis2-auth admin:district \
  --output-dir ./output
```

### 4. Using environment variables

```bash
export DHIS2_URL=http://localhost:8080
export DHIS2_AUTH=admin:district

yarn run import src/scripts/import/data/example.xlsx --push
```

### 5. Full example with all options

```bash
yarn run import ./data/pregnancy-config.xlsx \
  --dhis2-url https://play.dhis2.org/demo \
  --dhis2-auth admin:district \
  --sharing ./src/scripts/import/data/sharing_example.json \
  --push \
  --output-dir ./src/scripts/import/output
```

## What the Import Does

When executed with the `--push` flag, the import command:

1. **Validates** programs and questions already exist in the `capture/dataEntryForms` configuration. If not, you should create them first using the `tracker-plugin-configurator` app
2. **Creates DHIS2 constants** one constant per row with:
    - Code: `Key` column as prefix, and the value from `Response`
    - Description: `{response}: {Audit Evidence}`
    - Sharing settings: if a `--sharing` file is provided, it will be included as-is during the import.
3. **Updates the plugin data store** (`extra-texts-for-options-capture-plugin/extraTexts`) with the field mappings (`Key`) to all constants created for that key.
4. **Updates capture data entry forms** to include the extra texts plugin with the configuration, before each question

## Output Files

When using `--output-dir`, the command generates three JSON files:

-   **`constants.json`**: Array of constants to be imported
-   **`pluginDataStore.json`**: Updated plugin configuration
-   **`captureDataEntryForms.json`**: Updated capture forms configuration

These files can be useful for:

-   Reviewing changes before pushing to DHIS2
-   Manual import/export workflows
-   Version control and auditing
