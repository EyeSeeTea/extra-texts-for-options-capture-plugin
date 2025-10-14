/**
 * capture/dataEntryForms dataStore structure
 */
export interface DataEntryForm {
    id: string;
    elements: (DataEntryFormElement | DataEntryFormPlugin)[];
}

export interface DataEntryFormElement {
    id: string;
    type: string;
}

export interface DataEntryFormPlugin {
    id: string;
    pluginSource: string;
    type: "plugin";
    fieldMap: DataEntryFormPluginFieldMap[];
}

export interface DataEntryFormPluginFieldMap {
    IdFromApp: string;
    IdFromPlugin: string;
    objectType: string;
}
