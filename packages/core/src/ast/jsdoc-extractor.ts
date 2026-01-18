import { Project, Node, JSDoc } from 'ts-morph';
import { JSDocContext } from '../types.js';

/**
 * Extract JSDoc context from source code for a specific translation key
 */
export function extractJSDocContext(
  project: Project,
  sourceFiles: string[],
  translationKey: string
): JSDocContext | undefined {
  for (const filePath of sourceFiles) {
    const sourceFile = project.getSourceFile(filePath);
    if (!sourceFile) continue;

    // Find usages of the translation key
    const references = findTranslationKeyReferences(sourceFile, translationKey);

    for (const ref of references) {
      const jsDoc = findNearestJSDoc(ref);
      if (jsDoc) {
        return parseJSDocForContext(jsDoc);
      }
    }
  }

  return undefined;
}

/**
 * Find all references to a translation key in a source file
 */
function findTranslationKeyReferences(sourceFile: Node, key: string): Node[] {
  const references: Node[] = [];

  sourceFile.forEachDescendant((node) => {
    // Check for property access like m.key_name or t('key_name')
    if (Node.isPropertyAccessExpression(node)) {
      if (node.getName() === key) {
        references.push(node);
      }
    }

    // Check for string literals in function calls like t('key_name')
    if (Node.isStringLiteral(node)) {
      if (node.getLiteralValue() === key) {
        references.push(node);
      }
    }
  });

  return references;
}

/**
 * Find the nearest JSDoc comment for a node
 */
function findNearestJSDoc(node: Node): JSDoc | undefined {
  let current: Node | undefined = node;

  while (current) {
    // Check parent statement for JSDoc
    const parent = current.getParent();

    if (parent && Node.isVariableStatement(parent)) {
      const jsDocs = parent.getJsDocs();
      if (jsDocs.length > 0) {
        return jsDocs[0];
      }
    }

    if (parent && Node.isExpressionStatement(parent)) {
      const jsDocs = parent.getJsDocs();
      if (jsDocs.length > 0) {
        return jsDocs[0];
      }
    }

    current = parent;

    // Don't traverse too far up
    if (Node.isSourceFile(current)) break;
  }

  return undefined;
}

/**
 * Parse JSDoc tags into a context object
 */
function parseJSDocForContext(jsDoc: JSDoc): JSDocContext {
  const context: JSDocContext = {};

  // Get the main description
  const description = jsDoc.getDescription();
  if (description?.trim()) {
    context.description = description.trim();
  }

  // Parse tags
  for (const tag of jsDoc.getTags()) {
    const tagName = tag.getTagName();
    const text = tag.getCommentText()?.trim();

    switch (tagName) {
      case 'desc':
      case 'description':
        context.description = text;
        break;
      case 'example':
        context.example = text;
        break;
      case 'context':
        context.context = text;
        break;
      case 'maxLength':
        context.maxLength = text ? parseInt(text, 10) : undefined;
        break;
    }
  }

  return context;
}

/**
 * Create a ts-morph project for analysis
 */
export function createProject(tsConfigPath?: string): Project {
  if (tsConfigPath) {
    return new Project({ tsConfigFilePath: tsConfigPath });
  }

  return new Project({
    compilerOptions: {
      allowJs: true,
      jsx: 4, // JsxEmit.ReactJSX
    },
  });
}
