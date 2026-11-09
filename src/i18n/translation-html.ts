import type { Root, RootContent, Text } from "hast";
import { isArticleText, skipArticleElement } from "./article-translation";

export function collectHtmlTextNodes(node: Root | RootContent): Text[] {
	if (node.type === "text") return isArticleText(node.value) ? [node] : [];
	if (node.type === "root") return node.children.flatMap(collectHtmlTextNodes);
	if (node.type !== "element") return [];
	const { className, translate } = node.properties;
	if (
		translate === "no" ||
		skipArticleElement(
			node.tagName,
			Array.isArray(className) ? className.map(String) : [],
		)
	)
		return [];
	return node.children.flatMap(collectHtmlTextNodes);
}
