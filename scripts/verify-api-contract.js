#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const backendControllerDir = path.join(
  root,
  'travelmate-backend/src/main/java/com/travelmate/controller'
);
const backendDtoDir = path.join(root, 'travelmate-backend/src/main/java/com/travelmate/dto');
const frontendSrcDirs = [
  path.join(root, 'travelmate-web/src'),
  path.join(root, 'travelmate-mobile/src'),
];

function walk(dir, predicate, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, predicate, out);
    } else if (predicate(fullPath)) {
      out.push(fullPath);
    }
  }
  return out;
}

function cleanRoute(route) {
  const noQuery = String(route || '').split('?')[0];
  const compact = noQuery.replace(/\/+/g, '/').replace(/^\/+|\/+$/g, '');
  return compact ? `/${compact}` : '';
}

function combineRoute(base, route) {
  return cleanRoute(`${cleanRoute(base)}/${cleanRoute(route)}`);
}

function extractRequestMapping(annotationSource) {
  if (!annotationSource) return '';
  return annotationSource.match(/"([^"]*)"/)?.[1] || '';
}

function extractClassBase(controllerSource) {
  const classIndex = controllerSource.search(/\bpublic\s+class\b/);
  const classPrefix = classIndex === -1 ? controllerSource : controllerSource.slice(0, classIndex);
  const mappings = [...classPrefix.matchAll(/@RequestMapping(?:\(([^)]*)\))?/g)];
  return cleanRoute(extractRequestMapping(mappings.at(-1)?.[1] || ''));
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function routeToRegex(route, numericVariables = new Set()) {
  const parts = cleanRoute(route)
    .split('/')
    .map(part => {
      if (!part.startsWith('{') || !part.endsWith('}')) {
        return escapeRegex(part);
      }

      const variableName = part.slice(1, -1);
      return numericVariables.has(variableName) ? '(?:\\{value\\}|\\d+)' : '(?:\\{value\\}|[^/]+)';
    });
  return new RegExp(`^${parts.join('/')}(?:\\?.*)?$`);
}

function extractNumericPathVariables(methodSource) {
  const numericVariables = new Set();
  const pathVariablePattern =
    /@PathVariable(?:\(([^)]*)\))?\s+(?:final\s+)?(?:Long|long|Integer|int)\s+(\w+)/g;

  for (const match of methodSource.matchAll(pathVariablePattern)) {
    const annotationSource = match[1] || '';
    const parameterName = match[2];
    const explicitName = annotationSource.match(/"([^"]+)"/)?.[1];
    numericVariables.add(explicitName || parameterName);
  }

  return numericVariables;
}

function findMatching(source, openIndex, openChar, closeChar) {
  let depth = 0;
  let quote = null;
  let escaped = false;

  for (let index = openIndex; index < source.length; index++) {
    const char = source[index];

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }

    if (char === '"' || char === "'" || char === '`') {
      quote = char;
      continue;
    }

    if (char === openChar) depth++;
    if (char === closeChar) depth--;
    if (depth === 0) return index;
  }

  return -1;
}

function splitTopLevel(value) {
  const parts = [];
  let start = 0;
  let depth = 0;
  let quote = null;
  let escaped = false;

  for (let index = 0; index < value.length; index++) {
    const char = value[index];

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }

    if (char === '"' || char === "'" || char === '`') {
      quote = char;
      continue;
    }

    if (char === '{' || char === '[' || char === '(') depth++;
    if (char === '}' || char === ']' || char === ')') depth--;

    if (char === ',' && depth === 0) {
      parts.push(value.slice(start, index));
      start = index + 1;
    }
  }

  parts.push(value.slice(start));
  return parts;
}

function splitTypeMembers(value) {
  const parts = [];
  let start = 0;
  let depth = 0;
  let quote = null;
  let escaped = false;

  for (let index = 0; index < value.length; index++) {
    const char = value[index];

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }

    if (char === '"' || char === "'" || char === '`') {
      quote = char;
      continue;
    }

    if (char === '{' || char === '[' || char === '(' || char === '<') depth++;
    if (char === '}' || char === ']' || char === ')' || char === '>') depth--;

    if ((char === ';' || char === '\n') && depth === 0) {
      parts.push(value.slice(start, index));
      start = index + 1;
    }
  }

  parts.push(value.slice(start));
  return parts;
}

