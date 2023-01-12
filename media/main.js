'use strict'
//@ts-check
// 脚本在webview内运行不能直接访问 VS Code API，使用acquireVsCodeApi获取
// https://code.visualstudio.com/api/extension-guides/webview
;(function () {
  const vscode = acquireVsCodeApi();
  //调用getState获取持久化的数据
  const oldState = vscode.getState() || { colors: [] };
  /** @type {Array<{ value: string }>} */
  let colors = oldState.colors;
  updateColorList(colors);
  document.querySelector('#colorPicker').addEventListener('change', event => {
    addColor(event?.target?.value);
  });
  // 处理从插件发送到 webview 的消息
  window.addEventListener('message', event => {
    const message = event.data;
    if (message.type === 'clearColors') {
      colors = [];
      updateColorList(colors);
    }
  });
  /**
   * @param {Array<{ value: string }>} colors
   */
  //更新颜色列表
  function updateColorList(colors) {
    const ul = document.querySelector('.color-list');
    ul.textContent = '';
    for (const color of colors) {
      const li = document.createElement('li');
      li.className = 'color-entry';
      const colorPreview = document.createElement('div');
      colorPreview.className = 'color-preview';
      colorPreview.style.backgroundColor = `${color.value}`;
      colorPreview.addEventListener('click', () => {
        onColorClicked(color.value);
      });
      li.appendChild(colorPreview);
      const input = document.createElement('input');
      input.className = 'color-input';
      input.type = 'text';
      input.value = color.value;
      input.addEventListener('change', e => {
        const value = e.target.value;
        if (!value) {
          colors.splice(colors.indexOf(color), 1);
        } else {
          color.value = value;
        }
        updateColorList(colors);
      });
      li.appendChild(input);
      ul.appendChild(li);
    }
    vscode.setState({ colors: colors });
  }
  //添加颜色
  function addColor(color) {
    colors.unshift({ value: color });
    updateColorList(colors);
  }
  //点击颜色复制
  function onColorClicked(color) {
    console.log('colorSelected', color);
    const el = document.createElement('input');
    el.setAttribute('value', color);
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    vscode.postMessage({ type: 'colorSelected', value: color });
  }
})();
//# sourceMappingURL=main.js.map
