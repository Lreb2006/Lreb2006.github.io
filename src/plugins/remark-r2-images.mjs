import { readFileSync } from "node:fs";
import { visit } from "unist-util-visit";

export default function remarkR2Images() {
	return (tree) => {
		const manifest = JSON.parse(
			readFileSync(
				new URL("../data/image-manifest.json", import.meta.url),
				"utf8",
			),
		);
		visit(tree, (node) => {
			if (["image", "definition"].includes(node.type) && manifest[node.url])
				node.url = manifest[node.url].url;
			if (
				node.type === "element" &&
				node.tagName === "img" &&
				manifest[node.properties?.src]
			)
				node.properties.src = manifest[node.properties.src].url;
			if (
				node.type === "mdxJsxFlowElement" ||
				node.type === "mdxJsxTextElement"
			) {
				if (node.name === "img")
					for (const attr of node.attributes ?? [])
						if (
							attr.name === "src" &&
							typeof attr.value === "string" &&
							manifest[attr.value]
						)
							attr.value = manifest[attr.value].url;
			}
		});
	};
}
