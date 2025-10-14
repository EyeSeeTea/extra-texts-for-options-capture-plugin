import { D2Api } from "@eyeseetea/d2-api/2.41";
import { ImportInput } from "./ImportInput";

const codeAbbreviations = {
    "Not yet Implemented": "NYI",
    "Limited Implementation": "LI",
    "Expanded Implementation": "EI",
    "Fully Implemented": "FI",
} as const;

const CODE_MAX_LENGTH = 70;

export function buildConstantCode(constantPrefix: string, concept: string): string {
    const abbreviated = Object.entries(codeAbbreviations).reduce((acc, [key, value]) => {
        return acc.replace(new RegExp(key, "gi"), value);
    }, concept);
    let normalizedConcept = abbreviated
        .trim()
        .toUpperCase()
        .replace(/\s+/g, "_")
        .replace(/[^A-Z0-9_]/g, "");
    const code = `${constantPrefix}_${normalizedConcept}`;
    if (code.length <= CODE_MAX_LENGTH) {
        return code;
    }
    return code.substring(0, CODE_MAX_LENGTH);
}

export function buildShortName(constantCode: string, concept: string): string {
    const abbreviatedConcept = Object.entries(codeAbbreviations).reduce((acc, [key, value]) => {
        return acc.replace(new RegExp(key, "gi"), value);
    }, concept);
    return constantCode.split("_").join(" - ") + " - " + abbreviatedConcept;
}

export type Constant = {
    name: string;
    shortName: string;
    code: string;
    description: string;
    value: 0;
};

export function buildConstants(importInput: ImportInput[]): Constant[] {
    const constantsToCreate: Constant[] = [];
    for (const input of importInput) {
        for (const element of input.elements) {
            for (const option of element.options) {
                const code = buildConstantCode(element.constantCode, option.concept);
                const shortName = buildShortName(element.constantCode, option.concept);
                constantsToCreate.push({
                    code: code,
                    name: shortName,
                    shortName: shortName,
                    description: `${option.concept}: ${option.definition}`,
                    value: 0,
                });
            }
        }
    }
    return constantsToCreate;
}

export async function importConstants(api: D2Api, constants: Constant[]): Promise<Constant[]> {
    if (constants.length === 0) {
        return [];
    }

    // need to pass the constants with the ids of existing ones to update them
    // otherwise the import fails with "Code already exists"
    const constantCodes = constants.map(c => c.code);
    const existingConstantsResponse = await api.models.constants
        .get({
            fields: { id: true, code: true },
            filter: { code: { in: constantCodes } },
            paging: false,
        })
        .getData();
    const existingConstantsMap = new Map(existingConstantsResponse.objects.map(c => [c.code, c.id]));
    const constantsWithIds = constants.map(constant => {
        const existingId = existingConstantsMap.get(constant.code);
        if (existingId) {
            return { ...constant, id: existingId };
        }
        return constant;
    });

    const result = await api.metadata
        .post(
            {
                constants: constantsWithIds,
            },
            {
                importStrategy: "CREATE_AND_UPDATE",
            }
        )
        .getData();

    if (result.status !== "OK") {
        throw new Error(`Failed to create/update constants: ${JSON.stringify(result)}`);
    }

    return constants;
}
