/**
 * Given an dom node, return the closest parent, including itself, that is scrollable
 */
export default function getScrollParent(node) {
	//Some browsers (Edge) will occasionally set scroll height 1 px larger than client height on nodes that aren't the true scroll parent
	if (node == null || node.scrollHeight > node.clientHeight+1 && /scroll|auto/.test(getComputedStyle(node).overflowY)) {
		return node;
	}
	return getScrollParent(node.parentNode);
}
