export interface PropertyDescriptor {
    name: string;
    value: JSONNode;
}

export class JSONNode {
    readonly value: unknown;

    constructor(value: unknown) {
        this.value = value;
    }

    static fromLocalObject(value: unknown): JSONNode {
        return new JSONNode(value);
    }

    get description(): string {
        if (this.value === null) return 'null';
        if (this.value === undefined) return 'undefined';
        if (typeof this.value === 'object') {
            const isArray = Array.isArray(this.value);
            return isArray ? `Array(${this.value.length})` : 'Object';
        }
        return String(this.value);
    }

    get type(): string {
        return typeof this.value;
    }

    get subtype(): string | undefined {
        if (Array.isArray(this.value)) return 'array';
        if (this.value === null) return 'null';
        return undefined;
    }

    hasChildren(): boolean {
        if (typeof this.value !== 'object' || this.value === null) {
            return false;
        }
        return Object.keys(this.value).length > 0;
    }

    getOwnProperties(): PropertyDescriptor[] {
        if (typeof this.value !== 'object' || this.value === null) {
            return [];
        }

        const properties: PropertyDescriptor[] = [];
        for (const [k, v] of Object.entries(this.value)) {
            properties.push({
                name: k,
                value: new JSONNode(v),
            });
        }
        return properties;
    }
}
