import * as assert from 'assert';
import * as vscode from 'vscode';
import { paramCase, pascalCase, constantCase, snakeCase, camelCase, capitalCase, pathCase } from "change-case";

import { exportedForTesting } from '../extension';
const { paramCaseData, pascalCaseData, constantCaseData, snakeCaseData, camelCaseData, capitalCaseData, pathCaseData } = exportedForTesting;
const { buildRegexQuery, buildRegexQueryNoCaseSelected, messageToRegexQuery } = exportedForTesting;


// Build a message for transformQuery2RegExp & buildRegexQuery
// booleanNames specifies the "field1,field2,...,fieldn" to set to true
function msg(query: string = "", booleanNames: string = ""): any {
	const message: Record<string, any> = {
		// for buildRegexQuery... (and so for transformQuery2RegExp) 
		beginWord: false,
		endWord: false,
		// only for transformQuery2RegExp
		text: query,
		kebabCase: false,
		camelCase: false,
		pascalCase: false,
		snakeCase: false,
		upperSnakeCase: false,
		capitalCase: false,
		pathCase: false,
	};
	type ObjectKey = keyof typeof message;
	for (const booleanName of booleanNames.split(/[, ]/)) {
		message[booleanName as ObjectKey] = true;
	}
	return message;
}

// Alias
function msgBeginWord(query: string = ""): any { return msg(query, "beginWord"); }
function msgEndWord(  query: string = ""): any { return msg(query, "endWord"); }
function msgWholeWord(query: string = ""): any { return msg(query, "beginWord,endWord"); }
function msgCaseBeginWord(query: string = "", bns: string = ""): any { return msg(query, "beginWord,"+bns); }
function msgCaseEndWord(  query: string = "", bns: string = ""): any { return msg(query, "endWord,"+bns); }
function msgCaseWholeWord(query: string = "", bns: string = ""): any { return msg(query, "beginWord,endWord,"+bns); }

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('buildRegexQuery', () => {
		const query = "one two_three-Four";

		assert.strictEqual(buildRegexQuery(query, [], msg()), "");

		assert.strictEqual(buildRegexQuery(query, [paramCaseData],    msg()), "one-two-three-four");
		assert.strictEqual(buildRegexQuery(query, [camelCaseData],    msg()), "oneTwoThreeFour");
		assert.strictEqual(buildRegexQuery(query, [pascalCaseData],   msg()), "OneTwoThreeFour");
		assert.strictEqual(buildRegexQuery(query, [snakeCaseData],    msg()), "one_two_three_four");
		assert.strictEqual(buildRegexQuery(query, [constantCaseData], msg()), "ONE_TWO_THREE_FOUR");
		assert.strictEqual(buildRegexQuery(query, [capitalCaseData],  msg()), "One Two Three Four");
		assert.strictEqual(buildRegexQuery(query, [pathCaseData],     msg()), "one/two/three/four");

		assert.strictEqual(buildRegexQuery(query, [paramCaseData, camelCaseData], msg()),
							"one-two-three-four|oneTwoThreeFour");

		assert.strictEqual(buildRegexQuery(query, [camelCaseData, capitalCaseData], msg()),
							"oneTwoThreeFour|One Two Three Four");

		assert.strictEqual(buildRegexQuery(query, [pascalCaseData, snakeCaseData, constantCaseData], msg()),
							"OneTwoThreeFour|one_two_three_four|ONE_TWO_THREE_FOUR");

		assert.strictEqual(buildRegexQuery(query, [pascalCaseData, snakeCaseData, constantCaseData, camelCaseData, paramCaseData], msg()),
							"OneTwoThreeFour|one_two_three_four|ONE_TWO_THREE_FOUR|oneTwoThreeFour|one-two-three-four");

		// Duplicates are removed
		assert.strictEqual(buildRegexQuery(query, [pascalCaseData, constantCaseData, pascalCaseData], msg()),
							"OneTwoThreeFour|ONE_TWO_THREE_FOUR");
	});

	test('buildRegexQueryNoCaseSelected', () => {
		const query = "one two_three-Four";
		assert.deepStrictEqual(buildRegexQueryNoCaseSelected(query, msg()),          [        query,         false]);
		assert.deepStrictEqual(buildRegexQueryNoCaseSelected(query, msgBeginWord()), ["\\b" + query,         false]);
		assert.deepStrictEqual(buildRegexQueryNoCaseSelected(query, msgEndWord()),   [        query + "\\b", false]);
		// beginWord + endWord = wholeWord which is managed by vscode
		// So no transformation and regex query = query
		assert.deepStrictEqual(buildRegexQueryNoCaseSelected(query, msgWholeWord()), [        query,         true]);
	});

	test('transformQuery2RegExp', () => {
		const query1 = "one two_three-Four";
		const query2 = "oneTwoThreeFour";

		assert.deepStrictEqual(messageToRegexQuery(msg(query1, "kebabCase")),      ["one-two-three-four", false]);
		assert.deepStrictEqual(messageToRegexQuery(msg(query2, "kebabCase")),      ["one-two-three-four", false]);
		assert.deepStrictEqual(messageToRegexQuery(msg(query1, "camelCase")),      ["oneTwoThreeFour",    false]);
		assert.deepStrictEqual(messageToRegexQuery(msg(query2, "camelCase")),      ["oneTwoThreeFour",    false]);
		assert.deepStrictEqual(messageToRegexQuery(msg(query1, "pascalCase")),     ["OneTwoThreeFour",    false]);
		assert.deepStrictEqual(messageToRegexQuery(msg(query2, "pascalCase")),     ["OneTwoThreeFour",    false]);
		assert.deepStrictEqual(messageToRegexQuery(msg(query1, "snakeCase")),      ["one_two_three_four", false]);
		assert.deepStrictEqual(messageToRegexQuery(msg(query2, "snakeCase")),      ["one_two_three_four", false]);
		assert.deepStrictEqual(messageToRegexQuery(msg(query1, "upperSnakeCase")), ["ONE_TWO_THREE_FOUR", false]);
		assert.deepStrictEqual(messageToRegexQuery(msg(query2, "upperSnakeCase")), ["ONE_TWO_THREE_FOUR", false]);
		assert.deepStrictEqual(messageToRegexQuery(msg(query1, "capitalCase")),    ["One Two Three Four", false]);
		assert.deepStrictEqual(messageToRegexQuery(msg(query2, "capitalCase")),    ["One Two Three Four", false]);
		assert.deepStrictEqual(messageToRegexQuery(msg(query1, "pathCase")),       ["one/two/three/four", false]);
		assert.deepStrictEqual(messageToRegexQuery(msg(query2, "pathCase")),       ["one/two/three/four", false]);

		// Multiple functions selected
		assert.deepStrictEqual(messageToRegexQuery(msg(query1, "kebabCase,camelCase")),
		                       ["one-two-three-four|oneTwoThreeFour", false]);
		assert.deepStrictEqual(messageToRegexQuery(msg(query1, "pascalCase,upperSnakeCase,pathCase")),
		 					   ["OneTwoThreeFour|ONE_TWO_THREE_FOUR|one/two/three/four", false]);

		// No fonction/case selected, so no transformation
		assert.deepStrictEqual(messageToRegexQuery(msg(query1, "")), [query1, false]);
	});

	// Regex options
	// - g = global, returns all results (not only the 1st one)
	// - u = unicode, mandatory for use \p{L}
	// - i = case insensitive

	test('regex_match', () => {
		assert.deepStrictEqual("Hello".match(/hello/gu),  null);
		assert.deepStrictEqual("hello".match(/hello/gu),  ["hello"]);
		assert.deepStrictEqual("Hello".match(/hello/gui), ["Hello"]);
		assert.deepStrictEqual("HELLO".match(/hello/gui), ["HELLO"]);

		assert.deepStrictEqual("Hello_World".match(/hello/gu),  null);
		assert.deepStrictEqual("hello_world".match(/hello/gu),  ["hello"]);
		assert.deepStrictEqual("Hello_World".match(/hello/gui), ["Hello"]);
		assert.deepStrictEqual("HELLO_WORLD".match(/hello/gui), ["HELLO"]);

		assert.deepStrictEqual("Hello_World".match(/hello_world/gu),  null);
		assert.deepStrictEqual("hello_world".match(/hello_world/gu),  ["hello_world"]);
		assert.deepStrictEqual("Hello_World".match(/hello_world/gui), ["Hello_World"]);
		assert.deepStrictEqual("HELLO_WORLD".match(/hello_world/gui), ["HELLO_WORLD"]);

		// Digit
		assert.deepStrictEqual("Hell0_World".match(/hell0_world/gu),  null);
		assert.deepStrictEqual("hell0_world".match(/hell0_world/gu),  ["hell0_world"]);
		assert.deepStrictEqual("Hell0_World".match(/hell0_world/gui), ["Hell0_World"]);
		assert.deepStrictEqual("HELL0_WORLD".match(/hell0_world/gui), ["HELL0_WORLD"]);

		// Accent
		assert.deepStrictEqual("Héllo_World".match(/héllo_world/gu),  null);
		assert.deepStrictEqual("héllo_world".match(/héllo_world/gu),  ["héllo_world"]);
		assert.deepStrictEqual("Héllo_World".match(/héllo_world/gui), ["Héllo_World"]);
		assert.deepStrictEqual("HÉLLO_WORLD".match(/héllo_world/gui), ["HÉLLO_WORLD"]);

		// Digit & Accent
		assert.deepStrictEqual("Héll0_World".match(/héll0_world/gu),  null);
		assert.deepStrictEqual("héll0_world".match(/héll0_world/gu),  ["héll0_world"]);
		assert.deepStrictEqual("Héll0_World".match(/héll0_world/gui), ["Héll0_World"]);
		assert.deepStrictEqual("HÉLL0_WORLD".match(/héll0_world/gui), ["HÉLL0_WORLD"]);
		
		const text1 = `
		first_hello_world_last
		first_hello_world_last
		first_hello_world_last
		`;
		assert.deepStrictEqual(text1.match(/hello_world/gu),  ["hello_world", "hello_world", "hello_world"]);

		const text2 = `
		first_hello_world_last
		First_Hello_World_Last
		FIRST_HELLO_WORLD_LAST
		`;
		assert.deepStrictEqual(text2.match(/hello_world/gu),  ["hello_world"]);
		assert.deepStrictEqual(text2.match(/hello_world/gui), ["hello_world", "Hello_World", "HELLO_WORLD"]);
	});

	test('xxxCase', () => {
		// Accent is not an [:alnum:]
		// Functions from change-case consider it like a separator
		console.log('paramCase("héll0-world")   ', paramCase("héll0-world"));     // h-ll0-world
		console.log('camelCase("héll0World")    ', camelCase("héll0World"));      // hLl0World
		console.log('pascalCase("Héll0World")   ', pascalCase("Héll0World"));     // HLl0World
		console.log('snakeCase("héll0_world")   ', snakeCase("héll0_world"));     // h_ll0_world
		console.log('constantCase("HÉLL0_WORLD")', constantCase("HÉLL0_WORLD"));  // H_LL0_WORLD
		console.log('capitalCase("Héll0 World") ', capitalCase("Héll0 World"));   // H Ll0 World
		console.log('pathCase("héll0/world")    ', pathCase("héll0:world"));      // h/ll0/world
	});

	test('messageToRegexQuery_match', () => {
		const text = `
		first.hello.world.last
		first-hello-world-last
		firstHelloWorldLast
		first_hello_world_last
		first_hell0_world_last
		first_héllo_world_last
		first hello world last
		first/hello/world/last
		`;

		// Match using messageToRegexQuery
		function match(query: string, selectedCases: string, text: string): any {
			const message: Record<string, any> = msg(query, selectedCases);
			const regex = new RegExp(messageToRegexQuery(message)[0], "gui");
			return text.match(regex);
		}

		assert.deepStrictEqual(match("F1rst-Hello-Wo", "kebabCase",      text), null);
		assert.deepStrictEqual(match("First-Hello-W0", "kebabCase",      text), null);
		assert.deepStrictEqual(match("First-Hello-Wo", "kebabCase",      text), ["first-hello-wo"]);
		assert.deepStrictEqual(match("First-Hello-Wo", "camelCase",      text), ["firstHelloWo"]);
		assert.deepStrictEqual(match("First-Hello-Wo", "pascalCase",     text), ["firstHelloWo"]);
		assert.deepStrictEqual(match("First-Hello-Wo", "snakeCase",      text), ["first_hello_wo"]);
		assert.deepStrictEqual(match("First-Hello-Wo", "upperSnakeCase", text), ["first_hello_wo"]);
		assert.deepStrictEqual(match("First-Hello-Wo", "capitalCase",    text), ["first hello wo"]);
		assert.deepStrictEqual(match("First-Hello-Wo", "pathCase",       text), ["first/hello/wo"]);

		// Digit
		assert.deepStrictEqual(match("First-Hell0-Wo", "snakeCase",      text), ["first_hell0_wo"]);

		// Accent
		// KO : see test('xxxCase'
		// assert.deepStrictEqual(match("First-Héllo-Wo", "snakeCase",      text), ["first_héllo_wo"]);
	});

	test('messageToRegexQuery_case_begin_end_whole', () => {
		const text = `
		first.hello.world.last
		First.Hello.World.Last
		FIRST.HELLO.WORLD.LAST
		
		first-hello-world-last
		First-Hello-World-Last
		FIRST-HELLO-WORLD-LAST
		
		helloWorldLast
		firstHelloWorldLast
		FirstHelloWorldLast
		FIRSTHELLOWORLDLAST
		
		first_hello_world_last
		First_Hello_World_Last
		FIRST_HELLO_WORLD_LAST

		first_hell0_world_last
		First_Hell0_World_Last
		FIRST_HELL0_WORLD_LAST

		first_héllo_world_last
		First_Héllo_World_Last
		FIRST_HÉLLO_WORLD_LAST

		first hello world last
		First Hello World Last
		FIRST HELLO WORLD LAST
		
		first/hello/world/last
		First/Hello/World/Last
		FIRST/HELLO/WORLD/LAST
		`;

		// Match with caseBeginWord using messageToRegexQuery
		function matchBegin(query: string, selectedCases: string, text: string): any {
			const regex = new RegExp(messageToRegexQuery(msgCaseBeginWord(query, selectedCases))[0], "gui");
			return text.match(regex);
		}

		assert.deepStrictEqual(matchBegin( "irst-Hello-Wo", "kebabCase",      text), null);
		assert.deepStrictEqual(matchBegin(      "Hello-Wo", "kebabCase",      text), null);
		assert.deepStrictEqual(matchBegin("First-Hello-Wo", "kebabCase",      text), ["first-hello-wo", "First-Hello-Wo", "FIRST-HELLO-WO"]);
		assert.deepStrictEqual(matchBegin("First-Hello-Wo", "camelCase",      text), ["firstHelloWo",   "FirstHelloWo",   "FIRSTHELLOWO"]);
		assert.deepStrictEqual(matchBegin("First-Hello-Wo", "pascalCase",     text), ["firstHelloWo",   "FirstHelloWo",   "FIRSTHELLOWO"]);
		assert.deepStrictEqual(matchBegin("First-Hello-Wo", "snakeCase",      text), ["first_hello_wo", "First_Hello_Wo", "FIRST_HELLO_WO"]);
		assert.deepStrictEqual(matchBegin("First-Hello-Wo", "upperSnakeCase", text), ["first_hello_wo", "First_Hello_Wo", "FIRST_HELLO_WO"]);
		assert.deepStrictEqual(matchBegin("First-Hello-Wo", "capitalCase",    text), ["first hello wo", "First Hello Wo", "FIRST HELLO WO"]);
		assert.deepStrictEqual(matchBegin("First-Hello-Wo", "pathCase",       text), ["first/hello/wo", "First/Hello/Wo", "FIRST/HELLO/WO"]);

		// Match with caseEndWord using messageToRegexQuery
		function matchEnd(query: string, selectedCases: string, text: string): any {
			const regex = new RegExp(messageToRegexQuery(msgCaseEndWord(query, selectedCases))[0], "gui");
			return text.match(regex);
		}

		assert.deepStrictEqual(matchEnd("ello_World_Las",  "kebabCase",      text), null);
		assert.deepStrictEqual(matchEnd("ello_World",      "kebabCase",      text), null);
		assert.deepStrictEqual(matchEnd("ello_World_Last", "kebabCase",      text), ["ello-world-last", "ello-World-Last", "ELLO-WORLD-LAST"]);
		assert.deepStrictEqual(matchEnd("ello_World_Last", "camelCase",      text), ["elloWorldLast", "elloWorldLast", "elloWorldLast", "ELLOWORLDLAST"]);
		assert.deepStrictEqual(matchEnd("ello_World_Last", "pascalCase",     text), ["elloWorldLast", "elloWorldLast", "elloWorldLast", "ELLOWORLDLAST"]);
		assert.deepStrictEqual(matchEnd("ello_World_Last", "snakeCase",      text), ["ello_world_last", "ello_World_Last", "ELLO_WORLD_LAST"]);
		assert.deepStrictEqual(matchEnd("ello_World_Last", "upperSnakeCase", text), ["ello_world_last", "ello_World_Last", "ELLO_WORLD_LAST"]);
		assert.deepStrictEqual(matchEnd("ello_World_Last", "capitalCase",    text), ["ello world last", "ello World Last", "ELLO WORLD LAST"]);
		assert.deepStrictEqual(matchEnd("ello_World_Last", "pathCase",       text), ["ello/world/last", "ello/World/Last", "ELLO/WORLD/LAST"]);

		// Match with caseBeginWord & caseEndWord using messageToRegexQuery
		function matchWhole(query: string, selectedCases: string, text: string): any {
			const regex = new RegExp(messageToRegexQuery(msgCaseWholeWord(query, selectedCases))[0], "gui");
			return text.match(regex);
		}

		assert.deepStrictEqual(matchWhole( "irst/Hello/World/Last", "kebabCase",      text), null);
		assert.deepStrictEqual(matchWhole(      "Hello/World/Last", "kebabCase",      text), null);
		assert.deepStrictEqual(matchWhole("First/Hello/World/Las",  "kebabCase",      text), null);
		assert.deepStrictEqual(matchWhole("First/Hello/World",      "kebabCase",      text), null);
		assert.deepStrictEqual(matchWhole("First/Hello/World/Last", "kebabCase",      text), ["first-hello-world-last", "First-Hello-World-Last", "FIRST-HELLO-WORLD-LAST"]);
		assert.deepStrictEqual(matchWhole("First/Hello/World/Last", "camelCase",      text), ["firstHelloWorldLast",    "FirstHelloWorldLast",    "FIRSTHELLOWORLDLAST"]);
		assert.deepStrictEqual(matchWhole("First/Hello/World/Last", "pascalCase",     text), ["firstHelloWorldLast",    "FirstHelloWorldLast",    "FIRSTHELLOWORLDLAST"]);
		assert.deepStrictEqual(matchWhole("First/Hello/World/Last", "snakeCase",      text), ["first_hello_world_last", "First_Hello_World_Last", "FIRST_HELLO_WORLD_LAST"]);
		assert.deepStrictEqual(matchWhole("First/Hello/World/Last", "upperSnakeCase", text), ["first_hello_world_last", "First_Hello_World_Last", "FIRST_HELLO_WORLD_LAST"]);
		assert.deepStrictEqual(matchWhole("First/Hello/World/Last", "capitalCase",    text), ["first hello world last", "First Hello World Last", "FIRST HELLO WORLD LAST"]);
		assert.deepStrictEqual(matchWhole("First/Hello/World/Last", "pathCase",       text), ["first/hello/world/last", "First/Hello/World/Last", "FIRST/HELLO/WORLD/LAST"]);

		// Digit
		assert.deepStrictEqual(matchBegin("First-Hell0-Wo",         "snakeCase",      text), ["first_hell0_wo",         "First_Hell0_Wo",         "FIRST_HELL0_WO"]);
		assert.deepStrictEqual(matchEnd(          "ll0_World_Last", "snakeCase",      text), [        "ll0_world_last",         "ll0_World_Last",         "LL0_WORLD_LAST"]);
		assert.deepStrictEqual(matchWhole("First/Hell0/World/Last", "snakeCase",      text), ["first_hell0_world_last", "First_Hell0_World_Last", "FIRST_HELL0_WORLD_LAST"]);

		// Accent
		// KO : see test('xxxCase'
		// assert.deepStrictEqual(matchBegin("First-Héllo-Wo",         "snakeCase",      text), ["first_héllo_wo",         "First_Héllo_Wo",         "FIRST_HÉLLO_WO"]);
		// assert.deepStrictEqual(matchEnd(         "éllo_World_Last", "snakeCase",      text), [       "éllo_world_last",        "éllo_World_Last",        "ÉLLO_WORLD_LAST"]);
		// assert.deepStrictEqual(matchWhole("First/Héllo/World/Last", "snakeCase",      text), ["first_héllo_world_last", "First_Héllo_World_Last", "FIRST_HÉLLO_WORLD_LAST"]);
	});

	test('messageToRegexQuery_begin_end', () => {
		const text = `
		first.hello.world.last
		First.Hello.World.Last
		FIRST.HELLO.WORLD.LAST
		
		first-hello-world-last
		First-Hello-World-Last
		FIRST-HELLO-WORLD-LAST
		
		helloWorldLast
		firstHelloWorldLast
		FirstHelloWorldLast
		FIRSTHELLOWORLDLAST
		
		first_hello_world_last
		First_Hello_World_Last
		FIRST_HELLO_WORLD_LAST

		first_hell0_world_last
		First_Hell0_World_Last
		FIRST_HELL0_WORLD_LAST

		first_héllo_world_last
		First_Héllo_World_Last
		FIRST_HÉLLO_WORLD_LAST

		first hello world last
		First Hello World Last
		FIRST HELLO WORLD LAST
		
		first/hello/world/last
		First/Hello/World/Last
		FIRST/HELLO/WORLD/LAST
		`;

		// Match with beginWord using messageToRegexQuery
		function matchBegin(query: string, text: string): any {
			const regex = new RegExp(messageToRegexQuery(msgBeginWord(query))[0], "gui");
			return text.match(regex);
		}

		assert.deepStrictEqual(matchBegin( "irst-Hello-Wo", text), null);
		assert.deepStrictEqual(matchBegin(      "Hello-Wo", text), [      "hello-wo",       "Hello-Wo",       "HELLO-WO"]);
		assert.deepStrictEqual(matchBegin("First-Hello-Wo", text), ["first-hello-wo", "First-Hello-Wo", "FIRST-HELLO-WO"]);
		assert.deepStrictEqual(matchBegin( "irst_Hello_Wo", text), null);
		assert.deepStrictEqual(matchBegin(      "Hello_Wo", text), null);
		assert.deepStrictEqual(matchBegin("First_Hello_Wo", text), ["first_hello_wo", "First_Hello_Wo", "FIRST_HELLO_WO"]);

		// Match with endWord using messageToRegexQuery
		function matchEnd(query: string, text: string): any {
			const regex = new RegExp(messageToRegexQuery(msgEndWord(query))[0], "gui");
			return text.match(regex);
		}

		assert.deepStrictEqual(matchEnd("ello-World-Las",  text), null);
		assert.deepStrictEqual(matchEnd("ello-World",      text), ["ello-world",      "ello-World",      "ELLO-WORLD"]);
		assert.deepStrictEqual(matchEnd("ello-World-Last", text), ["ello-world-last", "ello-World-Last", "ELLO-WORLD-LAST"]);
		assert.deepStrictEqual(matchEnd("ello_World_Las",  text), null);
		assert.deepStrictEqual(matchEnd("ello_World",      text), null);
		assert.deepStrictEqual(matchEnd("ello_World_Last", text), ["ello_world_last", "ello_World_Last", "ELLO_WORLD_LAST"]);

		// beginWord + endWord = wholeWord which is managed by vscode
		// So no transformation and regex query = query
		assert.deepStrictEqual(messageToRegexQuery(msgWholeWord("irst/Hello/World/La")), ["irst/Hello/World/La", true]);
		assert.deepStrictEqual(messageToRegexQuery(msgWholeWord("irst_Hello_World")),    ["irst_Hello_World",    true]);
	});
});
