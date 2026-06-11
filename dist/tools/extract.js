import { Type } from "@sinclair/typebox";
import { sessionDetails as baseSessionDetails } from "../steel-client.js";
import { emitProgress, throwIfAborted, withAbortSignal, withToolError, } from "./tool-runtime.js";
const ALLOWED_TYPES = new Set([
    "object",
    "array",
    "string",
    "number",
    "integer",
    "boolean",
    "null",
]);
function asPlainObject(input, path) {
    if (!input || typeof input !== "object" || Array.isArray(input)) {
        throw new Error(`Schema at ${path} must be an object.`);
    }
    return input;
}
function normalizeBoolean(value, path) {
    if (typeof value === "boolean") {
        return value;
    }
    throw new Error(`Schema at ${path} must define a boolean value.`);
}
function normalizeString(value, path) {
    if (value === undefined) {
        return undefined;
    }
    if (typeof value !== "string") {
        throw new Error(`Schema at ${path} must define a string value.`);
    }
    const normalized = value.trim();
    if (!normalized) {
        throw new Error(`Schema at ${path} must not be empty.`);
    }
    return normalized;
}
function normalizeRequired(value, properties, path) {
    if (value === undefined) {
        return [];
    }
    if (!Array.isArray(value) || value.length !== value.filter((entry) => typeof entry === "string").length) {
        throw new Error(`Schema at ${path} must use an array of strings for required fields.`);
    }
    return value.filter((entry) => true);
}
function normalizeSchemaType(rawType, rawSchema, path) {
    const hasProperties = Object.prototype.hasOwnProperty.call(rawSchema, "properties");
    const hasItems = Object.prototype.hasOwnProperty.call(rawSchema, "items");
    if (rawType === undefined) {
        if (hasProperties) {
            return "object";
        }
        if (hasItems) {
            return "array";
        }
        throw new Error(`Schema at ${path} must define a type or include "properties"/"items" to infer object/array shape.`);
    }
    if (typeof rawType !== "string" || !ALLOWED_TYPES.has(rawType)) {
        throw new Error(`Schema at ${path} has unsupported type "${String(rawType)}".`);
    }
    return rawType;
}
function normalizeProperties(rawValue, path) {
    if (rawValue === undefined) {
        return {};
    }
    if (!rawValue || typeof rawValue !== "object" || Array.isArray(rawValue)) {
        throw new Error(`Schema at ${path} must use an object for properties.`);
    }
    const properties = rawValue;
    const normalized = {};
    for (const [name, propertySchema] of Object.entries(properties)) {
        normalized[name] = normalizeSchema(propertySchema, `${path}.${name}`);
    }
    return normalized;
}
function normalizeSchema(rawSchema, path) {
    const schemaObject = asPlainObject(rawSchema, path);
    const type = normalizeSchemaType(schemaObject.type, schemaObject, path);
    const schema = {
        type,
        properties: {},
        required: [],
        additionalProperties: true,
    };
    if (type === "object") {
        const properties = normalizeProperties(schemaObject.properties, `${path}.properties`);
        schema.properties = properties;
        schema.required = normalizeRequired(schemaObject.required, properties, `${path}.required`);
        schema.additionalProperties = normalizeBoolean(schemaObject.additionalProperties ?? true, `${path}.additionalProperties`);
        return schema;
    }
    if (type === "array") {
        schema.items = normalizeSchema(schemaObject.items, `${path}.items`);
        schema.additionalProperties = normalizeBoolean(schemaObject.additionalProperties ?? true, `${path}.additionalProperties`);
        return schema;
    }
    schema.selector = normalizeString(schemaObject.selector, `${path}.selector`);
    schema.attribute = normalizeString(schemaObject.attribute, `${path}.attribute`);
    schema.additionalProperties = normalizeBoolean(schemaObject.additionalProperties ?? true, `${path}.additionalProperties`);
    return schema;
}
function enforceStrictMode(schema) {
    if (schema.type === "object") {
        const properties = {};
        for (const [key, propertySchema] of Object.entries(schema.properties)) {
            properties[key] = enforceStrictMode(propertySchema);
        }
        return {
            ...schema,
            additionalProperties: false,
            properties,
        };
    }
    if (schema.type === "array") {
        return {
            ...schema,
            items: schema.items ? enforceStrictMode(schema.items) : undefined,
        };
    }
    return { ...schema };
}
function readSessionUrl(session) {
    const direct = session.url;
    if (typeof direct === "string" && direct.trim()) {
        return Promise.resolve(direct);
    }
    if (typeof direct === "function") {
        return Promise.resolve(direct.call(session)).then((value) => {
            if (typeof value === "string" && value.trim()) {
                return value;
            }
            return "unknown";
        });
    }
    const getter = session.getCurrentUrl;
    if (typeof getter === "function") {
        return Promise.resolve(getter.call(session)).then((value) => {
            if (typeof value === "string" && value.trim()) {
                return value;
            }
            return "unknown";
        });
    }
    return Promise.resolve("unknown");
}
function sessionDetails(session, url, scopeSelector) {
    return {
        ...baseSessionDetails(session),
        url,
        scopeSelector,
    };
}
function buildPrompt(summary, instructions) {
    const instructionLine = instructions ? `\nInstructions: ${instructions}` : "";
    return `Extract structured JSON from the page following this schema contract.${instructionLine}\n${summary}`;
}
function summarizeSchema(schema, path) {
    const lines = [];
    const children = [];
    const requiredSet = new Set(schema.required);
    if (schema.type === "object") {
        lines.push(`${path}: object`);
        for (const [key, propertySchema] of Object.entries(schema.properties)) {
            const childPath = `${path}.${key}`;
            children.push(...summarizeSchema(propertySchema, `${childPath}${requiredSet.has(key) ? " (required)" : ""}`));
        }
    }
    else if (schema.type === "array") {
        lines.push(`${path}: array`);
        if (schema.items) {
            lines.push(...summarizeSchema(schema.items, `${path}[]`));
        }
    }
    else {
        const selectorPart = schema.selector ? ` selector=${schema.selector}` : "";
        const attributePart = schema.attribute ? ` attr=${schema.attribute}` : "";
        lines.push(`${path}: ${schema.type}${selectorPart}${attributePart}`);
    }
    return [...lines, ...children];
}
function toPathPart(name) {
    return name.includes(".") ? `["${name}"]` : `.${name}`;
}
function pushError(errors, path, message) {
    errors.push(`${path}: ${message}`);
}
function validateExtraction(value, schema, path, errors) {
    if (schema.type === "object") {
        if (!value || typeof value !== "object" || Array.isArray(value)) {
            pushError(errors, path, "expected object");
            return;
        }
        const record = value;
        const valueKeys = Object.keys(record);
        if (!schema.additionalProperties) {
            for (const key of valueKeys) {
                if (!Object.prototype.hasOwnProperty.call(schema.properties, key)) {
                    pushError(errors, `${path}${toPathPart(key)}`, "unexpected property");
                }
            }
        }
        for (const required of schema.required) {
            if (!Object.prototype.hasOwnProperty.call(record, required)) {
                pushError(errors, `${path}${toPathPart(required)}`, "missing required value");
            }
        }
        for (const [key, childSchema] of Object.entries(schema.properties)) {
            if (!Object.prototype.hasOwnProperty.call(record, key)) {
                continue;
            }
            validateExtraction(record[key], childSchema, `${path}${toPathPart(key)}`, errors);
        }
        return;
    }
    if (schema.type === "array") {
        if (!Array.isArray(value)) {
            pushError(errors, path, "expected array");
            return;
        }
        if (!schema.items) {
            return;
        }
        for (let i = 0; i < value.length; i++) {
            validateExtraction(value[i], schema.items, `${path}[${i}]`, errors);
        }
        return;
    }
    if (schema.type === "string") {
        if (typeof value !== "string") {
            pushError(errors, path, "expected string");
        }
        return;
    }
    if (schema.type === "number" || schema.type === "integer") {
        if (typeof value !== "number" || !Number.isFinite(value)) {
            pushError(errors, path, "expected finite number");
            return;
        }
        if (schema.type === "integer" && !Number.isInteger(value)) {
            pushError(errors, path, "expected integer");
        }
        return;
    }
    if (schema.type === "boolean") {
        if (typeof value !== "boolean") {
            pushError(errors, path, "expected boolean");
        }
        return;
    }
    if (value !== null) {
        pushError(errors, path, "expected null");
    }
}
function trimAndNormalizeText(raw) {
    if (typeof raw !== "string") {
        return "";
    }
    return raw.replace(/\u00a0/g, " ").trim();
}
async function extractWithBrowser(session, schema, scopeSelector) {
    const evaluate = session.evaluate ?? session.page?.evaluate;
    if (typeof evaluate !== "function") {
        throw new Error("Session does not support DOM-based extraction.");
    }
    return evaluate((input) => {
        const cleanText = (value) => {
            if (typeof value !== "string") {
                return "";
            }
            return value.replace(/\u00a0/g, " ").trim();
        };
        const resolveScope = (scope) => {
            if (!scope) {
                return document;
            }
            const root = document.querySelector(scope);
            if (!root) {
                return document;
            }
            return root;
        };
        const coercePrimitive = (source, schemaType) => {
            const normalized = cleanText(source);
            if (schemaType === "string") {
                return normalized;
            }
            if (schemaType === "boolean") {
                const value = normalized.toLowerCase();
                if (["true", "1", "yes", "on"].includes(value)) {
                    return true;
                }
                if (["false", "0", "no", "off"].includes(value)) {
                    return false;
                }
                return Boolean(normalized);
            }
            if (schemaType === "number" || schemaType === "integer") {
                const sanitized = normalized.replace(/[^0-9.-]/g, "");
                const parsed = Number.parseFloat(sanitized);
                if (!Number.isFinite(parsed)) {
                    return NaN;
                }
                if (schemaType === "integer") {
                    return Number.isInteger(parsed) ? parsed : NaN;
                }
                return parsed;
            }
            return null;
        };
        const findBySelector = (ctx, selector) => {
            if (!selector) {
                return [ctx];
            }
            if (!("querySelectorAll" in ctx)) {
                return [];
            }
            return Array.from(ctx.querySelectorAll(selector));
        };
        const readPrimitiveValue = (ctx, targetSchema) => {
            const selector = targetSchema.selector;
            const attr = targetSchema.attribute;
            const candidates = findBySelector(ctx, selector);
            if (!candidates[0] || !(candidates[0] instanceof Element)) {
                return undefined;
            }
            const element = candidates[0];
            if (attr) {
                const attributeValue = element.getAttribute(attr);
                if (attributeValue === null) {
                    return undefined;
                }
                const casted = coercePrimitive(attributeValue, targetSchema.type);
                return typeof casted === "number" && !Number.isFinite(casted)
                    ? undefined
                    : casted;
            }
            if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
                const casted = coercePrimitive(String(element.value ?? ""), targetSchema.type);
                return typeof casted === "number" && !Number.isFinite(casted)
                    ? undefined
                    : casted;
            }
            const casted = coercePrimitive(element.textContent ?? "", targetSchema.type);
            return typeof casted === "number" && !Number.isFinite(casted)
                ? undefined
                : casted;
        };
        const extract = (ctx, currentSchema) => {
            if (currentSchema.type === "object") {
                const base = currentSchema.selector ? findBySelector(ctx, currentSchema.selector)[0] : ctx;
                if (!base || !(base instanceof Element) && base !== document) {
                    return undefined;
                }
                const result = {};
                for (const [key, childSchema] of Object.entries(currentSchema.properties)) {
                    const childValue = extract(base, childSchema);
                    if (childValue !== undefined) {
                        result[key] = childValue;
                    }
                }
                return result;
            }
            if (currentSchema.type === "array") {
                if (!currentSchema.items) {
                    return [];
                }
                const nodes = currentSchema.selector ? findBySelector(ctx, currentSchema.selector) : [];
                if (nodes.length === 0) {
                    return [];
                }
                const extracted = [];
                for (const node of nodes) {
                    if (node instanceof Element) {
                        const value = extract(node, currentSchema.items);
                        extracted.push(value);
                    }
                }
                return extracted;
            }
            const value = readPrimitiveValue(ctx, currentSchema);
            return value;
        };
        const root = resolveScope(input.scopeSelector);
        return extract(root, input.schema);
    }, { schema, scopeSelector });
}
export function extractTool(client) {
    return {
        name: "steel_extract",
        label: "Extract",
        description: "Extract structured values from page content using a JSON Schema contract",
        parameters: Type.Object({
            schema: Type.Object({}, { additionalProperties: true, description: "JSON-Schema-like extraction contract." }),
            instructions: Type.Optional(Type.String({ description: "Optional extraction guidance used to disambiguate field selection." })),
            scopeSelector: Type.Optional(Type.String({ description: "Optional CSS selector that scopes extraction to a container." })),
            strict: Type.Optional(Type.Boolean({ description: "Reject properties not defined in schema (default true)." })),
        }),
        async execute(_toolCallId, params, signal, onUpdate, _ctx) {
            return withToolError("steel_extract", async () => {
                throwIfAborted(signal);
                const scopeSelector = normalizeString(params.scopeSelector, "scopeSelector") ?? null;
                const strict = params.strict ?? true;
                await emitProgress(onUpdate, "steel_extract", "Preparing structured extraction");
                const normalizedSchema = normalizeSchema(params.schema, "schema");
                const enforcedSchema = strict ? enforceStrictMode(normalizedSchema) : normalizedSchema;
                const prompt = buildPrompt(summarizeSchema(enforcedSchema, "result").join("\n"), params.instructions);
                const session = (await withAbortSignal(client.getOrCreateSession(), signal));
                throwIfAborted(signal);
                const url = await readSessionUrl(session);
                await emitProgress(onUpdate, "steel_extract", `Preparing prompt with ${prompt.split("\n").length} lines`);
                const extracted = await withAbortSignal(extractWithBrowser(session, enforcedSchema, scopeSelector), signal);
                const validationErrors = [];
                validateExtraction(extracted, enforcedSchema, "result", validationErrors);
                if (validationErrors.length > 0) {
                    throw new Error(`Extraction result does not match requested schema:\n${validationErrors
                        .map((error) => `- ${error}`)
                        .join("\n")}`);
                }
                await emitProgress(onUpdate, "steel_extract", "Extraction validated");
                return {
                    content: [{
                            type: "text",
                            text: JSON.stringify(extracted, null, 2),
                        }],
                    details: {
                        ...sessionDetails(session, url, scopeSelector),
                        schemaEnforced: strict,
                        prompt,
                    },
                };
            }, signal);
        },
    };
}
//# sourceMappingURL=extract.js.map