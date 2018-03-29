import assignWith from 'lodash-es/assignWith';
import mapValues from 'lodash-es/mapValues';

/**
 * Merge each entity's keys keeping existing keys that are not present
 * in the new object.
 */
function entityMerge(oldObj, ...newObjs) {
	return assignWith({}, oldObj, ...newObjs, (objValue, srcValue) => ({
		...(objValue || {}),
		...srcValue
	}));
}

export default function entitiesMerge(state, entities) {
	if (!entities) { return state; }
	return mapValues(state, (v, k) => entityMerge(state[k], entities[k] || {}));
}
