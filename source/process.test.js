import path from 'path';
import test from 'ava';
import {stripIndent} from 'common-tags';

import process from './process';

test('should leave non-pattern js alone', async t => {
	const code = stripIndent`
		import b from 'b';
	`;

	const expected = stripIndent`
		import b from 'b';
	`;

	const [actual] = process(code, neutral`fixtures/no-pattern/a.js`);
	t.is(actual, expected);
});

test('should leave non-root pattern js alone', async t => {
	const code = stripIndent`
		import b from 'b';
	`;

	const expected = stripIndent`
		import b from 'b';
	`;

	const [actual] = process(code, neutral`fixtures/no-root/c/a/index.js`);
	t.is(actual, expected);
});

test('should leave patterns without deps', async t => {
	const code = stripIndent`
		import b from 'b';
	`;

	const expected = stripIndent`
		import b from 'b';
	`;

	const [actual] = process(code, neutral`fixtures/no-deps/patterns/a/index.js`);
	t.is(actual, expected);
});

test('should leave patterns with empty deps', async t => {
	const code = stripIndent`
		import b from 'b';
	`;

	const expected = stripIndent`
		import b from 'b';
	`;

	const [actual] = process(code, neutral`fixtures/empty-deps/patterns/a/index.js`);
	t.is(actual, expected);
});

test('should resolve pattern references', async t => {
	const code = stripIndent`
		import b from "b";
	`;

	const expected = stripIndent`
		import b from "../b";
	`;

	const [actual] = process(code, neutral`fixtures/pattern/patterns/a/index.js`);
	t.is(actual, expected);
});

test('should resolve es5 pattern references', async t => {
	const code = stripIndent`
		const b = require("b");
	`;

	const expected = stripIndent`
		const b = require("../b");
	`;

	const [actual] = process(code, neutral`fixtures/pattern/patterns/a/index.js`);
	t.is(actual, expected);
});

test('should resolve flowtype pattern references', async t => {
	const code = stripIndent`
		import type b from 'b';
	`;

	const expected = stripIndent`
		import type b from '../b';
	`;

	const [actual] = process(code, neutral`fixtures/pattern/patterns/a/index.js`);
	t.is(actual, expected);
});

test('should resolve named flowtype pattern references', async t => {
	const code = stripIndent`
		import type {someModule} from 'b';
	`;

	const expected = stripIndent`
		import type {someModule} from '../b';
	`;

	const [actual] = process(code, neutral`fixtures/pattern/patterns/a/index.js`);
	t.is(actual, expected);
});

test('should account for offsets when resolving multiple entries', async t => {
	const code = stripIndent`
		// @flow
		import spaces from 'Pattern';
		import type {Spaces} from 'Pattern';

		export default SpacesDemo;
	`;

	const expected = stripIndent`
		// @flow
		import spaces from './';
		import type {Spaces} from './';

		export default SpacesDemo;
	`;

	const [actual] = process(code, neutral`fixtures/pattern/patterns/a/index.js`);
	t.is(actual, expected);
});

test('should account for offsets when resolving multiple entries with extensions', async t => {
	const code = stripIndent`
		// @flow
		import type {Spaces} from 'b';
		import spaces from 'Pattern';

		export default SpacesDemo;
	`;

	const expected = stripIndent`
		// @flow
		import type {Spaces} from '../b/index.jsx';
		import spaces from './index.jsx';

		export default SpacesDemo;
	`;

	const [actual] = process(code, neutral`fixtures/pattern/patterns/a/index.jsx`);
	t.is(actual, expected);
});

test('should respect source extenseion for pattern reference', async t => {
	const code = stripIndent`
		import b from "b";
	`;

	const expected = stripIndent`
		import b from "../b/index.jsx";
	`;

	const [actual] = process(code, neutral`fixtures/pattern/patterns/a/index.jsx`);
	t.is(actual, expected);
});

test('should resolve demo pattern references', async t => {
	const code = stripIndent`
		import b from "Pattern";
	`;

	const expected = stripIndent`
		import b from "./";
	`;

	const [actual] = process(code, neutral`fixtures/pattern/patterns/a/demo.js`);
	t.is(actual, expected);
});

test('should resolve es5 demo pattern references', async t => {
	const code = stripIndent`
		const b = require("Pattern");
	`;

	const expected = stripIndent`
		const b = require("./");
	`;

	const [actual] = process(code, neutral`fixtures/pattern/patterns/a/demo.js`);
	t.is(actual, expected);
});

test('should respect source extension for demo pattern reference', async t => {
	const code = stripIndent`
		import b from "Pattern";
	`;

	const expected = stripIndent`
		import b from "./index.jsx";
	`;

	const [actual] = process(code, neutral`fixtures/pattern/patterns/a/demo.jsx`);
	t.is(actual, expected);
});

function neutral(strings) {
	return strings
		.map(string => string.replace(/\//g, path.sep))
		.join('');
}
