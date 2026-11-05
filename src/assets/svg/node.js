import * as fs from 'node:fs';
import * as path from 'node:path';
// const path = require('path');

// 配置要处理的目录（修改为你自己的路径）
const SVG_DIR = './';

// 预编译正则表达式
const fillRegex = /fill\s*=\s*("|')[^"']*("|')/gi;
const strokeRegex = /stroke\s*=\s*("|')[^"']*("|')/gi;
const styleFillRegex = /fill\s*:\s*[^;]+;/gi;
const styleStrokeRegex = /stroke\s*:\s*[^;]+;/gi;
const emptyStyleRegex = /style\s*=\s*("|')\s*("|')/gi;
const cleanStyleRegex = /;\s*;/g;
const trimStyleRegex = /^\s*;|;\s*$/g;

// 用于存储处理结果
const results = {
  total: 0,
  processed: 0,
  errors: []
};

// 处理单个 SVG 文件
function processSvgFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    results.total++;

    // 移除 fill 和 stroke 属性
    let newContent = content
      .replace(fillRegex, '')
      .replace(strokeRegex, '');

    // 处理内联样式
    newContent = newContent.replace(/style\s*=\s*("|')(.*?)("|')/gi, (match, p1, styleContent, p3) => {
      let newStyle = styleContent
        .replace(styleFillRegex, '')
        .replace(styleStrokeRegex, '')
        .replace(cleanStyleRegex, ';')
        .replace(trimStyleRegex, '')
        .trim();

      if (newStyle === '') {
        return ''; // 移除空的 style 属性
      }
      return `style=${p1}${newStyle}${p3}`;
    });

    // 移除空的 style 属性
    newContent = newContent.replace(emptyStyleRegex, '');

    // 修复多个空格
    newContent = newContent.replace(/\s{2,}/g, ' ');

    // 仅当内容有变化时才写入文件
    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      results.processed++;
      console.log(`✅ 已处理: ${path.relative(process.cwd(), filePath)}`);
    } else {
      console.log(`ℹ️  无需处理: ${path.relative(process.cwd(), filePath)}`);
    }

  } catch (error) {
    results.errors.push({
      file: filePath,
      error: error.message
    });
    console.error(`❌ 处理失败 ${path.relative(process.cwd(), filePath)}: ${error.message}`);
  }
}

// 递归遍历目录
function traverseDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.error(`❌ 目录不存在: ${dirPath}`);
    process.exit(1);
  }

  const items = fs.readdirSync(dirPath);

  items.forEach(item => {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      traverseDir(fullPath);
    } else if (stat.isFile() && path.extname(item).toLowerCase() === '.svg') {
      processSvgFile(fullPath);
    }
  });
}

// 主函数
function main() {
  console.log(`🔍 正在处理目录: ${SVG_DIR}`);
  console.log('----------------------------------------');

  // 开始处理
  const startTime = Date.now();
  traverseDir(SVG_DIR);
  const endTime = Date.now();

  // 输出结果
  console.log('\n----------------------------------------');
  console.log('📊 处理结果:');
  console.log(`📁 总文件数: ${results.total}`);
  console.log(`✅ 成功处理: ${results.processed}`);
  console.log(`❌ 失败文件: ${results.errors.length}`);

  if (results.errors.length > 0) {
    console.log('\n🔴 错误详情:');
    results.errors.forEach(err => {
      console.log(`  - ${path.relative(process.cwd(), err.file)}: ${err.error}`);
    });
  }

  console.log(`\n⏱️  耗时: ${((endTime - startTime) / 1000).toFixed(2)} 秒`);

  if (results.processed > 0) {
    console.log('\n💡 提示: 已移除所有 SVG 文件中的 fill 和 stroke 属性');
    console.log('   这样可以在 CSS 中使用 currentColor 控制颜色');
  }

  if (results.errors.length === results.total && results.total > 0) {
    process.exit(1);
  }
}

// 执行主函数
main();