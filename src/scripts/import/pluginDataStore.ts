import { D2Api } from "@eyeseetea/d2-api/2.41";
import { ImportInput } from "./ImportInput";
import { buildConstantCode } from "./constants";

type PluginConfig = Record<string, ({ code: string } | string)[]>;

const PLUGIN_NAMESPACE = "extra-texts-for-options-capture-plugin";
const PLUGIN_KEY = "extraTexts";

export async function getPluginDataStore(api: D2Api): Promise<PluginConfig> {
    try {
        const config = await api.dataStore(PLUGIN_NAMESPACE).get<PluginConfig>(PLUGIN_KEY).getData();
        return config ?? {};
    } catch (error) {
        if ((error as any).response?.status === 404) {
            return {};
        }
        throw error;
    }
}

export async function savePluginDataStore(api: D2Api, config: PluginConfig) {
    await api.dataStore(PLUGIN_NAMESPACE).save(PLUGIN_KEY, config).getData();
}

export function updatePluginConfig(config: PluginConfig, input: ImportInput[]): PluginConfig {
    const updatedConfig: PluginConfig = { ...config };
    input.forEach(importInput => {
        importInput.elements.forEach(element => {
            if (!updatedConfig[element.constantCode]) {
                updatedConfig[element.constantCode] = [];
            }
            element.options.forEach(option => {
                const elementCode = buildConstantCode(element.constantCode, option.concept);
                if (
                    !updatedConfig[element.constantCode].some(
                        existing => typeof existing === "object" && existing.code === elementCode
                    )
                ) {
                    updatedConfig[element.constantCode].push({ code: elementCode });
                }
            });
        });
    });
    return updatedConfig;
}
