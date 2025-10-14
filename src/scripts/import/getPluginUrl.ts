import { D2Api } from "@eyeseetea/d2-api/2.41";

export function getPluginUrl(api: D2Api): string {
    return `${api.baseUrl.replace(/\/+$/, "")}/api/apps/extra-texts-for-options-capture-plugin/plugin.html`;
}