function extractObjectLiteralShape(source, openIndex) {
  if (source[openIndex] !== '{') return null;
  const closeIndex = findMatching(source, openIndex, '{', '}');
  if (closeIndex === -1) return null;

  const keys = new Set();
  let hasSpread = false;
  const body = source.slice(openIndex + 1, closeIndex);

  for (const part of splitTopLevel(body)) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith('...')) {
      hasSpread = true;
      continue;
    }

    const keyMatch =
      trimmed.match(/^([A-Za-z_$][\w$]*)\s*:/) ||
      trimmed.match(/^['"]([^'"]+)['"]\s*:/) ||
      trimmed.match(/^([A-Za-z_$][\w$]*)\s*$/);

    if (keyMatch) keys.add(keyMatch[1]);
  }

  return { keys, hasSpread };
}

function cloneShape(shape) {
  return shape ? { keys: new Set(shape.keys), hasSpread: Boolean(shape.hasSpread) } : null;
}

function serializeShape(shape) {
  return [...shape.keys].sort().join('|');
}

function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

function stripLeadingComments(source) {
  let value = source.trimStart();

  while (value.startsWith('//') || value.startsWith('/*')) {
    if (value.startsWith('//')) {
      const newlineIndex = value.indexOf('\n');
      value = newlineIndex === -1 ? '' : value.slice(newlineIndex + 1).trimStart();
      continue;
    }

    const closeIndex = value.indexOf('*/');
    value = closeIndex === -1 ? '' : value.slice(closeIndex + 2).trimStart();
  }

  return value;
}

function extractTypeBodyShape(typeBody) {
  const keys = new Set();
  const cleanBody = stripComments(typeBody);

  for (const member of splitTypeMembers(cleanBody)) {
    const trimmed = member.trim();
    if (!trimmed) continue;

    const propertyMatch =
      trimmed.match(/^(?:readonly\s+)?([A-Za-z_$][\w$]*)(\?)?\s*:/) ||
      trimmed.match(/^['"]([^'"]+)['"](\?)?\s*:/);

    if (propertyMatch && !propertyMatch[2]) {
      keys.add(propertyMatch[1]);
    }
  }

  return { keys, hasSpread: false };
}

