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
		// extract rules with transformed decls
		root.walk(node => {
			if (node.type === 'rule') {
				// transform + remove non-transformable declarations
				node.walk(sub => {
					if (sub.type === 'decl' && isTransformableDecl(sub)) {
						transformDecl(sub);
					} else {
						sub.remove();
					}
				});

				// remove empty rules
				if (!node.some(() => true)) {
					node.remove();
				}
			} else if (node.type === 'decl') {
				// ignore declarations, they are processed for each rule
			} else {
				// remove @ rules and comments
				node.remove();
			}
		});
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
