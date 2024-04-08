import * as assert from 'assert';
import * as vscode from 'vscode';
import { paramCase, pascalCase, constantCase, snakeCase, camelCase, capitalCase, pathCase } from "change-case";

import { exportedForTesting } from '../extension';
const { buildRegexQuery, messageToRegexQuery } = exportedForTesting;


suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('transformQuery2RegExp', () => {
		// Build a message for transformQuery2RegExp
		function m(text: string, selectedCases: string): any {
			const message: Record<string, any> = {
				text: text,
				kebabCase: false,
				camelCase: false,
				pascalCase: false,
				snakeCase: false,
				upperSnakeCase: false,
				capitalCase: false,
				pathCase: false,
			};
			type ObjectKey = keyof typeof message;
			for (const selectedCase of selectedCases.split(/,/)) {
				message[selectedCase as ObjectKey] = true;
			}
			return message;
		}

		const query1 = "one two_three-Four";
		const query2 = "oneTwoThreeFour";

		assert.strictEqual(messageToRegexQuery(m(query1, "kebabCase")),      "one-two-three-four");
		assert.strictEqual(messageToRegexQuery(m(query2, "kebabCase")),      "one-two-three-four");
		assert.strictEqual(messageToRegexQuery(m(query1, "camelCase")),      "oneTwoThreeFour");
		assert.strictEqual(messageToRegexQuery(m(query2, "camelCase")),      "oneTwoThreeFour");
		assert.strictEqual(messageToRegexQuery(m(query1, "pascalCase")),     "OneTwoThreeFour");
		assert.strictEqual(messageToRegexQuery(m(query2, "pascalCase")),     "OneTwoThreeFour");
		assert.strictEqual(messageToRegexQuery(m(query1, "snakeCase")),      "one_two_three_four");
		assert.strictEqual(messageToRegexQuery(m(query2, "snakeCase")),      "one_two_three_four");
		assert.strictEqual(messageToRegexQuery(m(query1, "upperSnakeCase")), "ONE_TWO_THREE_FOUR");
		assert.strictEqual(messageToRegexQuery(m(query2, "upperSnakeCase")), "ONE_TWO_THREE_FOUR");
		assert.strictEqual(messageToRegexQuery(m(query1, "capitalCase")),    "One Two Three Four");
		assert.strictEqual(messageToRegexQuery(m(query2, "capitalCase")),    "One Two Three Four");
		assert.strictEqual(messageToRegexQuery(m(query1, "pathCase")),       "one/two/three/four");
		assert.strictEqual(messageToRegexQuery(m(query2, "pathCase")),       "one/two/three/four");

		// Multiple functions selected
		assert.strictEqual(messageToRegexQuery(m(query1, "kebabCase,camelCase")),
							"one-two-three-four|oneTwoThreeFour");
		assert.strictEqual(messageToRegexQuery(m(query1, "pascalCase,upperSnakeCase,pathCase")),
							"OneTwoThreeFour|ONE_TWO_THREE_FOUR|one/two/three/four");

		// No fonction selected, so apply all
		assert.strictEqual(messageToRegexQuery(m(query1, "")),
							"one-two-three-four|oneTwoThreeFour|OneTwoThreeFour|one_two_three_four|ONE_TWO_THREE_FOUR|One Two Three Four|one/two/three/four");
	});

	test('buildRegexQuery', () => {
		const query = "one two_three-Four";

		assert.strictEqual(buildRegexQuery(query, []), "");

		assert.strictEqual(buildRegexQuery(query, [paramCase]),    "one-two-three-four");
		assert.strictEqual(buildRegexQuery(query, [camelCase]),    "oneTwoThreeFour");
		assert.strictEqual(buildRegexQuery(query, [pascalCase]),   "OneTwoThreeFour");
		assert.strictEqual(buildRegexQuery(query, [snakeCase]),    "one_two_three_four");
		assert.strictEqual(buildRegexQuery(query, [constantCase]), "ONE_TWO_THREE_FOUR");
		assert.strictEqual(buildRegexQuery(query, [capitalCase]),  "One Two Three Four");
		assert.strictEqual(buildRegexQuery(query, [pathCase]),     "one/two/three/four");

		assert.strictEqual(buildRegexQuery(query, [paramCase, camelCase]),
							"one-two-three-four|oneTwoThreeFour");

		assert.strictEqual(buildRegexQuery(query, [camelCase, capitalCase]),
							"oneTwoThreeFour|One Two Three Four");

		assert.strictEqual(buildRegexQuery(query, [pascalCase, snakeCase, constantCase]),
							"OneTwoThreeFour|one_two_three_four|ONE_TWO_THREE_FOUR");

		assert.strictEqual(buildRegexQuery(query, [pascalCase, snakeCase, constantCase, camelCase, paramCase]),
							"OneTwoThreeFour|one_two_three_four|ONE_TWO_THREE_FOUR|oneTwoThreeFour|one-two-three-four");

		// Duplicates are removed
		assert.strictEqual(buildRegexQuery(query, [pascalCase, constantCase, pascalCase]),
							"OneTwoThreeFour|ONE_TWO_THREE_FOUR");
	});
});
