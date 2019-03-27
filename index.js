import postcss from 'postcss';
import getCustomPropertiesFromRoot from './lib/get-custom-properties-from-root';
import getCustomPropertiesFromImports from './lib/get-custom-properties-from-imports';
import transformProperties from './lib/transform-properties';
import writeCustomPropertiesToExports from './lib/write-custom-properties-to-exports';

export default postcss.plugin('postcss-custom-properties', opts => {
	// whether to preserve custom selectors and rules using them
	const preserve = 'preserve' in Object(opts) ? Boolean(opts.preserve) : true;
	const extractRules = 'extractRules' in Object(opts) ? Boolean(opts.extractRules) : false;

	// sources to import custom selectors from
	const importFrom = [].concat(Object(opts).importFrom || []);

	// destinations to export custom selectors to
	const exportTo = [].concat(Object(opts).exportTo || []);

	// promise any custom selectors are imported
	const customPropertiesPromise = getCustomPropertiesFromImports(importFrom);

	return async root => {
		const customProperties = Object.assign(
			await customPropertiesPromise,
			getCustomPropertiesFromRoot(root, { preserve })
		);

		await writeCustomPropertiesToExports(customProperties, exportTo);

		transformProperties(root, customProperties, { preserve, extractRules });
	};
});
