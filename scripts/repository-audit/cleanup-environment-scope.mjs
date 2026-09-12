import ts from "typescript"

export const NON_ALIAS = "non-alias"
export const PROCESS_OBJECT = "process-object"
export const COMMONJS_LOADER = "commonjs-wrapper-loader"

/** Only source-level external import-equals emits a binding; namespace forms are unsupported by TS. */
export function isProcessImportEquals(node) {
  return ts.isImportEqualsDeclaration(node) && ts.isSourceFile(node.parent) && !node.isTypeOnly &&
    ts.isExternalModuleReference(node.moduleReference) &&
    node.moduleReference.expression && ts.isStringLiteral(node.moduleReference.expression) &&
    ["process", "node:process"].includes(node.moduleReference.expression.text)
}

/** Classify exact Node environment/process imports and imports that shadow the implicit global. */
export function processImportBindings(sourceFile) {
  const bindings = new Map()
  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) continue
    const clause = statement.importClause
    if (!clause) continue
    const exactModule = ["node:process", "process"].includes(statement.moduleSpecifier.text)
    const exactRuntimeModule = exactModule && !clause.isTypeOnly
    if (clause.name && (exactRuntimeModule || ["process", "require"].includes(clause.name.text) || isEnvironmentAliasName(clause.name.text))) {
      const status = !clause.isTypeOnly && isEnvironmentAliasName(clause.name.text) ? "unknown" : NON_ALIAS
      bindings.set(clause.name.text, exactRuntimeModule ? PROCESS_OBJECT : status)
    }
    const named = clause.namedBindings
    if (named && ts.isNamespaceImport(named) && (
      exactRuntimeModule || ["process", "require"].includes(named.name.text) || isEnvironmentAliasName(named.name.text)
    )) {
      const status = !clause.isTypeOnly && isEnvironmentAliasName(named.name.text) ? "unknown" : NON_ALIAS
      bindings.set(named.name.text, exactRuntimeModule ? PROCESS_OBJECT : status)
    } else if (named && ts.isNamedImports(named)) {
      for (const specifier of named.elements) {
        const imported = specifier.propertyName ?? specifier.name
        if (exactRuntimeModule && !specifier.isTypeOnly && ["default", "env"].includes(imported.text)) {
          bindings.set(specifier.name.text, imported.text === "env" ? "proven" : PROCESS_OBJECT)
        } else if (["process", "require"].includes(specifier.name.text) || isEnvironmentAliasName(specifier.name.text)) {
          const isRuntimeAlias = !clause.isTypeOnly && !specifier.isTypeOnly && isEnvironmentAliasName(specifier.name.text)
          bindings.set(specifier.name.text, isRuntimeAlias ? "unknown" : NON_ALIAS)
        }
      }
    }
  }
  return bindings
}

export function childScope(parent, ownsVarBindings = false, strict = parent?.strict ?? false) {
  return { bindings: new Map(), enumMembers: new Map(), ownsVarBindings, parent, strict }
}

/** Only exact directive-prologue literals enable strict mode; escaped lookalikes do not. */
export function hasStrictDirective(node) {
  if (node && ts.isSourceFile(node) && ts.isExternalModule(node)) return true
  for (const statement of node?.statements ?? []) {
    if (!ts.isExpressionStatement(statement) || !ts.isStringLiteral(statement.expression)) break
    if (["'use strict'", "\"use strict\""].includes(statement.expression.getText())) return true
  }
  return false
}

export function varBindingScope(scope) {
  let owner = scope
  while (owner.parent && !owner.ownsVarBindings) owner = owner.parent
  return owner
}

export function lookupAlias(scope, name) {
  for (let current = scope; current; current = current.parent) {
    if (current.bindings.has(name)) return current.bindings.get(name)
  }
  return null
}

/** Type-only wrappers preserve the runtime value used for provenance and escape analysis. */
export function isTransparentExpression(node) {
  return (
    ts.isParenthesizedExpression(node) || ts.isAsExpression(node) ||
    ts.isTypeAssertionExpression(node) || ts.isNonNullExpression(node) || ts.isSatisfiesExpression(node)
  )
}

export function unwrapTransparentExpression(node) {
  let value = node
  while (value && isTransparentExpression(value)) value = value.expression
  return value
}

