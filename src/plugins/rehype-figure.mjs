import { visit } from "unist-util-visit";
import { shouldAddNoReferrer } from "../utils/image-utils.ts";

/**
 * 清空正文图片的替代描述，同时保留图片来源的 referrerpolicy。
 *
 * @returns {Function} A transformer function for the rehype plugin
 */
export default function rehypeFigure() {
	return (tree) => {
		visit(tree, "element", (node) => {
			// 只处理 img 元素
			if (node.tagName !== "img") {
				return;
			}

			const imgProps = { ...node.properties, alt: "" };

			// 添加 referrerpolicy（如果需要）解决 403 问题
			// 无论是否有 alt，都要检查并添加 referrerpolicy
			if (imgProps.src && shouldAddNoReferrer(imgProps.src)) {
				imgProps.referrerpolicy = "no-referrer";
			}

			node.properties = imgProps;
		});
	};
}
