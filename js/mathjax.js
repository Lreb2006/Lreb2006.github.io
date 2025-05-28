// 全局配置对象，用于初始化 MathJax
window.MathJax = {
  // TeX 输入处理器的配置
  tex: {
    // 定义行内数学公式的界定符，例如 \( ... \)
    inlineMath: [["\\(", "\\)"]],
    // 定义块级数学公式的界定符，例如 \[ ... \]
    displayMath: [["\[", "\]"]],
    // 是否处理 TeX 转义字符，如 \रेखा
    processEscapes: true,
    // 是否处理 TeX 环境，如 \begin{equation} ... \end{equation}
    processEnvironments: true
  },
  // MathJax 的其他选项配置
  options: {
    // 定义一个正则表达式，匹配那些 MathJax 应该忽略处理的 HTML 元素的类名
    // ".*|" 表示忽略所有类名，通常与 processHtmlClass 配合使用，明确指定要处理的类
    ignoreHtmlClass: ".*|",
    // 定义一个正则表达式，匹配那些 MathJax 应该处理的 HTML 元素的类名
    // 这里指定只处理类名为 "arithmatex" 的元素中的数学公式
    processHtmlClass: "arithmatex"
  }
};

// 订阅 MkDocs Material 主题的文档加载/更新事件
// 当文档内容动态加载或发生变化时（例如，通过即时加载或搜索结果导航），此回调函数将被执行
document$.subscribe(() => { 
  // 清除 MathJax 的输出缓存，确保重新渲染时使用的是最新的样式和数据
  MathJax.startup.output.clearCache();
  // 清除之前所有已排版的数学公式，为重新排版做准备
  MathJax.typesetClear();
  // 重置 TeX 输入处理器的内部状态，例如宏定义和计数器
  MathJax.texReset();
  // 异步执行 MathJax 的排版过程，处理文档中所有符合配置的数学公式
  MathJax.typesetPromise();
}); 