function isProcessRequireCall(node, scope) {
  const value = unwrapTransparentExpression(node)
  return Boolean(value && ts.isCallExpression(value) && !value.questionDotToken && ts.isIdentifier(value.expression) &&
    value.expression.text === "require" && [null, COMMONJS_LOADER].includes(lookupAlias(scope, "require")) &&
    value.arguments.length === 1 && ts.isStringLiteral(value.arguments[0]) &&
    ["process", "node:process"].includes(value.arguments[0].text))
}

/** Recognize an implicit global or lexical binding already proven to be the Node process object. */
export function isProcessObjectAlias(node, scope) {
  const value = unwrapTransparentExpression(node)
  return Boolean(value && ts.isIdentifier(value) && (
    lookupAlias(scope, value.text) === PROCESS_OBJECT || value.text === "process" && lookupAlias(scope, value.text) === null
  ))
}

/** Recognize an exact require call or a binding already proven to be the Node process object. */
export function isProcessObjectSource(node, scope) {
  return isProcessRequireCall(node, scope) || isProcessObjectAlias(node, scope)
}

/** Recognize exact dot/bracket selection of env from a proven, non-optional process object. */
export function isProcessEnvironment(node, scope) {
  const value = unwrapTransparentExpression(node)
  if (!value || value.questionDotToken || !isProcessObjectAlias(value.expression, scope)) return false
  return (
    ts.isPropertyAccessExpression(value) && value.name.text === "env" ||
    ts.isElementAccessExpression(value) && value.argumentExpression &&
      (ts.isStringLiteral(value.argumentExpression) || ts.isNoSubstitutionTemplateLiteral(value.argumentExpression)) &&
      value.argumentExpression.text === "env"
  )
}

export function isEnvironmentAliasName(name) {
  return /^(?:env|environment)$/i.test(name)
}

/** Find sloppy block functions whose var-style binding is not blocked by intervening lexical names. */
export function annexBFunctionDeclarations(container) {
  const declarations = []
  const lexicalFunction = (node) => ts.isFunctionDeclaration(node) &&
    (node.asteriskToken || node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.AsyncKeyword))
  const addNames = (pattern, names) => {
    if (ts.isIdentifier(pattern)) names.add(pattern.text)
    else if (ts.isObjectBindingPattern(pattern) || ts.isArrayBindingPattern(pattern)) {
      for (const element of pattern.elements) if (ts.isBindingElement(element)) addNames(element.name, names)
    }
  }
  const scan = (node, barriers) => {
    if (ts.isFunctionDeclaration(node)) {
      if (node.parent !== container && node.name && !lexicalFunction(node) && !barriers.has(node.name.text)) declarations.push(node)
      return
    }
    if (node !== container && (ts.isFunctionLike(node) || ts.isClassDeclaration(node) ||
      ts.isClassExpression(node) || ts.isClassStaticBlockDeclaration(node) || ts.isModuleBlock(node))) return
    const local = new Set(barriers)
    const statements = ts.isBlock(node) || ts.isSourceFile(node) || ts.isModuleBlock(node)
      ? node.statements : ts.isCaseBlock(node) ? node.clauses.flatMap((clause) => clause.statements) : []
    for (const statement of statements) {
      if (ts.isVariableStatement(statement) && statement.declarationList.flags & ts.NodeFlags.BlockScoped) {
        for (const declaration of statement.declarationList.declarations) addNames(declaration.name, local)
      } else if ((ts.isClassDeclaration(statement) || ts.isEnumDeclaration(statement) || lexicalFunction(statement)) && statement.name) {
        addNames(statement.name, local)
      }
    }
    if ((ts.isForStatement(node) || ts.isForInStatement(node) || ts.isForOfStatement(node)) &&
      node.initializer && ts.isVariableDeclarationList(node.initializer) && node.initializer.flags & ts.NodeFlags.BlockScoped) {
      for (const declaration of node.initializer.declarations) addNames(declaration.name, local)
    }
    // Annex B permits the simple catch-parameter collision, but not destructured catch bindings.
    if (ts.isCatchClause(node) && node.variableDeclaration && !ts.isIdentifier(node.variableDeclaration.name)) {
      addNames(node.variableDeclaration.name, local)
    }
    ts.forEachChild(node, (child) => scan(child, local))
  }
  scan(container, new Set())
  return declarations
}
