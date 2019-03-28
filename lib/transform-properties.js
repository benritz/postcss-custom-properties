import valueParser from 'postcss-values-parser';
import transformValueAST from './transform-value-ast';

// transform custom pseudo selectors with custom selectors
export default (root, customProperties, opts) => {
	const transformDecl = (decl) => {
		const originalValue = decl.value;
		const valueAST = valueParser(originalValue).parse();
		const value = String(transformValueAST(valueAST, customProperties));

		// conditionally transform values that have changed
		if (value !== originalValue) {
			if (opts.preserve) {
				decl.cloneBefore({ value });
			} else {
				decl.value = value;
			}
		}
	};

	if (opts.extractRules) {
		// transform declarations + remove non-transformable
		root.walkDecls(decls => {
			if (decls.type === 'decl' && isTransformableDecl(decls)) {
				transformDecl(decls);
			} else {
				decls.remove();
			}
		});

		// remove comments and empty rules
		root.walkComments(comment => comment.remove());
		root.walkRules(rule => rule.some(() => true) || rule.remove());
		root.walkAtRules(rule => rule.some(() => true) || rule.remove());
	} else {
		// walk decls that can be transformed
		root.walkDecls(decl => {
			if (isTransformableDecl(decl)) {
				transformDecl(decl);
			}
		});
	}
};

// match custom properties
const customPropertyRegExp = /^--[A-z][\w-]*$/;

// match custom property inclusions
const customPropertiesRegExp = /(^|[^\w-])var\([\W\w]+\)/;

// whether the declaration should be potentially transformed
const isTransformableDecl = decl => !customPropertyRegExp.test(decl.prop) && customPropertiesRegExp.test(decl.value);
