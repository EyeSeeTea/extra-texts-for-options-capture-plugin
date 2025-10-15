import { D2Api } from "@eyeseetea/d2-api/2.41";
import { name as PLUGIN_NAME } from "../../../d2.config.js";

export function getPluginUrl(api: D2Api): string {
    return `${api.baseUrl.replace(/\/+$/, "")}/api/apps/${PLUGIN_NAME}/plugin.html`;
}
