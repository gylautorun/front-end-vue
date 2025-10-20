export interface TreeStyle {
    minWidth: number;
    maxWidth: number;
    cardWidth: number;
    cardMargin: number;
    connectLineHeight: number;
    borderColor: string;
    highlightColor: string;
    highlightShadow: string;
}

export interface TreeParams {
    data: TreeData | null;
    treeType?: string;
    isSecondRequest?: boolean;
    focusId?: string;
    style?: Partial<TreeStyle>;
    appendHTML?: string;
}

export interface TreeData {
    id: string | number;
    pid?: string | number;
    childFlag: boolean;
    isOpen?: boolean;
    children: TreeData[];
    [key: string]: unknown;
}