import path from "path";
import fs from "fs";
import * as XLSX from "xlsx";
import { ImportElement, ImportElementOption, ImportInput } from "./ImportInput";

const VALID_EXTENSIONS = [".xlsx", ".xls", ".xlsm", ".xlsb"];
const DHIS2_ID_REGEX = /^[a-zA-Z][a-zA-Z0-9]{10}$/;

export async function parseExcelFile(filePath: string): Promise<ImportInput[]> {
    if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
    }
    const ext = path.extname(filePath).toLowerCase();
    if (!VALID_EXTENSIONS.includes(ext)) {
        throw new Error(`Invalid file type: ${ext}. Expected Excel file (${VALID_EXTENSIONS.join(", ")})`);
    }
    const fileBuffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(fileBuffer, { type: "buffer" });
    const result: ImportInput[] = [];

    for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        result.push(parseSheet(sheetName, data));
    }
    return result;
}

const mappings: Record<keyof Omit<ImportElement, "options">, string> = {
    questionId: "QuestionUID",
    constantCode: "Key",
} as const;

const optionMappings: Record<keyof ImportElementOption, string> = {
    concept: "Response",
    definition: "Audit Evidence",
} as const;

function parseSheet(sheetName: string, data: unknown[]): ImportInput {
    const programId = sheetName.split("-")[0].trim();
    if (!programId || !DHIS2_ID_REGEX.test(programId)) {
        throw new Error(
            `Invalid or missing programId in sheet name "${sheetName}". Expected format: "programId - Description" where programId is a valid DHIS2 ID.`
        );
    }
    const elements: ImportElement[] = [];
    let currentElement: ImportElement | null = null;
    for (const row of data) {
        if (typeof row !== "object" || row === null) {
            throw new Error(`Invalid row format in sheet "${sheetName}"`);
        }
        const newElement = mapRow(sheetName, row, currentElement);
        if (newElement && newElement !== currentElement) {
            elements.push(newElement);
            currentElement = newElement;
        }
    }
    return {
        programId: programId,
        elements: elements,
    };
}

function mapRow(sheetName: string, data: object, currentElement: ImportElement | null): ImportElement {
    const option: ImportElementOption = {
        concept: String((data as any)[optionMappings.concept] || "").trim(),
        definition: String((data as any)[optionMappings.definition] || "").trim(),
    };
    if (
        Object.prototype.hasOwnProperty.call(data, mappings.questionId) &&
        Object.prototype.hasOwnProperty.call(data, mappings.constantCode)
    ) {
        const questionId = String((data as any)[mappings.questionId] || "").trim();
        const constantCode = String((data as any)[mappings.constantCode] || "").trim();
        if (!currentElement && (!questionId || !DHIS2_ID_REGEX.test(questionId))) {
            console.error({ currentElement, questionId });
            throw new Error(`Invalid or missing QuestionUID in sheet "${sheetName}"`);
        }
        if (!currentElement && !constantCode) {
            throw new Error(`Missing Key in sheet "${sheetName}" for questionId "${questionId}"`);
        }
        return {
            questionId: questionId,
            constantCode: constantCode,
            options: [option],
        };
    } else if (!currentElement) {
        throw new Error(`Missing QuestionUID or Key in sheet "${sheetName}"`);
    } else {
        currentElement.options.push(option);
    }
    return currentElement;
}
