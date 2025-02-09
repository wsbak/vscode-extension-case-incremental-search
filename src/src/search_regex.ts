
/**
 * Construct a copy of an array with duplicate items removed.
 * Where duplicate items exist, only the first instance will be kept.
 */
function removeDuplicates<T>(array: T[]): T[] {
	return [...new Set(array)];
}

// build regex which exclude letter/number/separator before the beginning or after the end
function buildRegexExclude(separator: string, preceded: boolean): string {
	if (separator === ".") {
		separator = "\\.";
	}
	const precededStr = preceded === true ? "<" : "";
	// \d    = digit
	return `(?${precededStr}![a-zA-Z\\d${separator}])`;

	// \p{L} = any letter, not only ascii/latin
	// xxxCase manage only ascii characters : see test('xxxCase'
	// So using \p{L} seems strange/useless/contradictory
}

// build regex which exclude letter/number/separator before the beginning
function buildRegexExcludePreceded(separator: string): string {
	return buildRegexExclude(separator, true);
}

// build regex which exclude letter/number/separator after the end
function buildRegexExcludeFollowed(separator: string): string {
	return buildRegexExclude(separator, false);
}

// build regex query with all cases selected
export function buildRegexQuery(query: string, selectedCaseFunctions: readonly any[], message: any): string {
	const queries: string[] = [];
	for (const caseFunctionData of selectedCaseFunctions) {
		const caseFunction = caseFunctionData[0];
		let queryScope = caseFunction(query) || query;

		const separator: string = caseFunctionData[1];
		if (message.beginWord) {
			queryScope = buildRegexExcludePreceded(separator) + queryScope;
		}
		if (message.endWord) {
			queryScope = queryScope + buildRegexExcludeFollowed(separator);
		}

		queries.push(queryScope);
	}
  
	return removeDuplicates(queries).join("|");
}

// build regex query without any case selected
// also returns matchWholeWord for the vscode command workbench.action.findInFiles
export function buildRegexQueryNoCaseSelected(query: string, message: any): [string, boolean] {
	if (message.beginWord && message.endWord) {
		// Managed by matchWholeWord
		return [query, true];
	}

	if (message.beginWord) {
		query = "\\b" + query;
	}
	if (message.endWord) {
		query = query + "\\b";
	}

	return [query, false];
}
