import { command, run, string, option, positional, flag, boolean } from "cmd-ts";
import path from "path";

import { D2Api } from "./d2-api";
import { parseExcelFile } from "./import/parseExcelFile";
import {
    getCaptureConfig,
    saveCaptureConfig,
    updateCaptureConfig,
    validateCaptureConfig,
} from "./import/captureDataStore";
import { buildConstants, importConstants } from "./import/constants";
import { getPluginUrl } from "./import/getPluginUrl";
import { getPluginDataStore, savePluginDataStore, updatePluginConfig } from "./import/pluginDataStore";

function main() {
    const cmd = command({
        name: path.basename(__filename),
        description: "Import data from Excel file to DHIS2 instance",
        args: {
            inputFile: positional({
                type: string,
                displayName: "input-file",
                description: "Path to the input Excel file",
            }),
            url: option({
                type: string,
                long: "dhis2-url",
                short: "u",
                description: "DHIS2 base URL. Example: http://localhost:8080",
                env: "DHIS2_URL",
            }),
            auth: option({
                type: string,
                long: "dhis2-auth",
                short: "a",
                description: "DHIS2 Auth. USERNAME:PASSWORD",
                env: "DHIS2_AUTH",
            }),
            push: flag({
                type: boolean,
                long: "push",
                short: "p",
                description: "Actually push changes to DHIS2. Without this flag, it only simulates the process.",
                defaultValue: () => false,
            }),
            outputDir: option({
                type: string,
                long: "output-dir",
                short: "o",
                description: "Output directory for generated files to be imported into DHIS2.",
                defaultValue: () => "",
            }),
            sharingSettingsFile: option({
                type: string,
                long: "sharing",
                short: "s",
                description: "Path to a JSON file containing sharing settings to apply to created constants.",
                defaultValue: () => "",
            }),
        },
        handler: async args => {
            try {
                const [username = "", password = ""] = (args.auth || "").split(":");
                const auth = { username, password };
                const api = new D2Api({ baseUrl: args.url, auth: auth, backend: "xhr" });
                const info = await api.system.info.getData();
                console.log(`✅ Connected to DHIS2: ${info.contextPath} (v${info.version})`);
                const pluginUrl = getPluginUrl(api);
                console.log(`🔗 Using plugin URL: ${pluginUrl}`);
                const excelData = await parseExcelFile(args.inputFile);
                const captureConfig = await getCaptureConfig(api);
                for (const sheet of excelData) {
                    validateCaptureConfig(captureConfig, sheet);
                }
                console.log("✓ All question IDs from the Excel file are valid and present in capture/dataEntryForms");
                const sharingSettings = await getSharingSettingsFromFile(args.sharingSettingsFile);
                const constants = buildConstants(excelData, sharingSettings);
                console.log(`🔧 Built ${constants.length} constants`);
                if (args.outputDir) {
                    await saveJsonToFile({ constants }, args.outputDir, "constants.json");
                }
                if (args.push) {
                    console.log(`⬆️  Importing ${constants.length} constants to DHIS2...`);
                    await importConstants(api, constants);
                    console.log("   ✓ Constants imported successfully");
                }
                const currentPluginConfig = await getPluginDataStore(api);
                const newPluginConfig = updatePluginConfig(currentPluginConfig, excelData);
                console.log("🔧 Prepared plugin configuration updates");
                if (args.outputDir) {
                    await saveJsonToFile(newPluginConfig, args.outputDir, "pluginDataStore.json");
                }
                if (args.push) {
                    console.log("⬆️  Saving plugin configuration to DHIS2...");
                    await savePluginDataStore(api, newPluginConfig);
                    console.log("   ✓ Plugin configuration saved successfully");
                }
                const newCaptureConfig = updateCaptureConfig(captureConfig, excelData, pluginUrl);
                console.log("🔧 Prepared capture/dataEntryForms configuration updates");
                if (args.outputDir) {
                    await saveJsonToFile(newCaptureConfig, args.outputDir, "captureDataEntryForms.json");
                }
                if (args.push) {
                    console.log("⬆️  Saving capture/dataEntryForms configuration to DHIS2...");
                    await saveCaptureConfig(api, newCaptureConfig);
                    console.log("   ✓ Capture configuration saved successfully");
                }
                console.log("\n✨ Done! Import completed successfully.\n");
                process.exit(0);
            } catch (error) {
                console.error("\n❌ Error:", error instanceof Error ? error.message : String(error));
                process.exit(1);
            }
        },
    });

    run(cmd, process.argv.slice(2));
}

async function saveJsonToFile(data: any, outputDir: string, fileName: string) {
    const fs = await import("fs/promises");
    const path = await import("path");
    const fullPath = path.join(outputDir, fileName);
    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(fullPath, JSON.stringify(data, null, 2), "utf-8");
    console.log(`💾 Saved file: ${fullPath}`);
}

async function parseJsonObjectFromFile(filePath: string): Promise<object> {
    const fs = await import("fs/promises");
    const data = await fs.readFile(filePath, "utf-8");
    const result = JSON.parse(data);
    if (typeof result !== "object" || result === null) {
        throw new Error(`JSON is not an object: ${filePath}`);
    }
    return result;
}

async function getSharingSettingsFromFile(filePath: string): Promise<object | undefined> {
    if (!filePath) {
        console.log("⚠️  No sharing settings file provided. Constants will have default sharing settings.");
        return undefined;
    }
    try {
        const sharingSettings = await parseJsonObjectFromFile(filePath);
        return sharingSettings;
    } catch (error) {
        console.log(
            `❌ Error reading sharing settings file: ${error instanceof Error ? error.message : String(error)}`
        );
        throw error;
    }
}

main();
