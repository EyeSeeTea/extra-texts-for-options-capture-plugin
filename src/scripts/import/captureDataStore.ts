import { D2Api } from "@eyeseetea/d2-api/2.41";
import { DataEntryForm, DataEntryFormPlugin } from "./DataEntryForm";
import { ImportInput } from "./ImportInput";

type CaptureConfig = Record<string, DataEntryForm[]>;

const CAPTURE_NAMESPACE = "capture";
const CAPTURE_KEY = "dataEntryForms";

export async function getCaptureConfig(api: D2Api): Promise<CaptureConfig> {
    const config = await api.dataStore(CAPTURE_NAMESPACE).get<CaptureConfig>(CAPTURE_KEY).getData();
    return config;
}

export async function saveCaptureConfig(api: D2Api, config: CaptureConfig) {
    await api.dataStore(CAPTURE_NAMESPACE).save(CAPTURE_KEY, config).getData();
}

export function validateCaptureConfig(config: CaptureConfig, importInput: ImportInput): void {
    const configForProgram = config[importInput.programId];
    if (!configForProgram) {
        throw new Error(
            `Program ID "${importInput.programId}" not found in capture/dataEntryForms. First generate it using tracker-plugin-configurator.`
        );
    }
    const allIdsInConfig = configForProgram.flatMap(form => form.elements.map(el => el.id));
    importInput.elements.forEach(element => {
        if (!allIdsInConfig.includes(element.questionId)) {
            throw new Error(
                `Question ID "${element.questionId}" (from program "${importInput.programId}") not found in capture/dataEntryForms. First generate it using tracker-plugin-configurator.`
            );
        }
    });
}

/**
 * Inserts plugin elements before each questionId
 * If there is already a plugin element before the questionId, it skips adding a new one
 */
export function updateCaptureConfig(
    config: CaptureConfig,
    importInputs: ImportInput[],
    pluginSource: string
): CaptureConfig {
    let updatedConfig = { ...config };

    for (const importInput of importInputs) {
        const configForProgram = updatedConfig[importInput.programId];
        if (!configForProgram) {
            throw new Error(`Program ID "${importInput.programId}" not found in capture/dataEntryForms.`);
        }

        updatedConfig[importInput.programId] = configForProgram.map(form => {
            const updatedElements = [...form.elements];

            importInput.elements.forEach(element => {
                const elementIndex = updatedElements.findIndex(el => el.id === element.questionId);

                if (elementIndex === -1) {
                    // element not found in current section
                    return;
                }

                const previousElement = updatedElements[elementIndex - 1];
                if (previousElement && previousElement.type === "plugin") {
                    return; // Skip adding a new plugin element if the previous one is already a plugin
                }

                const pluginElement: DataEntryFormPlugin = {
                    id: `extra-texts-for-options-capture-plugin_${Date.now()}_${Math.random()}`,
                    pluginSource: pluginSource,
                    type: "plugin",
                    fieldMap: [
                        {
                            IdFromApp: element.questionId,
                            IdFromPlugin: element.constantCode,
                            objectType: "TrackedEntityAttribute",
                        },
                    ],
                };

                // Insert the plugin element before the found element
                updatedElements.splice(elementIndex, 0, pluginElement);
            });

            return {
                ...form,
                elements: updatedElements,
            };
        });
    }

    return updatedConfig;
}
