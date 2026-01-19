import { Project, Node } from 'ts-morph';

/**
 * Information about a translation key usage in source code
 */
export interface TranslationUsage {
  key: string;
  filePath: string;
  line: number;
  column: number;
  context?: string;
}

/**
 * Find all translation key usages in the project
 */
export function findTranslationUsages(project: Project, sourceFiles: string[]): TranslationUsage[] {
  const usages: TranslationUsage[] = [];

  for (const filePath of sourceFiles) {
    const sourceFile = project.getSourceFile(filePath);
    if (!sourceFile) continue;

    sourceFile.forEachDescendant((node) => {
      // Pattern 1: Property access like m.key_name
      if (Node.isPropertyAccessExpression(node)) {
        const expression = node.getExpression();
        if (Node.isIdentifier(expression) && expression.getText() === 'm') {
          const key = node.getName();
          const { line, column } = sourceFile.getLineAndColumnAtPos(node.getStart());

          usages.push({
            key,
            filePath,
            line,
            column,
          });
        }
      }

      // Pattern 2: Function call like t('key_name')
      if (Node.isCallExpression(node)) {
        const expression = node.getExpression();
        if (Node.isIdentifier(expression) && expression.getText() === 't') {
          const args = node.getArguments();
          const firstArg = args[0];
          if (firstArg && Node.isStringLiteral(firstArg)) {
            const key = firstArg.getLiteralValue();
            const { line, column } = sourceFile.getLineAndColumnAtPos(node.getStart());

            usages.push({
              key,
              filePath,
              line,
              column,
            });
          }
        }
      }
    });
  }

  return usages;
}

/**
 * Get all unique translation keys used in the project
 */
export function getUsedTranslationKeys(project: Project, sourceFiles: string[]): Set<string> {
  const usages = findTranslationUsages(project, sourceFiles);
  return new Set(usages.map((u) => u.key));
}
