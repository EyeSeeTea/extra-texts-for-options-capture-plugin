export interface ImportInput {
    programId: string;
    elements: ImportElement[];
}

export interface ImportElement {
    questionId: string;
    constantCode: string;
    options: ImportElementOption[];
}

export interface ImportElementOption {
    concept: string;
    definition: string;
}
