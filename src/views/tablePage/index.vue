<template>
  <div class="table-page">
    <section class="table-card">
      <header class="card-head">
        <h2>主题色表格</h2>

      </header>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th v-for="col in columns" :key="col.key">{{ col.title }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.id">
              <td v-for="col in columns" :key="col.key">
                <span v-if="col.key === 'status'" class="tag" :class="row.statusType">
                  {{ row.status }}
                </span>
                <template v-else>{{ row[col.key] }}</template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <footer class="card-foot">共 {{ rows.length }} 条记录</footer>
    </section>
  </div>
</template>

<script setup>
const columns = [
  { key: 'id', title: '编号' },
  { key: 'name', title: '主题名称' },
  { key: 'palette', title: '色板' },
  { key: 'colors', title: '色阶' },
  { key: 'status', title: '状态' },
  { key: 'date', title: '更新日期' },
]

const rows = [
  { id: 'TH-001', name: '默认青碧', palette: 'normal', colors: 'color1 ~ color7', status: '启用', statusType: 'ok', date: '2026-10-28' },
  { id: 'TH-002', name: '海洋蓝', palette: 'blue', colors: 'color1 ~ color7', status: '启用', statusType: 'ok', date: '2026-10-25' },
  { id: 'TH-003', name: '暖阳橙', palette: 'orange', colors: 'color1 ~ color7', status: '待审核', statusType: 'wait', date: '2026-10-22' },
  { id: 'TH-004', name: '自定义色板', palette: 'custom', colors: 'color1 ~ color7', status: '草稿', statusType: 'off', date: '2026-10-18' },
  { id: 'TH-005', name: '渐变流光', palette: 'normal', colors: 'color1 + color7', status: '启用', statusType: 'ok', date: '2026-10-12' },
  { id: 'TH-006', name: '庭院配色', palette: 'blue', colors: 'sceneColors', status: '待审核', statusType: 'wait', date: '2026-10-08' },
]
</script>

<style lang="scss" scoped>
.table-page {
  min-height: 100%;
  box-sizing: border-box;
  padding: 24px 28px 48px 130px;
  background: linear-gradient(135deg, var(--color1_3), var(--color2_1) 50%, var(--color1_2));
}

.table-card {
  max-width: 1080px;
  margin: 0 auto;
  padding: 20px 22px 14px;
  border-radius: 18px;
  border: 1px solid var(--color3_5);
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.88), rgba(255, 255, 255, 0.62));
  /* 模糊边：主题色投影 + 毛玻璃 */
  box-shadow: 0 14px 34px var(--color5_3), inset 0 1px 0 rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
}

.card-head h2 {
  margin: 0;
  font-size: 20px;
  color: var(--color7);
}

.card-head p {
  margin: 6px 0 16px;
  max-width: 560px;
  font-size: 12px;
  color: var(--gray6, var(--color6));
}

.table-wrap {
  border: 1px solid var(--color3_5);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 22px var(--color4_2);
  backdrop-filter: blur(6px);
}

table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

/* 表头：主题色渐变 + 主题色下边框 + 模糊高光 */
thead th {
  padding: 12px 14px;
  text-align: left;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.5px;
  color: var(--color7);
  background: linear-gradient(135deg, var(--color1_9), var(--color3_6));
  border-bottom: 2px solid var(--color4_7);
  box-shadow: 0 6px 14px var(--color4_3);
  backdrop-filter: blur(4px);
}

thead th:not(:last-child),
tbody td:not(:last-child) {
  border-right: 1px solid var(--color2_4);
}

tbody td {
  padding: 12px 14px;
  font-size: 13px;
  color: var(--color6);
  border-bottom: 1px solid var(--color2_4);
}

tbody tr:last-child td {
  border-bottom: none;
}

tbody tr:nth-child(even) {
  background: var(--color1_2);
}

tbody tr {
  transition: background-color 0.2s ease, box-shadow 0.2s ease;
}

tbody tr:hover {
  background: var(--color2_3);
  box-shadow: inset 3px 0 0 var(--color5), 0 4px 12px var(--color4_2);
}

.tag {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 12px;
  white-space: nowrap;
  color: var(--color6);
  border: 1px solid var(--color3_5);
  background: var(--color2_3);
}

.tag.wait {
  border-color: var(--color2_6);
  background: var(--color1_5);
}

.tag.off {
  color: var(--gray6, var(--color6));
  border-color: var(--gray3, var(--color2_4));
  background: var(--gray1, var(--color1_3));
}

.card-foot {
  margin-top: 12px;
  text-align: right;
  font-size: 12px;
  color: var(--gray5, var(--color5));
}

@media (max-width: 900px) {
  .table-page {
    padding-left: 24px;
    padding-top: 60px;
  }

  .card-head p {
    max-width: calc(100% - 320px);
  }

  .table-wrap {
    overflow-x: auto;
  }

  table {
    min-width: 720px;
  }
}
</style>
