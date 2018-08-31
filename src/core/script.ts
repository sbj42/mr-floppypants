export interface Tag {
    name: string;
    values: string[];
    children: Tag[];
}

const BLANK_RE = /^\s*$/;
const COMMENT_RE = /^\s*\/\/.*$/;
const TAG_START_RE = /^\s*[a-z-]+\s*\{$/;
const TAG_END_RE = /^\s*}$/;

export function parseFs(text: string, filename: string) {
    const tags: Tag[] = [];
    let curTag: Tag | undefined;
    const lines = text.split(/\r\n?/);
    for (let lineNum = 0; lineNum < lines.length; lineNum ++) {
        const line = lines[lineNum];

    }
}
