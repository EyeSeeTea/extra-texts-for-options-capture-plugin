import { D2Api } from "../d2-api";
import { name as PLUGIN_NAME } from "../../../d2.config.js";

export function getPluginUrl(api: D2Api): string {
    return `${api.baseUrl.replace(/\/+$/, "")}/api/apps/${PLUGIN_NAME}/plugin.html`;
}