function extractFrontendTypeShapes() {
  const entries = new Map();
  const addEntry = (name, shape) => {
    if (!entries.has(name)) entries.set(name, new Map());
    entries.get(name).set(serializeShape(shape), shape);
  };

  for (const srcDir of frontendSrcDirs) {
    if (!fs.existsSync(srcDir)) continue;

    for (const file of walk(srcDir, file => /\.(ts|tsx)$/.test(file) && !file.includes('.test.'))) {
      const source = fs.readFileSync(file, 'utf8');

      for (const match of source.matchAll(/\b(?:export\s+)?interface\s+([A-Za-z_$][\w$]*)[^{]*\{/g)) {
        const openIndex = source.indexOf('{', match.index);
        const closeIndex = openIndex === -1 ? -1 : findMatching(source, openIndex, '{', '}');
        if (closeIndex === -1) continue;
        addEntry(match[1], extractTypeBodyShape(source.slice(openIndex + 1, closeIndex)));
      }

      for (const match of source.matchAll(/\b(?:export\s+)?type\s+([A-Za-z_$][\w$]*)\s*=\s*\{/g)) {
        const openIndex = source.indexOf('{', match.index);
        const closeIndex = openIndex === -1 ? -1 : findMatching(source, openIndex, '{', '}');
        if (closeIndex === -1) continue;
        addEntry(match[1], extractTypeBodyShape(source.slice(openIndex + 1, closeIndex)));
      }
    }
  }

  const typeShapes = new Map();
  for (const [name, shapesBySignature] of entries.entries()) {
    if (shapesBySignature.size === 1) {
      typeShapes.set(name, [...shapesBySignature.values()][0]);
    }
  }

  return typeShapes;
}

function extractShapeFromTypeAnnotation(typeSource, typeShapes) {
  const typeNames = String(typeSource || '').match(/[A-Za-z_$][\w$]*/g) || [];
  for (const typeName of typeNames) {
    const shape = typeShapes.get(typeName);
    if (shape) return cloneShape(shape);
  }
  return null;
}

function extractIdentifierBodyShape(source, identifier, beforeIndex, typeShapes) {
  if (!/^[A-Za-z_$][\w$]*$/.test(identifier)) return null;

  const prefix = source.slice(0, beforeIndex);
  const declarationPattern = new RegExp(
    `\\b(?:const|let|var)\\s+${escapeRegex(identifier)}\\s*(?::\\s*([^=;\\n]+))?\\s*=\\s*\\{`,
    'g'
  );
  let declarationMatch = null;

  for (const match of prefix.matchAll(declarationPattern)) {
    declarationMatch = match;
  }

  if (declarationMatch) {
    const typeShape = extractShapeFromTypeAnnotation(declarationMatch[1], typeShapes);
    if (typeShape) return typeShape;

    const openIndex = prefix.indexOf('{', declarationMatch.index);
    if (openIndex !== -1) {
      return extractObjectLiteralShape(prefix, openIndex);
    }
  }

  const nearbySource = prefix.slice(Math.max(0, prefix.length - 2500));
  const parameterPattern = new RegExp(
    `\\b${escapeRegex(identifier)}\\s*:\\s*([A-Za-z_$][\\w$]*(?:\\s*<[^>]+>)?)`,
    'g'
  );
  let parameterMatch = null;

  for (const match of nearbySource.matchAll(parameterPattern)) {
    parameterMatch = match;
  }

  return parameterMatch
    ? extractShapeFromTypeAnnotation(parameterMatch[1], typeShapes)
    : null;
}

function extractFrontendPathConstants(source) {
  const constants = new Map();
  const patterns = [
    /\b(?:private|public|protected)?\s*(?:readonly\s+)?([A-Za-z_$][\w$]*)\s*=\s*([`'"])(\/[^`'"]*)\2/g,
    /\bconst\s+([A-Za-z_$][\w$]*)\s*=\s*([`'"])(\/[^`'"]*)\2/g,
  ];

  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      constants.set(match[1], match[3]);
    }
  }

  return constants;
}

function resolvePathConstantExpression(expression, pathConstants) {
  const constantName = String(expression || '').trim().replace(/^this\./, '');
  return pathConstants.get(constantName) || null;
}

function normalizeResolvedPath(rawPath) {
  return rawPath.replace(/\$\{([^}]+)\}/g, (match, expression, offset) => {
    const pathPrefix = rawPath.slice(0, offset);
    if (expression.includes('?') && !pathPrefix.includes('?')) {
      return '?{value}';
    }
    return '{value}';
  });
}

function resolveRawTemplatePath(rawPath, pathConstants) {
  if (rawPath.startsWith('/')) return normalizeResolvedPath(rawPath);

  const leadingExpression = rawPath.match(/^\$\{\s*([^}]+?)\s*\}/);
  if (!leadingExpression) return null;

  if (['API_BASE_URL', 'backendUrl'].includes(leadingExpression[1].trim())) {
    return normalizeResolvedPath(rawPath.slice(leadingExpression[0].length));
  }

  const basePath = resolvePathConstantExpression(leadingExpression[1], pathConstants);
  if (!basePath) return null;

  return normalizeResolvedPath(`${basePath}${rawPath.slice(leadingExpression[0].length)}`);
}

function splitTopLevelTernary(value) {
  let depth = 0;
  let quote = null;
  let escaped = false;
  let questionIndex = -1;

  for (let index = 0; index < value.length; index++) {
    const char = value[index];

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }

    if (char === '"' || char === "'" || char === '`') {
      quote = char;
      continue;
    }

    if (char === '{' || char === '[' || char === '(') depth++;
    if (char === '}' || char === ']' || char === ')') depth--;

    if (char === '?' && depth === 0 && questionIndex === -1) {
      questionIndex = index;
      continue;
    }

    if (char === ':' && depth === 0 && questionIndex !== -1) {
      return {
        consequent: value.slice(questionIndex + 1, index).trim(),
        alternate: value.slice(index + 1).trim(),
      };
    }
  }

  return null;
}

function extractIdentifierPaths(source, identifier, beforeIndex, pathConstants, seenIdentifiers = new Set()) {
  if (!/^[A-Za-z_$][\w$]*$/.test(identifier)) return null;
  if (seenIdentifiers.has(identifier)) return [];
  seenIdentifiers.add(identifier);

  const prefix = source.slice(Math.max(0, beforeIndex - 2500), beforeIndex);
  const declarationPattern = new RegExp(
    `\\bconst\\s+${escapeRegex(identifier)}\\s*=\\s*([^;\\n]+)`,
    'g'
  );
  let declarationMatch = null;

  for (const match of prefix.matchAll(declarationPattern)) {
    declarationMatch = match;
  }

  return declarationMatch
    ? resolveFrontendPathArguments(
        declarationMatch[1],
        source,
        beforeIndex,
        pathConstants,
        seenIdentifiers
      )
    : [];
}

function resolveFrontendPathArguments(
  argumentSource,
  source,
  beforeIndex,
  pathConstants,
  seenIdentifiers = new Set()
) {
  const trimmed = String(argumentSource || '').trim();
  if (!trimmed) return [];

  const ternary = splitTopLevelTernary(trimmed);
  if (ternary) {
    return [
      ...resolveFrontendPathArguments(
        ternary.consequent,
        source,
        beforeIndex,
        pathConstants,
        new Set(seenIdentifiers)
      ),
      ...resolveFrontendPathArguments(
        ternary.alternate,
        source,
        beforeIndex,
        pathConstants,
        new Set(seenIdentifiers)
      ),
    ];
  }

  const quote = trimmed[0];
  if (quote === '"' || quote === "'" || quote === '`') {
    if (trimmed.at(-1) !== quote) return [];
    const pathValue = resolveRawTemplatePath(trimmed.slice(1, -1), pathConstants);
    return pathValue ? [pathValue] : [];
  }

  const constantReference = trimmed.match(/^(?:this\.)?([A-Za-z_$][\w$]*)$/);
  if (constantReference) {
    const pathValue = resolvePathConstantExpression(trimmed, pathConstants);
    return pathValue
      ? [pathValue]
      : extractIdentifierPaths(
          source,
          constantReference[1],
          beforeIndex,
          pathConstants,
          seenIdentifiers
        );
  }

  return [];
}

function extractObjectPropertySource(objectSource, propertyName) {
  const trimmedObject = objectSource.trim();
  if (!trimmedObject.startsWith('{')) return null;

  const closeIndex = findMatching(trimmedObject, 0, '{', '}');
  if (closeIndex === -1) return null;

  const body = trimmedObject.slice(1, closeIndex);
  for (const part of splitTopLevel(body)) {
    const cleanPart = stripLeadingComments(part);
    const separatorIndex = cleanPart.indexOf(':');
    if (separatorIndex === -1) continue;

    const key = cleanPart.slice(0, separatorIndex).trim().replace(/^['"]|['"]$/g, '');
    if (key === propertyName) {
      return cleanPart.slice(separatorIndex + 1).trim();
    }
  }

  return null;
}

function extractOptionsMethod(optionsSource) {
  if (!optionsSource) return 'GET';

  const methodSource = extractObjectPropertySource(optionsSource, 'method');
  if (!methodSource) return 'GET';

  const match = methodSource.match(/^['"`](GET|POST|PUT|PATCH|DELETE)['"`]/i);
  return match ? match[1].toUpperCase() : 'FETCH';
}

function extractJsonStringifyBodyShape(optionsSource, source, beforeIndex, typeShapes) {
  if (!optionsSource) return null;

  const bodySource = extractObjectPropertySource(optionsSource, 'body');
  if (!bodySource) return null;

  const stringifyMatch = bodySource.match(/^JSON\.stringify\s*\(/);
  if (!stringifyMatch) return null;

  const stringifyOpenIndex = bodySource.indexOf('(', stringifyMatch.index);
  const stringifyCloseIndex = findMatching(bodySource, stringifyOpenIndex, '(', ')');
  if (stringifyCloseIndex === -1) return null;

  const stringifyArgs = splitTopLevel(bodySource.slice(stringifyOpenIndex + 1, stringifyCloseIndex));
  const firstArg = stringifyArgs[0]?.trim() || '';
  if (firstArg.startsWith('{')) return extractObjectLiteralShape(firstArg, 0);

  const identifierMatch = firstArg.match(/^([A-Za-z_$][\w$]*)$/);
  return identifierMatch
    ? extractIdentifierBodyShape(source, identifierMatch[1], beforeIndex, typeShapes)
    : null;
}

function hasFetchBody(optionsSource) {
  return Boolean(extractObjectPropertySource(optionsSource, 'body'));
}

function extractCallArguments(source, callIndex) {
  const openIndex = source.indexOf('(', callIndex);
  if (openIndex === -1) return [];

  const closeIndex = findMatching(source, openIndex, '(', ')');
  if (closeIndex === -1) return [];

  return splitTopLevel(source.slice(openIndex + 1, closeIndex));
}

function extractRequiredFields(classBody) {
  const requiredFields = new Set();
  let annotations = [];

  for (const rawLine of classBody.split(/\r?\n/)) {
    let line = rawLine.trim();
    if (!line) continue;

    while (line.startsWith('@')) {
      const annotationMatch = line.match(/^@[A-Za-z][\w.]*(?:\([^)]*\))?\s*/);
      if (!annotationMatch) break;
      annotations.push(annotationMatch[0]);
      line = line.slice(annotationMatch[0].length).trimStart();
    }

    if (!line) continue;

    const fieldMatch = line.match(/^private\s+(?:final\s+)?[\w.<>, ?]+\s+(\w+)\s*(?:=[^;]*)?;/);
    if (!fieldMatch) {
      annotations = [];
      continue;
    }

    const fieldName = fieldMatch[1];
    if (/@(?:NotNull|NotBlank|NotEmpty)\b/.test(annotations)) {
      requiredFields.add(fieldName);
    }
    annotations = [];
  }

  return requiredFields;
}

function buildRequestBodyFieldIndex() {
  const qualified = new Map();
  const simpleEntries = new Map();
  if (!fs.existsSync(backendDtoDir)) return { qualified, simple: new Map() };

  for (const file of walk(backendDtoDir, file => file.endsWith('.java'))) {
    const source = fs.readFileSync(file, 'utf8');
    const outerClass = source.match(/\bpublic\s+class\s+(\w+)/)?.[1];
    if (!outerClass) continue;

    for (const match of source.matchAll(/\bpublic\s+static\s+class\s+(\w+)/g)) {
      const innerClass = match[1];
      const openIndex = source.indexOf('{', match.index);
      const closeIndex = openIndex === -1 ? -1 : findMatching(source, openIndex, '{', '}');
      if (closeIndex === -1) continue;

      const requiredFields = extractRequiredFields(source.slice(openIndex + 1, closeIndex));
      if (requiredFields.size === 0) continue;

      const qualifiedName = `${outerClass}.${innerClass}`;
      qualified.set(qualifiedName, requiredFields);

      const entries = simpleEntries.get(innerClass) || [];
      entries.push(requiredFields);
      simpleEntries.set(innerClass, entries);
    }
  }

  const simple = new Map();
  for (const [name, entries] of simpleEntries.entries()) {
    if (entries.length === 1) simple.set(name, entries[0]);
  }

  return { qualified, simple };
}

function extractRequestBodyInfo(methodSource, requestBodyFields) {
  const match = methodSource.match(/@RequestBody(?:\(([^)]*)\))?\s+([\w.<>]+)\s+\w+/);
  if (!match || /\brequired\s*=\s*false\b/.test(match[1] || '')) {
    return { required: false, requiredFields: new Set() };
  }

  const rawType = match[2].replace(/<.*$/, '');
  const typeName = rawType.includes('.') ? rawType.split('.').slice(-2).join('.') : rawType;

  return {
    required: true,
    requiredFields:
      requestBodyFields.qualified.get(typeName) ||
      requestBodyFields.simple.get(typeName) ||
      new Set(),
  };
}

function extractBackendRoutes() {
  const requestBodyFields = buildRequestBodyFieldIndex();
  return walk(backendControllerDir, file => file.endsWith('.java')).flatMap(file => {
    const source = fs.readFileSync(file, 'utf8');
    const base = extractClassBase(source);

    const mappings = [...source.matchAll(/@(Get|Post|Put|Patch|Delete)Mapping(?:\(([^)]*)\))?/g)];

    return mappings.map((match, index) => {
      const methodSource = source.slice(match.index, mappings[index + 1]?.index || source.length);
      const requestBodyInfo = extractRequestBodyInfo(methodSource, requestBodyFields);

      return {
        method: match[1].toUpperCase(),
        path: combineRoute(base, extractRequestMapping(match[2] || '')),
        numericVariables: extractNumericPathVariables(methodSource),
        requiresBody: requestBodyInfo.required,
        requiredBodyFields: requestBodyInfo.requiredFields,
        file: path.relative(root, file),
      };
    });
  });
}

function extractFrontendCalls() {
  const calls = [];
  const frontendTypeShapes = extractFrontendTypeShapes();
  const apiClientCall = /apiClient\.(get|post|put|patch|delete)\s*(?:<[^()]+>)?\s*\(/g;
  const axiosCall = /axios\.(get|post|put|patch|delete)\s*(?:<[^()]+>)?\s*\(/g;
  const fetchCall = /fetch\s*\(\s*`\$\{(?:API_BASE_URL|backendUrl)\}([^`]*)`/g;

  for (const srcDir of frontendSrcDirs) {
    if (!fs.existsSync(srcDir)) continue;

    for (const file of walk(srcDir, file => /\.(ts|tsx)$/.test(file) && !file.includes('.test.'))) {
      const source = fs.readFileSync(file, 'utf8');
      const pathConstants = extractFrontendPathConstants(source);

      for (const match of source.matchAll(apiClientCall)) {
        const args = extractCallArguments(source, match.index);
        const rawPaths = [
          ...new Set(resolveFrontendPathArguments(args[0], source, match.index, pathConstants)),
        ].filter(rawPath => rawPath.startsWith('/'));
        if (rawPaths.length === 0) continue;

        const bodyArg = args[1]?.trim() || '';
        const hasBody = bodyArg !== '' && bodyArg !== 'undefined';
        const identifierArgMatch = bodyArg.match(/^([A-Za-z_$][\w$]*)\b/);
        let bodyShape = null;
        if (bodyArg.startsWith('{')) {
          bodyShape = extractObjectLiteralShape(bodyArg, 0);
        } else if (identifierArgMatch) {
          bodyShape = extractIdentifierBodyShape(
            source,
            identifierArgMatch[1],
            match.index,
            frontendTypeShapes
          );
        }

        for (const rawPath of rawPaths) {
          calls.push({
            method: match[1].toUpperCase(),
            path: rawPath,
            file: path.relative(root, file),
            hasBody,
            bodyShape,
            source: 'apiClient',
          });
        }
      }

      for (const match of source.matchAll(axiosCall)) {
        const args = extractCallArguments(source, match.index);
        const rawPaths = [
          ...new Set(resolveFrontendPathArguments(args[0], source, match.index, pathConstants)),
        ].filter(rawPath => rawPath.startsWith('/'));
        if (rawPaths.length === 0) continue;

        const bodyArg = args[1]?.trim() || '';
        const hasBody = bodyArg !== '' && bodyArg !== 'undefined';
        const identifierArgMatch = bodyArg.match(/^([A-Za-z_$][\w$]*)\b/);
        let bodyShape = null;
        if (bodyArg.startsWith('{')) {
          bodyShape = extractObjectLiteralShape(bodyArg, 0);
        } else if (identifierArgMatch) {
          bodyShape = extractIdentifierBodyShape(
            source,
            identifierArgMatch[1],
            match.index,
            frontendTypeShapes
          );
        }

        for (const rawPath of rawPaths) {
          calls.push({
            method: match[1].toUpperCase(),
            path: rawPath,
            file: path.relative(root, file),
            hasBody,
            bodyShape,
            source: 'axios',
          });
        }
      }

      for (const match of source.matchAll(fetchCall)) {
        const rawPath = match[1];
        if (!rawPath.startsWith('/')) continue;
        const args = extractCallArguments(source, match.index);
        const optionsSource = args[1]?.trim() || '';
        calls.push({
          method: extractOptionsMethod(optionsSource),
          path: rawPath.replace(/\$\{[^}]+\}/g, '{value}'),
          file: path.relative(root, file),
          hasBody: hasFetchBody(optionsSource),
          bodyShape: extractJsonStringifyBodyShape(
            optionsSource,
            source,
            match.index,
            frontendTypeShapes
          ),
          source: 'fetch',
        });
      }
    }
  }

  return calls;
}

function main() {
  const backendRoutes = extractBackendRoutes().map(route => ({
    ...route,
    regex: routeToRegex(route.path, route.numericVariables),
  }));
  const frontendCalls = extractFrontendCalls();

  const matchedCalls = [];
  const unmatched = frontendCalls.filter(call => {
    const allowedMethods =
      call.method === 'FETCH' ? ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] : [call.method];
    const matchedRoute = backendRoutes.find(
      route => allowedMethods.includes(route.method) && route.regex.test(call.path)
    );
    if (matchedRoute) matchedCalls.push({ call, route: matchedRoute });
    return !matchedRoute;
  });

  const missingBodies = matchedCalls
    .filter(({ call, route }) => route.requiresBody && !call.hasBody)
    .map(({ call, route }) => ({ call, route }));

  const bodyMismatches = matchedCalls
    .filter(({ call, route }) => {
      return (
        call.bodyShape &&
        !call.bodyShape.hasSpread &&
        route.requiredBodyFields &&
        route.requiredBodyFields.size > 0
      );
    })
    .map(({ call, route }) => {
      const missing = [...route.requiredBodyFields].filter(field => !call.bodyShape.keys.has(field));
      return { call, route, missing };
    })
    .filter(result => result.missing.length > 0);
  const checkedBodyCount = matchedCalls.filter(({ call, route }) => {
    return (
      call.bodyShape &&
      !call.bodyShape.hasSpread &&
      route.requiredBodyFields &&
      route.requiredBodyFields.size > 0
    );
  }).length;
  const checkedRequiredBodyCount = matchedCalls.filter(
    ({ route }) => route.requiresBody
  ).length;
  const checkedDirectMethodCount = frontendCalls.filter(
    call => ['fetch', 'axios'].includes(call.source) && call.method !== 'FETCH'
  ).length;

  if (unmatched.length > 0) {
    console.error(`API contract check failed: ${unmatched.length} unmatched client calls`);
    for (const call of unmatched) {
      console.error(`${call.method.padEnd(6)} ${call.path.padEnd(72)} ${call.file}`);
    }
    process.exit(1);
  }

  if (missingBodies.length > 0) {
    console.error(
      `API contract check failed: ${missingBodies.length} client calls missing required request body`
    );
    for (const { call, route } of missingBodies) {
      console.error(
        `${call.method.padEnd(6)} ${call.path.padEnd(72)} requires body (${route.file}) ${call.file}`
      );
    }
    process.exit(1);
  }

  if (bodyMismatches.length > 0) {
    console.error(
      `API contract check failed: ${bodyMismatches.length} client request bodies missing required fields`
    );
    for (const { call, route, missing } of bodyMismatches) {
      console.error(
        `${call.method.padEnd(6)} ${call.path.padEnd(72)} missing ${missing.join(', ')} (${route.file}) ${call.file}`
      );
    }
    process.exit(1);
  }

  console.log(
    `API contract check passed: ${frontendCalls.length} client calls matched ` +
      `${backendRoutes.length} backend routes; checked ${checkedDirectMethodCount} direct HTTP methods, ` +
      `${checkedRequiredBodyCount} required body presences, and ${checkedBodyCount} body shapes`
  );
}

main();
